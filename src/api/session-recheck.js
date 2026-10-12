let currentScope = null;
const listeners = new Set();

// Only a confirmed App session may establish this generation. Capturing it
// before a request prevents an old account's 401 from affecting a new account.
export function setRequestSessionIdentity(identity) {
  if (currentScope?.identity === identity || (!currentScope && !identity)) return;
  currentScope = identity ? { identity, pending: false } : null;
}

export function captureRequestSessionScope() {
  return currentScope;
}

export function subscribeSessionRecheck(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestSessionRecheck(scope) {
  if (!scope || scope !== currentScope || scope.pending || !listeners.size) return;
  scope.pending = true;
  // Coalesce a group of failed protected reads into one session check. There
  // is no replay of the requests or their business mutations.
  Promise.allSettled([...listeners].map((listener) => Promise.resolve().then(() => {
    if (scope === currentScope && listeners.has(listener)) return listener();
  }))).finally(() => {
    scope.pending = false;
  });
}
