// A business date is a calendar date in the rule's time zone, not a browser
// instant. Use UTC only to find its weekday without shifting the chosen date.
export function scheduleFromStartDate(schedule, startOn = schedule.startOn) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(startOn || "")
    ? new Date(`${startOn}T00:00:00Z`)
    : null;
  const valid = date && Number.isFinite(date.getTime()) && date.getUTCFullYear() > 0 &&
    date.toISOString().slice(0, 10) === startOn;
  const month = valid ? date.getUTCMonth() + 1 : "";
  return {
    ...schedule,
    startOn: startOn || "",
    weekday: valid ? date.getUTCDay() || 7 : "",
    day: valid ? date.getUTCDate() : "",
    month,
    quarterMonth: valid ? ((month - 1) % 3) + 1 : "",
  };
}
