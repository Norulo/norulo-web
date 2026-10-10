// The synchronous theme bootstrap is the only executable inline script. Keep
// this hash aligned with index.html; security-headers.test.js checks its bytes.
export const THEME_BOOTSTRAP_HASH = "sha256-1F/1Oh03zl+94G1RlYByAJCYDweLbJXS6JpGtSn68xs=";

export function htmlContentSecurityPolicy(inlineScriptHashes = []) {
  const scriptSources = [
    "'self'",
    `'${THEME_BOOTSTRAP_HASH}'`,
    ...inlineScriptHashes.map((hash) => `'${hash}'`),
  ];
  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    // React uses inline styles for exact chart ratios, resizing and viewport
    // geometry. This exception never permits inline JavaScript.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    // Deployed browser requests use /api; the Worker owns upstream access.
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");
}
