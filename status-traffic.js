// Public service-activity summary for the Status page, served at
// /status/traffic.json. Cloudflare's GraphQL Analytics API supplies hourly
// Worker invocation counts; only relative activity levels (0-4), coarse error
// levels and reachability leave this module. Exact counts, the analytics token
// and Cloudflare error messages are never returned.

export const STATUS_TRAFFIC_PATH = "/status/traffic.json";

const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";
const MCP_HEALTH_URL = "https://mcp.norulo.com/health";
const HOUR_MS = 3600 * 1000;
const DAYS = 7;
const HOURS = DAYS * 24;
const CACHE_SECONDS = 600;
const BROWSER_CACHE_SECONDS = 300;
const UPSTREAM_TIMEOUT_MS = 5000;
const ACCOUNT_ID_PATTERN = /^[0-9a-f]{32}$/;
const CACHE_KEY = "https://norulo.com/__status/traffic-v1";

// Public service IDs map to the production Worker scripts that serve them.
export const STATUS_SERVICES = [
  { id: "web", script: "norulo-web" },
  { id: "api", script: "norulo-server-production" },
  { id: "mcp", script: "norulo-connect" },
];
const SCHEDULER_SCRIPT = "norulo-server-production";

let memo = null;

export function resetStatusTrafficCache() {
  memo = null;
}

// Log-scaled so one spike does not flatten every other hour to "quiet".
export function activityLevel(requests, peak) {
  if (!(requests > 0) || !(peak > 0)) return 0;
  return Math.min(4, Math.max(1, Math.ceil((4 * Math.log1p(requests)) / Math.log1p(peak))));
}

// 0: no Worker errors, 1: some (<5% of invocations), 2: elevated (>=5%).
export function errorLevel(requests, errors) {
  if (!(errors > 0)) return 0;
  if (!(requests > 0)) return 2;
  return errors / requests >= 0.05 ? 2 : 1;
}

export function trafficWindow(now) {
  const end = Math.floor(now / HOUR_MS) * HOUR_MS + HOUR_MS;
  return { start: end - HOURS * HOUR_MS, end };
}

function invocationsQuery() {
  const days = Array.from({ length: DAYS }, (_, day) => `
      d${day}: workersInvocationsAdaptive(
        limit: 1000
        filter: { scriptName_in: $scripts, datetime_geq: $since${day}, datetime_lt: $until${day} }
      ) {
        sum { requests errors }
        dimensions { scriptName datetimeHour }
      }`).join("");
  const variables = Array.from({ length: DAYS }, (_, day) => `$since${day}: Time!, $until${day}: Time!`).join(", ");
  return `query StatusTraffic($accountTag: string!, $scripts: [string!], ${variables}) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {${days}
      }
    }
  }`;
}

const SCHEDULER_QUERY = `query StatusScheduler($accountTag: string!, $script: string!, $since: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsScheduled(
        limit: 1
        orderBy: [datetime_DESC]
        filter: { scriptName: $script, datetime_geq: $since }
      ) {
        datetime
        status
      }
    }
  }
}`;

async function graphql(fetchImpl, token, query, variables) {
  const response = await fetchImpl(GRAPHQL_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("ANALYTICS_HTTP_" + response.status);
  const payload = await response.json();
  if (payload?.errors?.length) throw new Error("ANALYTICS_QUERY_REJECTED");
  const account = payload?.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("ANALYTICS_ACCOUNT_MISSING");
  return account;
}

export function summarizeInvocations(account, start) {
  const requests = new Map(STATUS_SERVICES.map((service) => [service.script, new Array(HOURS).fill(0)]));
  const errors = new Map(STATUS_SERVICES.map((service) => [service.script, new Array(HOURS).fill(0)]));
  for (let day = 0; day < DAYS; day += 1) {
    for (const row of account[`d${day}`] || []) {
      const script = row?.dimensions?.scriptName;
      const hour = Date.parse(row?.dimensions?.datetimeHour);
      const index = Math.floor((hour - start) / HOUR_MS);
      if (!requests.has(script) || !Number.isInteger(index) || index < 0 || index >= HOURS) continue;
      requests.get(script)[index] += Math.max(0, Number(row?.sum?.requests) || 0);
      errors.get(script)[index] += Math.max(0, Number(row?.sum?.errors) || 0);
    }
  }
  return STATUS_SERVICES.map(({ id, script }) => {
    const hourly = requests.get(script);
    const peak = Math.max(...hourly);
    return {
      id,
      levels: hourly.map((value) => activityLevel(value, peak)),
      errors: hourly.map((value, index) => errorLevel(value, errors.get(script)[index])),
    };
  });
}

async function mcpReachable(fetchImpl) {
  try {
    const response = await fetchImpl(MCP_HEALTH_URL, {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.ok === true;
  } catch {
    return false;
  }
}

async function lastScheduledRun(fetchImpl, token, accountTag, now) {
  const account = await graphql(fetchImpl, token, SCHEDULER_QUERY, {
    accountTag,
    script: SCHEDULER_SCRIPT,
    since: new Date(now - 3 * 24 * HOUR_MS).toISOString(),
  });
  const run = account.workersInvocationsScheduled?.[0];
  const at = Date.parse(run?.datetime);
  if (!Number.isFinite(at)) return null;
  return {
    lastRunAt: new Date(at).toISOString(),
    outcome: String(run.status || "").toLowerCase() === "success" ? "success" : "failure",
  };
}

export async function buildStatusTraffic(env, { fetchImpl = fetch, now = Date.now() } = {}) {
  const { start, end } = trafficWindow(now);
  const base = {
    version: 1,
    generatedAt: new Date(now).toISOString(),
    windowStart: new Date(start).toISOString(),
    windowEnd: new Date(end).toISOString(),
    bucketMinutes: 60,
    timezone: "UTC",
  };
  const token = String(env.NORULO_CF_ANALYTICS_TOKEN || "").trim();
  const accountTag = String(env.NORULO_CF_ACCOUNT_ID || "").trim().toLowerCase();
  const mcp = mcpReachable(fetchImpl);
  if (!token || !ACCOUNT_ID_PATTERN.test(accountTag)) {
    return { ...base, available: false, reason: "not_configured", services: [], scheduler: null, mcp: { reachable: await mcp } };
  }
  const variables = { accountTag, scripts: STATUS_SERVICES.map((service) => service.script) };
  for (let day = 0; day < DAYS; day += 1) {
    variables[`since${day}`] = new Date(start + day * 24 * HOUR_MS).toISOString();
    variables[`until${day}`] = new Date(start + (day + 1) * 24 * HOUR_MS).toISOString();
  }
  const [traffic, scheduler, reachable] = await Promise.allSettled([
    graphql(fetchImpl, token, invocationsQuery(), variables),
    lastScheduledRun(fetchImpl, token, accountTag, now),
    mcp,
  ]);
  if (traffic.status === "rejected" || scheduler.status === "rejected") {
    const reason = traffic.status === "rejected" ? traffic.reason : scheduler.reason;
    console.error(JSON.stringify({ code: "NORULO_STATUS_ANALYTICS_FAILED", detail: String(reason?.message || "").slice(0, 40) }));
  }
  const mcpStatus = { reachable: reachable.status === "fulfilled" ? reachable.value : false };
  const schedulerStatus = scheduler.status === "fulfilled" ? scheduler.value : null;
  if (traffic.status === "rejected") {
    return { ...base, available: false, reason: "unavailable", services: [], scheduler: schedulerStatus, mcp: mcpStatus };
  }
  return {
    ...base,
    available: true,
    services: summarizeInvocations(traffic.value, start),
    scheduler: schedulerStatus,
    mcp: mcpStatus,
  };
}

function trafficResponse(body, method) {
  return new Response(method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${BROWSER_CACHE_SECONDS}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// One summary per isolate and colo every ten minutes, however often the page
// is opened; requests never fan out into repeated Cloudflare API calls.
export async function handleStatusTraffic(request, env, options = {}) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED" } }), {
      status: 405,
      headers: { Allow: "GET, HEAD", "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const now = options.now ?? Date.now();
  const cache = options.cache === undefined ? globalThis.caches?.default : options.cache;
  if (memo && memo.expires > now) return trafficResponse(await memo.body, request.method);
  const cached = await cache?.match(CACHE_KEY).catch(() => null);
  if (cached) {
    const body = await cached.text();
    memo = { expires: now + CACHE_SECONDS * 1000, body };
    return trafficResponse(body, request.method);
  }
  const pending = buildStatusTraffic(env, { fetchImpl: options.fetchImpl, now }).then((payload) => JSON.stringify(payload));
  memo = { expires: now + CACHE_SECONDS * 1000, body: pending };
  let body;
  try {
    body = await pending;
  } catch {
    memo = null;
    body = JSON.stringify({ version: 1, available: false, reason: "unavailable", services: [], scheduler: null, mcp: { reachable: null } });
    return trafficResponse(body, request.method);
  }
  memo = { expires: now + CACHE_SECONDS * 1000, body };
  await cache
    ?.put(CACHE_KEY, new Response(body, { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } }))
    .catch(() => {});
  return trafficResponse(body, request.method);
}
