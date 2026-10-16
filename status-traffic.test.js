import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./worker.js";
import {
  STATUS_SERVICES,
  activityLevel,
  errorLevel,
  handleStatusTraffic,
  resetStatusTrafficCache,
  trafficWindow,
} from "./status-traffic.js";

const NOW = Date.parse("2026-10-16T14:25:00Z");
const ACCOUNT = "84e421f26c708c0cf437e287eed11fa1";
const TOKEN = "cf-analytics-secret-token";
const env = { NORULO_CF_ACCOUNT_ID: ACCOUNT, NORULO_CF_ANALYTICS_TOKEN: TOKEN };

function invocationRows() {
  const { start } = trafficWindow(NOW);
  const hour = (index) => new Date(start + index * 3600 * 1000).toISOString();
  return {
    d0: [{ sum: { requests: 12345, errors: 0 }, dimensions: { scriptName: "norulo-web", datetimeHour: hour(3) } }],
    d6: [
      { sum: { requests: 40, errors: 0 }, dimensions: { scriptName: "norulo-web", datetimeHour: hour(167) } },
      { sum: { requests: 987, errors: 99 }, dimensions: { scriptName: "norulo-server-production", datetimeHour: hour(150) } },
      { sum: { requests: 77, errors: 1 }, dimensions: { scriptName: "norulo-connect", datetimeHour: hour(166) } },
      { sum: { requests: 5, errors: 0 }, dimensions: { scriptName: "unrelated-worker", datetimeHour: hour(160) } },
    ],
  };
}

function cloudflareFetch({ traffic = invocationRows(), scheduler, mcpOk = true } = {}) {
  return vi.fn(async (url, init = {}) => {
    if (url === "https://mcp.norulo.com/health") {
      return mcpOk ? Response.json({ ok: true, service: "Norulo OAuth MCP" }) : new Response("down", { status: 503 });
    }
    const { query } = JSON.parse(init.body);
    if (query.includes("workersInvocationsScheduled")) {
      return Response.json({
        data: { viewer: { accounts: [{ workersInvocationsScheduled: scheduler ?? [{ datetime: "2026-10-16T16:10:02Z", status: "success" }] }] } },
      });
    }
    return traffic instanceof Response ? traffic : Response.json({ data: { viewer: { accounts: [traffic] } } });
  });
}

afterEach(() => resetStatusTrafficCache());

describe("status traffic levels", () => {
  it("log-scales activity into five levels relative to each service's peak", () => {
    expect(activityLevel(0, 100)).toBe(0);
    expect(activityLevel(1, 10000)).toBe(1);
    expect(activityLevel(10000, 10000)).toBe(4);
    expect(activityLevel(50, 10000)).toBe(2);
    expect(errorLevel(100, 0)).toBe(0);
    expect(errorLevel(100, 1)).toBe(1);
    expect(errorLevel(100, 5)).toBe(2);
  });
});

describe("GET /status/traffic.json", () => {
  it("returns only levels, never counts, the token or the account", async () => {
    const fetchImpl = cloudflareFetch();
    const response = await handleStatusTraffic(new Request("https://norulo.com/status/traffic.json"), env, {
      fetchImpl,
      now: NOW,
      cache: null,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    const text = await response.text();
    for (const secret of [TOKEN, ACCOUNT, "12345", "987", "norulo-server-production", "norulo-connect"]) {
      expect(text).not.toContain(secret);
    }
    const body = JSON.parse(text);
    expect(body).toMatchObject({ version: 1, available: true, timezone: "UTC", bucketMinutes: 60, mcp: { reachable: true } });
    expect(body.scheduler).toEqual({ lastRunAt: "2026-10-16T16:10:02.000Z", outcome: "success" });
    expect(body.services.map((service) => service.id)).toEqual(["web", "api", "mcp"]);
    const [web, api, mcp] = body.services;
    for (const service of body.services) {
      expect(service.levels).toHaveLength(168);
      expect(service.errors).toHaveLength(168);
      expect(service.levels.every((level) => Number.isInteger(level) && level >= 0 && level <= 4)).toBe(true);
    }
    expect(web.levels[3]).toBe(4);
    expect(web.levels[167]).toBeGreaterThan(0);
    expect(web.levels[167]).toBeLessThan(4);
    expect(api.levels[150]).toBe(4);
    expect(api.errors[150]).toBe(2);
    expect(mcp.levels[166]).toBe(4);
    expect(mcp.errors[166]).toBe(1);
    expect(body.windowEnd).toBe("2026-10-16T15:00:00.000Z");

    const [graphUrl, init] = fetchImpl.mock.calls.find(([url]) => url.includes("graphql"));
    expect(graphUrl).toBe("https://api.cloudflare.com/client/v4/graphql");
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    const { query, variables } = JSON.parse(init.body);
    expect(query).toContain("workersInvocationsAdaptive");
    expect(variables.scripts).toEqual(STATUS_SERVICES.map((service) => service.script));
    expect(variables.since0).toBe("2026-10-09T15:00:00.000Z");
    expect(variables.until6).toBe("2026-10-16T15:00:00.000Z");
  });

  it("reports MCP reachability but no traffic when analytics is not configured", async () => {
    const fetchImpl = cloudflareFetch({ mcpOk: false });
    const response = await handleStatusTraffic(new Request("https://norulo.com/status/traffic.json"), {}, {
      fetchImpl,
      now: NOW,
      cache: null,
    });
    const body = await response.json();
    expect(body).toMatchObject({ available: false, reason: "not_configured", services: [], mcp: { reachable: false } });
    expect(fetchImpl.mock.calls.some(([url]) => url.includes("graphql"))).toBe(false);
  });

  it("hides Cloudflare errors behind a generic unavailable state", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = cloudflareFetch({
      traffic: Response.json({ data: null, errors: [{ message: "secret internal detail" }] }),
    });
    const response = await handleStatusTraffic(new Request("https://norulo.com/status/traffic.json"), env, {
      fetchImpl,
      now: NOW,
      cache: null,
    });
    const text = await response.text();
    expect(JSON.parse(text)).toMatchObject({ available: false, reason: "unavailable", services: [] });
    expect(text).not.toContain("secret internal detail");
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("serves repeated requests from one cached summary", async () => {
    const fetchImpl = cloudflareFetch();
    const store = new Map();
    const cache = {
      match: vi.fn(async (key) => store.get(key)?.clone()),
      put: vi.fn(async (key, response) => store.set(key, response)),
    };
    const request = () => new Request("https://norulo.com/status/traffic.json");
    await handleStatusTraffic(request(), env, { fetchImpl, now: NOW, cache });
    await handleStatusTraffic(request(), env, { fetchImpl, now: NOW + 60_000, cache });
    resetStatusTrafficCache();
    const third = await handleStatusTraffic(request(), env, { fetchImpl, now: NOW + 120_000, cache });
    expect((await third.json()).available).toBe(true);
    expect(fetchImpl.mock.calls.filter(([url]) => url.includes("graphql"))).toHaveLength(2);
    expect(cache.put).toHaveBeenCalledTimes(1);
  });

  it("rejects writes and is routed before the static app shell", async () => {
    const post = await handleStatusTraffic(new Request("https://norulo.com/status/traffic.json", { method: "POST" }), env, {
      cache: null,
    });
    expect(post.status).toBe(405);

    const assets = { fetch: vi.fn() };
    const original = globalThis.fetch;
    globalThis.fetch = cloudflareFetch();
    try {
      const response = await worker.fetch(new Request("https://norulo.com/status/traffic.json"), { ...env, ASSETS: assets });
      expect(response.headers.get("Content-Type")).toContain("application/json");
      expect(response.headers.get("Strict-Transport-Security")).toBeTruthy();
      expect(assets.fetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = original;
    }
  });
});
