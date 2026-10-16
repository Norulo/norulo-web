import { describe, expect, it, vi } from "vitest";
import worker from "./worker.js";
import { handleStatusTraffic } from "./status-traffic.js";

const URL = "https://norulo.com/status/traffic.json";
const body = { version: 1, available: true, services: [], scheduler: null, mcp: { reachable: true } };

describe("Server-owned status summaries", () => {
  it("forwards only the fixed public resource and trusted ingress address", async () => {
    const fetch = vi.fn(async () => Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } }));
    const response = await worker.fetch(new Request(URL + "?account=evil&token=private", { headers: {
      Cookie: "nr_session=private", Authorization: "Bearer private", "X-Norulo-Api-Key": "private",
      "CF-Connecting-IP": "192.0.2.1", "X-Forwarded-For": "untrusted", "Cache-Control": "no-cache",
    } }), { NORULO_SERVER: { fetch } });
    expect(await response.json()).toEqual(body);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=");
    const [request] = fetch.mock.calls[0];
    expect(request.url).toBe("https://api.norulo.com/status/traffic.json");
    expect(request.redirect).toBe("manual");
    expect(Object.fromEntries(request.headers)).toEqual({ accept: "application/json", "cf-connecting-ip": "192.0.2.1" });
  });

  it("preserves HEAD and Server response status/cache/admission headers", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 429, headers: { "Retry-After": "10", "Cache-Control": "no-store" } }));
    const response = await handleStatusTraffic(new Request(URL, { method: "HEAD" }), { NORULO_SERVER: { fetch } });
    expect(fetch.mock.calls[0][0].method).toBe("HEAD");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("10");
    expect(await response.text()).toBe("");
  });

  it.each(["POST", "PUT", "DELETE", "OPTIONS"])("rejects %s without contacting Server", async (method) => {
    const fetch = vi.fn();
    const response = await handleStatusTraffic(new Request(URL, { method }), { NORULO_SERVER: { fetch } });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["GET", "HEAD"])("returns explicit unavailability with no binding for %s", async (method) => {
    const response = await worker.fetch(new Request(URL, { method }), {});
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    if (method === "HEAD") expect(await response.text()).toBe("");
    else expect(await response.json()).toMatchObject({ version: 1, available: false, mcp: { reachable: null } });
  });

  it("does not retry a failed binding or expose its exception", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const fetch = vi.fn(async () => { throw new Error("private upstream credential"); });
      const response = await handleStatusTraffic(new Request(URL), { NORULO_SERVER: { fetch } });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("private");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(log.mock.calls.flat().join()).not.toContain("private");
    } finally { log.mockRestore(); }
  });
});
