// Count fields are authoritative; unknown usage never becomes zero.
export function jevAllowance(jev) {
  if (
    !Number.isSafeInteger(jev?.monthlyCalls) ||
    jev.monthlyCalls < 0 ||
    !Number.isSafeInteger(jev.trialCalls) ||
    jev.trialCalls < 0 ||
    !["lifetime", "utc-calendar-month"].includes(jev.period)
  )
    return null;
  return {
    calls: jev.period === "lifetime" ? jev.trialCalls : jev.monthlyCalls,
    period: jev.period,
  };
}
