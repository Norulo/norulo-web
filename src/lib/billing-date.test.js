import { describe, expect, it } from "vitest";
import { formatBillingTimestamp } from "./billing-date.js";

describe("billing timestamps", () => {
  it("formats supported epoch seconds as UTC", () => {
    expect(formatBillingTimestamp(1700000000)).toBe("2023-11-14 22:13 UTC");
    expect(formatBillingTimestamp("1700000000")).toBe("2023-11-14 22:13 UTC");
    expect(formatBillingTimestamp(1)).toBe("1970-01-01 00:00 UTC");
    expect(formatBillingTimestamp(253402300799)).toBe("9999-12-31 23:59 UTC");
  });

  it.each([
    null, undefined, true, false, [], [1700000000], {},
    0, -1, NaN, Infinity, 1700000000.5, "", "  ", "1e9", "1700000000.5",
    1700000000000, "1700000000000", 253402300800,
  ])("rejects invalid or unsupported epoch seconds: %j", (value) => {
    expect(formatBillingTimestamp(value)).toBe("");
  });
});
