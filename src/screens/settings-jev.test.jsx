import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/http.js";
import { noruloApi } from "../api/norulo.js";
import { WorkspaceContext } from "../components/workspace-context.jsx";
import { connectGitHubRepositories, signOut } from "../lib/auth.js";
import { SettingsScreen } from "./settings.jsx";

vi.mock("../api/norulo.js", () => ({
  noruloApi: {
    auth: { getSession: vi.fn(), requestEmailCode: vi.fn(), verifyEmailCode: vi.fn() },
    integrations: { list: vi.fn() },
    account: {
      getJev: vi.fn(),
      updateJev: vi.fn(),
      getExpenseRetention: vi.fn(),
      updateExpenseRetention: vi.fn(),
    },
  },
}));
vi.mock("../lib/auth.js", () => ({
  connectGitHubRepositories: vi.fn(),
  manageGitHubInstallation: vi.fn(),
  signOut: vi.fn(),
}));

const account = {
  authenticated: true,
  user: { id: "actor_1", name: "Personal account", providers: ["github"] },
};
const on = { enabled: true, revision: 7, eligible: true, available: true, monthlyBudgetUsd: "3" };
const off = { ...on, enabled: false, available: false, revision: 8 };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function renderSettings(props = {}) {
  const go = vi.fn(),
    onSelect = vi.fn();
  const shared = { id: "shared_owner_other", name: "Other owner's ledger", role: "viewer" };
  const view = render(
    <WorkspaceContext.Provider
      value={{
        workspace: shared,
        items: [shared, { ...shared, id: "own_ledger", name: "My ledger", role: "owner" }],
        onSelect,
      }}
    >
      <SettingsScreen go={go} {...props} />
    </WorkspaceContext.Provider>
  );
  return { ...view, go, onSelect };
}
async function readySwitch() {
  await screen.findByText("Personal account");
  const control = screen.getByRole("switch", { name: "Enable Jev" });
  await waitFor(() => expect(control).toBeEnabled());
  return control;
}

describe("personal Jev preference", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    noruloApi.auth.getSession.mockResolvedValue(account);
    noruloApi.account.getExpenseRetention.mockResolvedValue({
      autoRemoveOldestExpense: false,
      revision: 1,
    });
    noruloApi.integrations.list.mockResolvedValue({
      github: { connected: false, repositories: [], installations: [] },
    });
    noruloApi.account.getJev.mockResolvedValue(on);
    noruloApi.account.updateJev.mockResolvedValue(off);
  });

  it("loads the personal preference independently of a selected shared ledger without writing", async () => {
    renderSettings();
    expect(await readySwitch()).toBeChecked();
    expect(screen.getByText(/your own ledger and its shared members/)).toBeInTheDocument();
    expect(screen.getByText(/Monthly model allowance/)).toHaveTextContent("3");
    expect(noruloApi.account.getJev).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(noruloApi.account.updateJev).not.toHaveBeenCalled();
  });

  it("keeps a paid saved On preference checked while the runtime is unavailable", async () => {
    noruloApi.account.getJev.mockResolvedValue({
      ...on,
      available: false,
      monthlyBudgetUsd: "5.000000",
    });
    renderSettings();
    expect(await readySwitch()).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Your saved preference is on");
    expect(screen.getByText(/Monthly model allowance/)).toHaveTextContent("5.000000");
  });

  it.each([true, false])(
    "renders Free as effectively Off without modifying stored enabled=%s",
    async (enabled) => {
      noruloApi.account.getJev.mockResolvedValue({
        ...on,
        enabled,
        eligible: false,
        available: false,
      });
      const { go } = renderSettings();
      await screen.findByText("Personal account");
      const control = screen.getByRole("switch", { name: "Enable Jev" });
      expect(control).not.toBeChecked();
      expect(control).toBeDisabled();
      fireEvent.click(control);
      expect(noruloApi.account.updateJev).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "View plans" }));
      expect(go).toHaveBeenCalledWith("pricing");
    }
  );

  it("retains the confirmed value and locks conflicting controls through the required refresh", async () => {
    const write = deferred(),
      refresh = deferred(),
      onOperationBusy = vi.fn();
    noruloApi.account.updateJev.mockReturnValueOnce(write.promise);
    noruloApi.account.getJev.mockResolvedValueOnce(on).mockReturnValueOnce(refresh.promise);
    const { go, onSelect } = renderSettings({ onOperationBusy });
    const control = await readySwitch();
    fireEvent.click(control);
    expect(control).toBeChecked();
    expect(control).toBeDisabled();
    for (const name of ["Reload", "Sign out", "Connect repositories", "Send code"])
      expect(screen.getByRole("button", { name })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Select ledger" })).toBeDisabled();
    const projects = screen.getByRole("link", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(projects);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(go).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
    expect(noruloApi.account.updateJev).toHaveBeenCalledWith(7, false, {
      signal: expect.any(AbortSignal),
    });
    await act(async () => write.resolve(off));
    expect(control).not.toBeChecked();
    expect(control).toBeDisabled();
    expect(onOperationBusy).toHaveBeenLastCalledWith(true);
    expect(noruloApi.auth.getSession).toHaveBeenCalledTimes(1);
    expect(noruloApi.integrations.list).toHaveBeenCalledTimes(1);
    await act(async () => refresh.resolve(off));
    expect(control).toBeEnabled();
    expect(onOperationBusy).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("status")).toHaveTextContent("Local duplicate checks remain available");
  });

  it("uses one synchronous mutex for Jev and email or GitHub authorization", async () => {
    const write = deferred();
    noruloApi.account.updateJev.mockReturnValueOnce(write.promise);
    renderSettings();
    const control = await readySwitch();
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "new@example.com" },
    });
    act(() => {
      fireEvent.click(control);
      fireEvent.click(control);
      fireEvent.click(screen.getByRole("button", { name: "Send code" }));
      fireEvent.click(screen.getByRole("button", { name: "Connect repositories" }));
    });
    expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
    expect(noruloApi.auth.requestEmailCode).not.toHaveBeenCalled();
    expect(connectGitHubRepositories).not.toHaveBeenCalled();
    await act(async () => write.resolve(off));
  });

  it("requires an explicit reload after 412 and uses the newly read preference revision", async () => {
    noruloApi.account.updateJev.mockRejectedValueOnce(
      new ApiError("conflict", { status: 412, payload: { code: "PRECONDITION_FAILED" } })
    );
    noruloApi.account.getJev
      .mockResolvedValueOnce(on)
      .mockResolvedValueOnce({ ...on, revision: 9 })
      .mockResolvedValueOnce({ ...off, revision: 10 });
    noruloApi.account.updateJev.mockResolvedValueOnce({ ...off, revision: 10 });
    renderSettings();
    const control = await readySwitch();
    fireEvent.click(control);
    expect(await screen.findByRole("alert")).toHaveTextContent("Reload and choose again");
    expect(control).toBeChecked();
    expect(control).toBeDisabled();
    expect(noruloApi.account.getJev).toHaveBeenCalledTimes(1);
    expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(control).toBeEnabled());
    expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
    fireEvent.click(control);
    await waitFor(() => expect(control).toBeEnabled());
    expect(noruloApi.account.updateJev).toHaveBeenLastCalledWith(9, false, {
      signal: expect.any(AbortSignal),
    });
    expect(control).not.toBeChecked();
  });

  it("keeps the accepted server preference if the required GET fails and disables another write until Reload", async () => {
    noruloApi.account.getJev
      .mockResolvedValueOnce(on)
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValueOnce(off);
    renderSettings();
    const control = await readySwitch();
    fireEvent.click(control);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "was saved, but current status could not be refreshed"
    );
    expect(control).not.toBeChecked();
    expect(control).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled();
    fireEvent.click(control);
    expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(control).toBeEnabled());
    expect(control).not.toBeChecked();
  });

  it.each([7, 10])(
    "rejects a changed preference response with an unexpected revision %s",
    async (revision) => {
      noruloApi.account.updateJev.mockResolvedValueOnce({ ...off, revision });
      renderSettings();
      const control = await readySwitch();
      fireEvent.click(control);
      expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
      expect(control).toBeChecked();
      expect(control).toBeDisabled();
      expect(noruloApi.account.getJev).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    { ...on, revision: 0 },
    { ...on, revision: Number.MAX_SAFE_INTEGER + 1 },
    { ...on, enabled: "true" },
    { ...on, monthlyBudgetUsd: "NaN" },
    { ...on, eligible: false, available: true },
  ])("fails closed on an invalid account preference DTO %#", async (payload) => {
    noruloApi.account.getJev.mockResolvedValue(payload);
    renderSettings();
    expect(await screen.findByRole("alert")).toHaveTextContent("Jev settings could not be loaded");
    expect(screen.getByRole("switch", { name: "Enable Jev" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "View plans" })).not.toBeInTheDocument();
    expect(noruloApi.account.updateJev).not.toHaveBeenCalled();
  });

  it("keeps mutation controls disabled during initial reads while allowing navigation", async () => {
    const read = deferred();
    noruloApi.account.getJev.mockReturnValueOnce(read.promise);
    const { go } = renderSettings();
    expect(screen.getByRole("switch", { name: "Enable Jev" })).toBeDisabled();
    const projects = screen.getByRole("link", { name: "Projects" });
    expect(projects).toHaveAttribute("href");
    fireEvent.click(projects);
    expect(go).toHaveBeenCalledWith("ledgerProjects");
    await act(async () => read.resolve(on));
  });

  it.each([401, 403])(
    "clears protected Jev state after a %s write rejection without retrying",
    async (status) => {
      noruloApi.account.updateJev.mockRejectedValueOnce(
        new ApiError("denied", {
          status,
          payload: { code: status === 403 ? "JEV_PLAN_REQUIRED" : "UNAUTHENTICATED" },
        })
      );
      renderSettings();
      const control = await readySwitch();
      fireEvent.click(control);
      await screen.findByRole("alert");
      expect(control).toBeDisabled();
      expect(control).not.toBeChecked();
      expect(screen.queryByText(/Monthly model allowance/)).not.toBeInTheDocument();
      expect(noruloApi.account.getJev).toHaveBeenCalledTimes(1);
      expect(noruloApi.account.updateJev).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled();
    }
  );

  it("aborts unmounted writes and discards a late success without requesting a refresh", async () => {
    const write = deferred(),
      onOperationBusy = vi.fn();
    noruloApi.account.updateJev.mockReturnValueOnce(write.promise);
    const first = renderSettings({ onOperationBusy });
    fireEvent.click(await readySwitch());
    const signal = noruloApi.account.updateJev.mock.calls[0][2].signal;
    first.unmount();
    expect(signal.aborted).toBe(true);
    expect(onOperationBusy).toHaveBeenLastCalledWith(false);
    noruloApi.auth.getSession.mockResolvedValue({
      ...account,
      user: { ...account.user, id: "actor_2" },
    });
    noruloApi.account.getJev.mockResolvedValue({ ...on, monthlyBudgetUsd: "5" });
    renderSettings();
    expect(await readySwitch()).toBeChecked();
    await act(async () => write.resolve(off));
    expect(noruloApi.account.getJev).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("switch", { name: "Enable Jev" })).toBeChecked();
  });

  it("discards an old account read after an identity remount without clearing the new preference", async () => {
    const oldRead = deferred();
    noruloApi.account.getJev.mockReturnValueOnce(oldRead.promise);
    const first = renderSettings();
    const signal = noruloApi.account.getJev.mock.calls[0][0].signal;
    first.unmount();
    expect(signal.aborted).toBe(true);
    noruloApi.auth.getSession.mockResolvedValue({
      ...account,
      user: { ...account.user, id: "actor_2" },
    });
    noruloApi.account.getJev.mockResolvedValue({ ...on, revision: 10, monthlyBudgetUsd: "5" });
    renderSettings();
    expect(await readySwitch()).toBeChecked();
    await act(async () => oldRead.resolve({ ...off, eligible: false }));
    expect(screen.getByRole("switch", { name: "Enable Jev" })).toBeChecked();
    expect(screen.getByText(/Monthly model allowance/)).toHaveTextContent("5");
    expect(screen.queryByRole("button", { name: "View plans" })).not.toBeInTheDocument();
  });

  it("restores keyboard focus after the switch is enabled again without stealing an outside focus", async () => {
    const write = deferred(),
      refresh = deferred();
    noruloApi.account.updateJev.mockReturnValueOnce(write.promise);
    noruloApi.account.getJev.mockResolvedValueOnce(on).mockReturnValueOnce(refresh.promise);
    renderSettings();
    const control = await readySwitch();
    control.focus();
    await userEvent.keyboard(" ");
    const panel = screen.getByRole("region", { name: "Jev settings" });
    expect(within(panel).getByText(/Controls Jev for your own ledger/)).toHaveFocus();
    await act(async () => write.resolve(off));
    await act(async () => refresh.resolve(off));
    expect(control).toHaveFocus();

    const second = deferred();
    noruloApi.account.updateJev.mockReturnValueOnce(second.promise);
    await userEvent.keyboard(" ");
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    noruloApi.account.getJev.mockResolvedValue({ ...on, revision: 9 });
    await act(async () => second.resolve({ ...on, revision: 9 }));
    expect(outside).toHaveFocus();
    outside.remove();
  });
});
