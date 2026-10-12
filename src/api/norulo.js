import { request } from "./http.js";
import {
  captureGitHubRefreshScope,
  setGitHubRefreshIdentity,
  withGitHubRefresh,
} from "./github-refresh.js";

function withSearchParams(path, params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
  const search = new URLSearchParams(cleanParams).toString();
  return search ? `${path}?${search}` : path;
}

function pathSegment(value) {
  const text = String(value ?? "");
  if (!text) throw new Error("API path segment is required.");
  return encodeURIComponent(text);
}

function getRequest(path, options = {}) {
  return options.signal ? request(path, { signal: options.signal }) : request(path);
}

async function listApiKeys(params = {}, options = {}) {
  const items = [];
  const seenCursors = new Set();
  let cursor = params.cursor;
  for (let page = 0; page < 100; page += 1) {
    options.signal?.throwIfAborted();
    const result = await getRequest(withSearchParams("/api-keys", { ...params, cursor }), options);
    const nextCursor = result?.nextCursor;
    if (page === 0 && (nextCursor === null || nextCursor === undefined)) return result;
    const rows = result?.items ?? result?.apiKeys;
    if (!Array.isArray(rows)) throw new Error("API key list is unavailable.");
    items.push(...rows);
    if (nextCursor === null || nextCursor === undefined) {
      return { ...result, items, apiKeys: items, nextCursor: null };
    }
    if (typeof nextCursor !== "string" || !/^[A-Za-z0-9_-]{1,256}$/.test(nextCursor)
      || seenCursors.has(nextCursor)) throw new Error("API key list is unavailable.");
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }
  throw new Error("API key list is too large. Select a ledger and try again.");
}

export const noruloApi = {
  auth: {
    getSession: (options = {}) => request("/auth/session", { signal: options.signal }),
    signOut: async (options = {}) => {
      const scope = captureGitHubRefreshScope();
      const result = await request("/auth/sign-out", { method: "POST", signal: options.signal });
      if (captureGitHubRefreshScope() === scope) setGitHubRefreshIdentity(null);
      return result;
    },
    getGitHubAuthorizeUrl: (params = {}, options = {}) =>
      request(withSearchParams("/auth/github/authorize", params), { signal: options.signal }),
    requestEmailCode: (payload, options = {}) =>
      request("/auth/email/request-code", {
        method: "POST",
        body: payload,
        signal: options.signal,
      }),
    verifyEmailCode: (payload, options = {}) =>
      request("/auth/email/verify-code", {
        method: "POST",
        body: payload,
        signal: options.signal,
      }),
  },

  account: {
    getExpenseRetention: (options = {}) => getRequest("/api/v1/account/expense-retention", options),
    updateExpenseRetention: (revision, autoRemoveOldestExpense, options = {}) =>
      request("/api/v1/account/expense-retention", {
        method: "PATCH",
        headers: { "If-Match": `"${revision}"` },
        body: { autoRemoveOldestExpense },
        signal: options.signal,
      }),
    getJev: (options = {}) => getRequest("/api/v1/account/jev", options),
    updateJev: (revision, enabled, options = {}) =>
      request("/api/v1/account/jev", {
        method: "PATCH",
        headers: { "If-Match": `"${revision}"` },
        body: { enabled },
        signal: options.signal,
      }),
  },

  repositories: {
    list: (params = {}, options = {}) =>
      withGitHubRefresh(
        () => getRequest(withSearchParams("/repositories", params), options),
        options
      ),
    sync: (payload, options = {}) =>
      withGitHubRefresh(
        () =>
          request("/repositories/sync", { method: "POST", body: payload, signal: options.signal }),
        options
      ),
  },

  integrations: {
    list: (options = {}) => withGitHubRefresh(() => getRequest("/integrations", options), options),
    getGitHubAuthorizeUrl: (params = {}, options = {}) =>
      request(withSearchParams("/integrations/github/authorize", params), {
        signal: options.signal,
      }),
    createGitHubInstallationManageSession: (installationId, payload = {}) =>
      request(`/integrations/github/installations/${pathSegment(installationId)}/manage-sessions`, {
        method: "POST",
        body: payload,
      }),
    disconnect: (provider) =>
      request(`/integrations/${pathSegment(provider)}`, { method: "DELETE" }),
  },

  billing: {
    getBilling: () => request("/billing"),
    getPlan: () => request("/billing/plan"),
    createCheckoutSession: (payload = {}, options = {}) =>
      request("/billing/checkout-sessions", {
        method: "POST",
        body: payload,
        signal: options.signal,
      }),
    changeSubscriptionInterval: (payload = {}) =>
      request("/billing/change-interval", { method: "POST", body: payload }),
    cancelSubscription: (payload = {}) =>
      request("/billing/cancel-subscription", { method: "POST", body: payload }),
    resumeSubscription: (payload = {}) =>
      request("/billing/resume-subscription", { method: "POST", body: payload }),
  },

  apiKeys: {
    list: listApiKeys,
    create: (payload = {}, options = {}) =>
      request("/api-keys", { method: "POST", body: payload, signal: options.signal }),
    revoke: (keyId, options = {}) =>
      request(`/api-keys/${pathSegment(keyId)}`, { method: "DELETE", signal: options.signal }),
  },

  system: {
    health: (options = {}) => request("/health", { signal: options.signal }),
  },
};
