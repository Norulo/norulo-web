import {
  htmlSecurityHeaders,
  STATIC_SECURITY_HEADERS,
  STRICT_TRANSPORT_SECURITY,
} from "./security-headers.js";
import { STATUS_TRAFFIC_PATH, handleStatusTraffic } from "./status-traffic.js";

const API_PREFIX = "/api";
const DEFAULT_PROXY_MAX_BODY_BYTES = 1024 * 1024;
const MAX_OAUTH_ERROR_BYTES = 4096;
const GITHUB_CALLBACK_ERRORS = new Set(["GITHUB_IDENTITY_CONFLICT", "ACCOUNT_CHANGED"]);
const GITHUB_CALLBACK_PATHS = new Set(["/api/auth/github/callback", "/api/integrations/github/callback"]);
const HTML_SHELL_CACHE_CONTROL = "no-cache";
const HTML_SHELL_SECURITY_HEADERS = htmlSecurityHeaders();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === STATUS_TRAFFIC_PATH) {
      return withTransportSecurity(await handleStatusTraffic(request, env), url);
    }
    if (isApiRequest(url)) {
      return withTransportSecurity(await proxyApiRequest(request, env, url), url);
    }
    if (!env.ASSETS) {
      return withTransportSecurity(json({ message: "Static assets binding is not configured." }, 500), url);
    }
    return withTransportSecurity(withStaticAssetHeaders(await env.ASSETS.fetch(request)), url);
  },
};

export async function proxyApiRequest(request, env, incomingUrl = new URL(request.url)) {
  if (incomingUrl.pathname === "/api/connect/authorize") {
    if (!env.NORULO_CONNECT_AUTH) return json({ message: "Norulo connection service is unavailable." }, 503);
    if (!["GET", "POST"].includes(request.method)) return json({ message: "Method not allowed." }, 405);
    const headers = withoutClientProxyHeaders(request.headers);
    const edgeClientIp = request.headers.get("CF-Connecting-IP");
    if (edgeClientIp) headers.set("CF-Connecting-IP", edgeClientIp);
    // Keep the browser's exact Norulo origin and cookie. The binding's named entrypoint is not public.
    try {
      return await env.NORULO_CONNECT_AUTH.fetch(new Request(request, { headers, redirect: "manual" }));
    } catch {
      console.error(JSON.stringify({ code: "NORULO_CONNECT_UNREACHABLE", status: 502 }));
      return json({ message: "Unable to reach Norulo connection service." }, 502);
    }
  }
  const origin = env.NORULO_API_ORIGIN;
  if (!origin) {
    return json({ message: "NORULO_API_ORIGIN is not configured." }, 500);
  }
  const upstreamOrigin = apiOrigin(origin);
  if (!upstreamOrigin) {
    return json({ message: "NORULO_API_ORIGIN must use HTTPS or loopback HTTP." }, 500);
  }

  const backendPathWithSearch = backendPath(incomingUrl.pathname) + incomingUrl.search;
  const targetUrl = new URL(backendPathWithSearch, upstreamOrigin);
  const headers = withoutClientProxyHeaders(request.headers);
  headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));
  headers.set("X-Forwarded-Host", incomingUrl.host);
  headers.set("X-Forwarded-Prefix", API_PREFIX);

  const methodHasBody = hasBody(request.method);
  const proxyBody = methodHasBody ? await proxyRequestBody(request, env) : { body: undefined };
  if (proxyBody.tooLarge) {
    return json({ message: "Request body is too large." }, 413);
  }
  if (proxyBody.readFailed) {
    return json({ message: "Unable to read request body." }, 400);
  }

  const init = {
    method: request.method,
    headers,
    body: proxyBody.body,
    duplex: methodHasBody ? "half" : undefined,
    redirect: "manual",
  };

  if (env.NORULO_SERVER) {
    // Route-backed Workers cannot be reached by same-zone external fetch().
    // Service bindings retain the HTTP contract without touching DNS/origin.
    // Cloudflare supplies the inbound visitor IP at the Edge. Preserve only
    // that value across this trusted binding so Server can rate-limit visitors
    // independently; client forwarding headers stay stripped on both paths.
    const edgeClientIp = request.headers.get("CF-Connecting-IP");
    if (edgeClientIp) headers.set("CF-Connecting-IP", edgeClientIp);
    try {
      return proxyResponse(
        await env.NORULO_SERVER.fetch(new Request(targetUrl, init)), request, incomingUrl
      );
    } catch {
      console.error(JSON.stringify({ code: "NORULO_API_SERVICE_UNREACHABLE", status: 502 }));
      return json({ message: "Unable to reach Norulo API service." }, 502);
    }
  }

  let response = await fetchUpstream(targetUrl, init);
  const fallbackOrigin = fallbackApiOrigin(env);
  if (await shouldRetryCloudflare1003(response, upstreamOrigin, fallbackOrigin, request)) {
    // The inspected clone is exhausted, and the original body will no longer
    // reach the client. Release it without delaying the fallback fetch.
    void response.body?.cancel().catch(() => {});
    response = await fetchUpstream(new URL(backendPathWithSearch, fallbackOrigin), init);
  }
  return proxyResponse(response, request, incomingUrl);
}

async function fetchUpstream(targetUrl, init) {
  try {
    return await fetch(targetUrl, init);
  } catch {
    console.error(JSON.stringify({ code: "NORULO_API_UPSTREAM_UNREACHABLE", status: 502 }));
    return json({ message: "Unable to reach Norulo API upstream." }, 502);
  }
}

async function proxyResponse(response, request, incomingUrl) {
  // The API retains its JSON contract. Only a browser navigating to the exact
  // callbacks receives a fixed app destination for authorization failures.
  if (request.method === "GET" && GITHUB_CALLBACK_PATHS.has(incomingUrl.pathname) &&
      request.headers.get("Accept")?.split(",").some((value) =>
        /^text\/html(?:\s*;|\s*$)/i.test(value.trim()) && !/;\s*q=0(?:\.0*)?(?:\s*;|\s*$)/i.test(value)
      ) && response.status >= 400 && response.status < 600 &&
      response.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    const code = await githubCallbackErrorCode(response);
    if (code) {
      const destination = new URL("/oauth", incomingUrl.origin);
      destination.searchParams.set("github_error", code);
      const headers = withoutHopByHopHeaders(response.headers);
      for (const name of ["content-length", "content-type", "content-encoding", "etag"]) headers.delete(name);
      headers.set("Location", destination.href);
      headers.set("Cache-Control", "no-store");
      headers.set("Referrer-Policy", "no-referrer");
      return new Response(null, { status: 303, headers });
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: withoutHopByHopHeaders(response.headers),
  });
}

async function githubCallbackErrorCode(response) {
  const length = response.headers.get("Content-Length");
  if (length && Number(length) > MAX_OAUTH_ERROR_BYTES) return null;
  const reader = response.clone().body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_OAUTH_ERROR_BYTES) return null;
      chunks.push(value);
    }
    const code = JSON.parse(new TextDecoder().decode(concatChunks(chunks, bytes)))?.error?.code;
    if (typeof code !== "string" || !code.trim()) return null;
    return GITHUB_CALLBACK_ERRORS.has(code) ? code : "AUTHORIZATION_FAILED";
  } catch {
    return null;
  } finally {
    // A cloned stream's cancellation may wait for the original stream, which
    // must remain available to the client whenever the response stays JSON.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function withStaticAssetHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  if (isHtmlResponse(headers)) {
    headers.set("Cache-Control", HTML_SHELL_CACHE_CONTROL);
    for (const [name, value] of Object.entries(HTML_SHELL_SECURITY_HEADERS)) {
      headers.set(name, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withTransportSecurity(response, url) {
  if (url.protocol !== "https:") return response;
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isHtmlResponse(headers) {
  return (headers.get("content-type") || "").toLowerCase().includes("text/html");
}

export function isApiRequest(url) {
  return url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`);
}

export function backendPath(pathname) {
  const stripped = pathname.replace(/^\/api/, "");
  if (!stripped || stripped === "/") return "/";
  return `/${stripped.replace(/^\/+/, "")}`;
}

function apiOrigin(origin) {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === "https:") return parsed;
    if (parsed.protocol === "http:" && isLoopbackHost(parsed.hostname)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return ["localhost", "127.0.0.1", "::1"].includes(normalized);
}

async function shouldRetryCloudflare1003(response, upstreamOrigin, fallbackOrigin, request) {
  if (response.status !== 403) return false;
  if (!fallbackOrigin || fallbackOrigin.origin === upstreamOrigin.origin) return false;
  if (!canRetryFallback(request)) return false;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return false;
  try {
    return (await response.clone().text()).includes("error code: 1003");
  } catch {
    return false;
  }
}

function fallbackApiOrigin(env) {
  const configured = String(env.NORULO_API_FALLBACK_ORIGIN || "").trim();
  return configured ? apiOrigin(configured) : null;
}

function canRetryFallback(request) {
  if (!["GET", "HEAD"].includes(request.method.toUpperCase())) return false;
  return !hasCredentialHeaders(request.headers);
}

function hasCredentialHeaders(headers) {
  return ["authorization", "cookie", "x-norulo-api-key"].some((name) => headers.has(name));
}

async function proxyRequestBody(request, env) {
  const maxBytes = proxyMaxBodyBytes(env);
  const rawLength = request.headers.get("content-length");
  const contentLength = Number(rawLength);
  if (rawLength && Number.isFinite(contentLength)) {
    return contentLength > maxBytes ? { tooLarge: true } : { body: request.body };
  }
  if (!request.body) return { body: undefined };

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } catch {
    return { readFailed: true };
  } finally {
    reader.releaseLock();
  }
  return { body: concatChunks(chunks, totalBytes) };
}

function concatChunks(chunks, totalBytes) {
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function proxyMaxBodyBytes(env) {
  const value = env.NORULO_PROXY_MAX_BODY_BYTES;
  if (value == null || String(value).trim() === "") return DEFAULT_PROXY_MAX_BODY_BYTES;
  const configured = Number(value);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_PROXY_MAX_BODY_BYTES;
}

function hasBody(method) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const CLIENT_PROXY_HEADERS = new Set([
  "cf-connecting-ip",
  "cf-connecting-ipv6",
  "client-ip",
  "fastly-client-ip",
  "forwarded",
  "real-ip",
  "true-client-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-original-forwarded-for",
  "x-real-ip",
]);

function withoutHopByHopHeaders(sourceHeaders) {
  const headers = new Headers(sourceHeaders);
  const connectionTokens = headers
    .get("connection")
    ?.split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  for (const name of HOP_BY_HOP_HEADERS) {
    headers.delete(name);
  }
  for (const name of connectionTokens || []) {
    headers.delete(name);
  }
  return headers;
}

function withoutClientProxyHeaders(sourceHeaders) {
  const headers = withoutHopByHopHeaders(sourceHeaders);
  headers.delete("host");
  for (const name of [...headers.keys()]) {
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith("x-forwarded-") || CLIENT_PROXY_HEADERS.has(lowerName)) {
      headers.delete(name);
    }
  }
  return headers;
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
