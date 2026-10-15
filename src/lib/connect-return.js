const STORAGE_KEY = "norulo:connect-return";
const MAX_AGE = 10 * 60 * 1000;

export function safeConnectReturn(value) {
  if (typeof value !== "string" || value.length > 8192 || !value.startsWith("/api/connect/authorize?") || /[\r\n\\]/.test(value)) return null;
  try {
    const u = new URL(value, "https://norulo.com");
    if (u.origin !== "https://norulo.com" || u.pathname !== "/api/connect/authorize" || u.hash || !u.searchParams.get("client_id")) return null;
    return u.pathname + u.search;
  } catch { return null; }
}

export function rememberConnectReturn(search, storage, now = Date.now()) {
  const path = safeConnectReturn(new URLSearchParams(search).get("connect_return"));
  if (path) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify({ path, at: now })); } catch { /* Login still works without browser storage. */ }
  }
  return path;
}

export function consumeConnectReturn(search, storage, now = Date.now()) {
  const direct = safeConnectReturn(new URLSearchParams(search).get("connect_return"));
  let saved;
  try { saved = JSON.parse(storage.getItem(STORAGE_KEY)); storage.removeItem(STORAGE_KEY); } catch { /* Storage can be disabled. */ }
  return direct || (saved && Number.isFinite(saved.at) && now >= saved.at && now - saved.at <= MAX_AGE ? safeConnectReturn(saved.path) : null);
}
