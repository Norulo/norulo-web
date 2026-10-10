import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { noruloApi } from "../api/norulo.js";
import { setLang } from "../i18n.jsx";
import { StatusScreen } from "./legal.jsx";

vi.mock("../api/norulo.js", () => ({
  noruloApi: {
    system: {
      health: vi.fn(),
    },
  },
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("StatusScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLang("en");
  });

  it("reports API reachability and backend information without claiming full service availability", async () => {
    noruloApi.system.health.mockResolvedValue({
      ok: true,
      service: "norulo-server",
      mode: "preview",
      database: {
        type: "d1",
        configured: true,
        path: "/private/ledger.db",
      },
    });

    render(<StrictMode><StatusScreen go={vi.fn()} /></StrictMode>);

    expect(await screen.findByText("API reachable")).toBeInTheDocument();
    expect(noruloApi.system.health).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Scan system")).not.toBeInTheDocument();
    expect(noruloApi.system.status).toBeUndefined();
    expect(screen.getByText(/d1: backend reported by API/i)).toBeInTheDocument();
    expect(screen.getByText(/does not verify ledger writes, GitHub authorization or payments/i)).toBeInTheDocument();
    expect(screen.getByText("Loaded in this browser")).toBeInTheDocument();
    expect(screen.queryByText(/^operational$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/private\/ledger\.db/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Elevated scan latency/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Brief web app outage/i)).not.toBeInTheDocument();
  });

  it("describes optional GitHub and billing fields as configuration rather than operational checks", async () => {
    noruloApi.system.health.mockResolvedValue({
      ok: true,
      service: "norulo-server",
      database: { type: "d1", configured: true, path: "/private/ledger.db" },
      github: { oauthConfigured: true, appInstallConfigured: true, appApiConfigured: false },
      billing: { provider: "disabled", enabled: false },
      scanSystem: { queuedJobs: 5, busyWorkerCount: 1 },
      availableReviewModels: [{ provider: "old", model: "old-model" }],
    });

    render(<StatusScreen go={vi.fn()} />);

    expect(await screen.findByText("Reported configuration")).toBeInTheDocument();
    expect(screen.getByText("Incomplete configuration")).toBeInTheDocument();
    expect(screen.getByText("Configuration flags do not verify integration availability")).toBeInTheDocument();
    expect(screen.getByText(/OAuth configured/i)).toBeInTheDocument();
    expect(screen.getByText(/App API missing/i)).toBeInTheDocument();
    expect(screen.getByText(/disabled \(not enabled\)/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Scan system|Review runtimes|old-model|queued/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\/private\/ledger\.db/i)).not.toBeInTheDocument();
  });

  it("keeps fully configured providers distinct from successful authorization or payment acceptance", async () => {
    noruloApi.system.health.mockResolvedValue({
      ok: true,
      service: "norulo-server",
      github: { oauthConfigured: true, appInstallConfigured: true, appApiConfigured: true },
      billing: { provider: "creem", enabled: true },
    });

    render(<StatusScreen go={vi.fn()} />);

    expect(await screen.findByText("Reported configuration")).toBeInTheDocument();
    const githubRow = screen.getByText("GitHub integration").closest(".status-row");
    const billingRow = screen.getByText("Billing provider").closest(".status-row");
    const databaseRow = screen.getByText("Database backend").closest(".status-row");
    expect(within(githubRow).getByText("Configured")).toBeInTheDocument();
    expect(within(billingRow).getByText("enabled")).toBeInTheDocument();
    expect(within(databaseRow).getByText("Not reported")).toBeInTheDocument();
    expect(within(databaseRow).getByText("No database information reported.")).toBeInTheDocument();
    expect(screen.queryByText(/^operational$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^degraded$/i)).not.toBeInTheDocument();
  });

  it("allows an explicit refresh to fail and recover without repeating the request automatically", async () => {
    const freshHealth = deferred();
    noruloApi.system.health
      .mockResolvedValueOnce({ ok: true, service: "norulo-server" })
      .mockRejectedValueOnce(new Error("Newer health check failed"))
      .mockReturnValueOnce(freshHealth.promise);

    render(<StatusScreen go={vi.fn()} />);

    expect(await screen.findByText("API reachable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh status" }));

    await waitFor(() => expect(noruloApi.system.health).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
    expect(screen.getByText("Newer health check failed")).toBeInTheDocument();
    expect(noruloApi.system.health).toHaveBeenCalledTimes(2);
    const refresh = screen.getByRole("button", { name: "Refresh status" });
    fireEvent.click(refresh);
    fireEvent.click(refresh);
    await waitFor(() => expect(noruloApi.system.health).toHaveBeenCalledTimes(3));
    expect(refresh).toBeDisabled();

    await act(async () => {
      freshHealth.resolve({
        ok: true,
        service: "norulo-server",
        mode: "production",
        database: { type: "d1", configured: true, path: "/private/ledger.db" },
      });
      await freshHealth.promise;
    });

    expect(screen.getByText("API reachable")).toBeInTheDocument();
    expect(screen.queryByText("API unreachable")).not.toBeInTheDocument();
    expect(refresh).toBeEnabled();
  });

  it("never polls or repeats health reads on visibility changes and aborts the initial request when unmounted", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const healthSignals = [];
    noruloApi.system.health.mockImplementation(({ signal } = {}) => {
      healthSignals.push(signal);
      return new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          { once: true }
        );
      });
    });
    const { unmount } = render(<StatusScreen go={vi.fn()} />);

    try {
      await waitFor(() => expect(noruloApi.system.health).toHaveBeenCalledTimes(1));
      vi.useFakeTimers();
      await act(async () => vi.advanceTimersByTime(120_000));
      expect(noruloApi.system.health).toHaveBeenCalledTimes(1);

      visibility.mockReturnValue("visible");
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      expect(noruloApi.system.health).toHaveBeenCalledTimes(1);
      expect(healthSignals[0].aborted).toBe(false);

      visibility.mockReturnValue("hidden");
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      expect(healthSignals[0].aborted).toBe(false);

      visibility.mockReturnValue("visible");
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      expect(noruloApi.system.health).toHaveBeenCalledTimes(1);

      unmount();
      expect(healthSignals[0].aborted).toBe(true);
    } finally {
      vi.useRealTimers();
      visibility.mockRestore();
    }
  });
});
