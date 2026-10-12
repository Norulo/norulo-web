function twoDigits(value) {
  return String(value).padStart(2, "0");
}

const MAX_EPOCH_SECONDS = 253402300799; // 9999-12-31T23:59:59Z

export function formatBillingTimestamp(value) {
  if (typeof value !== "number" && typeof value !== "string") return "";
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return "";
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds <= 0 || seconds > MAX_EPOCH_SECONDS) return "";
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) return "";
  return [
    `${date.getUTCFullYear()}-${twoDigits(date.getUTCMonth() + 1)}-${twoDigits(date.getUTCDate())}`,
    `${twoDigits(date.getUTCHours())}:${twoDigits(date.getUTCMinutes())}`,
    "UTC",
  ].join(" ");
}
