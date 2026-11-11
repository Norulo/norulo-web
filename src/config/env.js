function isLoopbackHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized === "::1") return true;
  const parts = normalized.split(".");
  return (
    parts.length === 4 &&
    parts[0] === "127" &&
    parts.every((part) => {
      if (!/^\d+$/.test(part)) return false;
      const value = Number(part);
      return value >= 0 && value <= 255;
    })
  );
}

// Plain checks instead of a schema library: this module is on every page's
// critical path, and four optional strings do not justify a validation bundle.
function isAbsoluteUrlOrRootRelativePath(value) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return true;
    return parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname);
  } catch {
    return false;
  }
}

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const ENV_RULES = {
  VITE_API_BASE_URL: [
    isAbsoluteUrlOrRootRelativePath,
    "Expected a root-relative path, HTTPS URL, or loopback HTTP URL.",
  ],
  VITE_PUBLIC_API_BASE_URL: [
    isAbsoluteUrlOrRootRelativePath,
    "Expected a root-relative path, HTTPS URL, or loopback HTTP URL.",
  ],
  VITE_APP_URL: [isUrl, "Expected a URL."],
  VITE_GITHUB_APP_SLUG: [() => true, "Expected a string."],
};

function validateEnv(rawEnv) {
  const parsed = {};
  for (const [name, [isValid, message]] of Object.entries(ENV_RULES)) {
    const value = rawEnv?.[name];
    if (value === undefined) continue;
    if (typeof value !== "string" || !isValid(value)) {
      throw new TypeError(`Invalid ${name}: ${message}`);
    }
    parsed[name] = value;
  }
  return parsed;
}

const PRODUCTION_API_BASE_URL_BY_HOST = {
  "norulo.com": "/api",
  "www.norulo.com": "/api",
};

function productionApiBaseUrlForLocation(location) {
  const hostname = location?.hostname;
  if (typeof hostname !== "string") return undefined;
  return PRODUCTION_API_BASE_URL_BY_HOST[hostname.toLowerCase()];
}

export function parseEnv(rawEnv, options = {}) {
  const parsed = validateEnv(rawEnv);
  return {
    ...parsed,
    VITE_API_BASE_URL:
      parsed.VITE_API_BASE_URL || productionApiBaseUrlForLocation(options.location),
  };
}

export const env = parseEnv(import.meta.env, {
  location: typeof window === "undefined" ? undefined : window.location,
});
