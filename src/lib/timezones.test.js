import { afterEach, describe, expect, it, vi } from "vitest";
import { availableTimezones, isValidTimezone, normalizeTimezone } from "./timezones.js";

afterEach(() => vi.restoreAllMocks());

describe("time zone choices", () => {
  it("enumerates supported zones, keeps UTC first and preserves an existing alias", () => {
    const supported = Intl.supportedValuesOf("timeZone");
    const zones = availableTimezones("US/Eastern");
    expect(zones[0]).toBe("UTC");
    expect(zones).toContain("US/Eastern");
    expect(zones).toEqual(expect.arrayContaining(supported));
    expect(new Set(zones).size).toBe(zones.length);
  });

  it.each(["missing", "throws"])("keeps common choices and custom saved names when enumeration %s", (kind) => {
    vi.spyOn(Intl, "supportedValuesOf").mockImplementation(kind === "throws"
      ? () => { throw new RangeError("Unsupported key"); } : () => undefined);
    const zones = availableTimezones("Future/Server_Zone");
    expect(zones[0]).toBe("UTC");
    expect(zones).toContain("Asia/Shanghai");
    expect(zones).toContain("America/New_York");
    expect(zones).toContain("Future/Server_Zone");
    expect(zones.every((zone) => zone === "Future/Server_Zone" || isValidTimezone(zone))).toBe(true);
  });

  it("normalizes newly entered case variants to a browser-supported zone", () => {
    expect(normalizeTimezone("asia/shanghai")).toBe("Asia/Shanghai");
    expect(normalizeTimezone("utc")).toBe("UTC");
    expect(isValidTimezone("US/Eastern")).toBe(true);
    expect(isValidTimezone("Etc/GMT+8")).toBe(true);
  });

  it.each(["", "Invalid/Zone", "+08:00", "+0800", "SystemV/EST5EDT", "Factory", " Asia/Shanghai ", "a".repeat(101)])(
    "rejects incompatible custom value %s", (value) => {
      expect(normalizeTimezone(value)).toBeNull();
      expect(isValidTimezone(value)).toBe(false);
    }
  );
});
