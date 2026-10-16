import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noruloApi } from "../api/norulo.js";
import { setLang } from "../i18n.jsx";
import { StatusScreen } from "./legal.jsx";
import { busiestHour, heatmapRows } from "./status-traffic.jsx";

vi.mock("../api/norulo.js", () => ({
  noruloApi: { system: { health: vi.fn() } },
}));

const WINDOW_START = "2026-10-09T15:00:00.000Z";

function service(id, { busyHour = 14, errorIndex = -1 } = {}) {
  const startHour = 15;
  const levels = Array.from({ length: 168 }, (_, index) => ((startHour + index) % 24 === busyHour ? 4 : 1));
  const errors = levels.map((_, index) => (index === errorIndex ? 2 : 0));
  return { id, levels, errors };
}

function traffic(overrides = {}) {
  return {
    version: 1,
    available: true,
    generatedAt: "2026-10-16T14:25:00.000Z",
    windowStart: WINDOW_START,
    windowEnd: "2026-10-16T15:00:00.000Z",
    bucketMinutes: 60,
    timezone: "UTC",
    services: [service("web"), service("api", { busyHour: 9, errorIndex: 100 }), service("mcp", { busyHour: 20 })],
    scheduler: { lastRunAt: "2026-10-15T16:10:02.000Z", outcome: "success" },
    mcp: { reachable: true },
    ...overrides,
  };
}

function stubTraffic(payload) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("Status page activity", () => {
  beforeEach(() => {
    setLang("en");
    noruloApi.system.health.mockResolvedValue({ ok: true, service: "norulo-server" });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows a relative heatmap per service without publishing counts", async () => {
    const fetch = stubTraffic(traffic());
    const { container } = render(<StatusScreen go={vi.fn()} />);

    const card = (await screen.findByRole("heading", { name: "Service activity" })).closest(".traffic-card");
    expect(fetch).toHaveBeenCalledWith("/status/traffic.json", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const maps = within(card).getAllByRole("img");
    expect(maps.map((map) => map.getAttribute("aria-label").split(":")[0])).toEqual([
      "Web app",
      "API server",
      "MCP connector",
    ]);
    expect(maps[1]).toHaveAccessibleName(/Usually busiest around 09:00 UTC/);
    expect(card).toHaveTextContent("Usually busiest around 14:00 UTC");
    expect(card).toHaveTextContent("Hours with Worker errors: 1");
    expect(card).toHaveTextContent("No Worker errors in 7 days");
    expect(card).toHaveTextContent("Updated 14:25 UTC");
    expect(container.querySelectorAll(".traffic-grid .traffic-cell:not(.traffic-blank)")).toHaveLength(168 * 3);
    expect(container.querySelectorAll(".traffic-grid .traffic-cell.current")).toHaveLength(3);
    expect(container.querySelectorAll(".traffic-grid .err-2")).toHaveLength(1);

    const mcpRow = screen.getByText("mcp.norulo.com · Checked by Norulo’s edge, not by your browser").closest(".status-row");
    expect(within(mcpRow).getByText("Reachable")).toBeInTheDocument();
    const schedulerRow = screen.getByText("Daily recurring expenses run").closest(".status-row");
    expect(within(schedulerRow).getByText("Last run completed")).toBeInTheDocument();
    expect(schedulerRow).toHaveTextContent("2026-10-15 16:10 UTC");
  });

  it("explains when activity data is not configured and still reports MCP reachability", async () => {
    stubTraffic(traffic({ available: false, reason: "not_configured", services: [], scheduler: null, mcp: { reachable: false } }));
    render(<StatusScreen go={vi.fn()} />);

    expect(await screen.findByText("Activity data is not enabled for this deployment yet.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const mcpRow = screen.getByText(/^mcp\.norulo\.com ·/).closest(".status-row");
    expect(within(mcpRow).getByText("Unreachable")).toBeInTheDocument();
    expect(screen.queryByText("Daily recurring expenses run")).not.toBeInTheDocument();
  });

  it("treats malformed or failed responses as unavailable and refetches only on explicit refresh", async () => {
    const fetch = vi.fn(async () => new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    render(<StatusScreen go={vi.fn()} />);

    expect(await screen.findByText(/Activity data is temporarily unavailable/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Not checked")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh status" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("lays the rolling window onto UTC days and finds the busiest hour", () => {
    const rows = heatmapRows(service("web"), WINDOW_START, "en");
    expect(rows).toHaveLength(8);
    expect(rows[0].cells.slice(0, 15).every((cell) => cell === null)).toBe(true);
    expect(rows[0].cells[15]).toMatchObject({ index: 0, hour: 15 });
    expect(rows[7].cells[14]).toMatchObject({ index: 167, hour: 14 });
    expect(rows[7].cells[15]).toBeNull();
    expect(busiestHour(service("web", { busyHour: 3 }), WINDOW_START)).toBe(3);
    expect(busiestHour({ levels: new Array(168).fill(0) }, WINDOW_START)).toBe(-1);
  });
});
