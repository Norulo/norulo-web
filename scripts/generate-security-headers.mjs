import {
  htmlSecurityHeaders,
  STATIC_SECURITY_HEADERS,
  STRICT_TRANSPORT_SECURITY,
} from "../security-headers.js";

// Vite emits this into dist/_headers, including for direct hashed-asset
// responses that skip the Worker. The Worker imports the same policy values.
export function renderStaticHeaders() {
  const headers = {
    ...STATIC_SECURITY_HEADERS,
    ...htmlSecurityHeaders(),
    "Strict-Transport-Security": STRICT_TRANSPORT_SECURITY,
    "Cache-Control": "no-cache",
  };
  return [
    "/*",
    ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`),
    "",
    "/assets/*",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/fonts/*",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=604800",
    "",
    "/brand-mark.png",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=86400",
    "",
    "/apple-touch-icon.png",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=86400",
    "",
  ].join("\n");
}

export function securityHeadersPlugin() {
  return {
    name: "norulo-security-headers",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "_headers", source: renderStaticHeaders() });
    },
  };
}
