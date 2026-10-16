// Public status data belongs to Server. Web forwards this fixed public request
// through the existing service binding; no analytics credentials or queries.
export const STATUS_TRAFFIC_PATH = "/status/traffic.json";

export async function handleStatusTraffic(request, env) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return Response.json({ error: { code: "METHOD_NOT_ALLOWED" } }, {
      status: 405, headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
    });
  }
  const unavailable = () => new Response(request.method === "HEAD" ? null : JSON.stringify({
    version: 1, available: false, reason: "unavailable", services: [], scheduler: null, mcp: { reachable: null },
  }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (!env.NORULO_SERVER) return unavailable();
  const headers = new Headers({ Accept: "application/json" });
  // Preserve only Cloudflare's ingress address for Server's admission limiter.
  // Browser cookies, credentials, query strings and client cache directives do
  // not belong to this public, fixed-resource request.
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) headers.set("CF-Connecting-IP", ip);
  try {
    return await env.NORULO_SERVER.fetch(new Request("https://api.norulo.com" + STATUS_TRAFFIC_PATH, {
      method: request.method, headers, redirect: "manual", signal: AbortSignal.timeout(10000),
    }));
  } catch {
    console.error(JSON.stringify({ code: "NORULO_STATUS_SERVER_UNREACHABLE", status: 503 }));
    return unavailable();
  }
}
