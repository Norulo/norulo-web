const FALLBACK_TIMEZONES = [
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota",
  "America/Chicago", "America/Denver", "America/Halifax", "America/Los_Angeles",
  "America/Mexico_City", "America/New_York", "America/Phoenix", "America/Sao_Paulo",
  "America/St_Johns", "America/Toronto", "America/Vancouver",
  "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Jerusalem",
  "Asia/Kathmandu", "Asia/Kolkata", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tehran", "Asia/Tokyo",
  "Atlantic/Azores", "Australia/Adelaide", "Australia/Brisbane", "Australia/Darwin",
  "Australia/Hobart", "Australia/Perth", "Australia/Sydney", "Europe/Amsterdam",
  "Europe/Berlin", "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon",
  "Europe/London", "Europe/Moscow", "Europe/Paris", "Europe/Rome", "Europe/Warsaw",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
];

const isTimezoneName = (value) => typeof value === "string" && value.length > 0 &&
  value.length <= 100 && /^[A-Za-z0-9_+./-]+$/.test(value);

export function normalizeTimezone(value) {
  if (!isTimezoneName(value) || /^[+-]/.test(value) ||
    /^SystemV\//i.test(value) || /^Factory$/i.test(value)) return null;
  try {
    const canonical = new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone;
    return isTimezoneName(canonical) && !/^[+-]/.test(canonical) ? canonical : null;
  } catch {
    return null;
  }
}

export const isValidTimezone = (value) => normalizeTimezone(value) !== null;

export function availableTimezones(currentValue = "") {
  let values;
  try {
    values = typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone") : null;
  } catch {
    // Older engines can expose the method without supporting this key.
  }
  const zones = Array.isArray(values) && values.length
    ? values : FALLBACK_TIMEZONES.filter(isValidTimezone);
  // A browser's time-zone database can predate the Server's. Keep saved names
  // and aliases visible without rewriting or rejecting an existing schedule.
  const current = isTimezoneName(currentValue) ? [currentValue] : [];
  const sorted = [...new Set([...zones, ...current].filter((zone) => zone !== "UTC"))]
    .sort((left, right) => left.localeCompare(right, "en"));
  return ["UTC", ...sorted];
}
