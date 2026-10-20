// Only these anonymous documents receive a pre-rendered body. The SPA fallback
// remains empty, so account, OAuth and ledger routes keep their existing startup.
export const PUBLIC_PAGE_ASSETS = Object.freeze({
  "/": "/public-pages/landing.html",
  "/pricing": "/public-pages/pricing.html",
  "/developers/docs": "/public-pages/docs.html",
  "/developers/api": "/public-pages/api.html",
  "/plugins": "/public-pages/plugins.html",
});

export const PUBLIC_PRICING_MARKER = "<!--norulo-public-pricing-->";

export function publicPageAsset(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return Object.hasOwn(PUBLIC_PAGE_ASSETS, path) ? PUBLIC_PAGE_ASSETS[path] : null;
}
