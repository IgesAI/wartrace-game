import { describe, expect, it } from "vitest";
import { addDays, dateKeyFor, isDateKey, msUntilNextRelease, nextReleaseAt, zonedMidnight } from "@/modules/domain/dates";

const at = (iso: string) => new Date(iso);

describe("America/New_York daily date key", () => {
  it("T-001: NY midnight changes the key, not UTC midnight", () => {
    // EST (UTC-5): NY midnight = 05:00Z
    expect(dateKeyFor(at("2026-01-15T04:59:59Z"))).toBe("2026-01-14");
    expect(dateKeyFor(at("2026-01-15T05:00:00Z"))).toBe("2026-01-15");
    // UTC midnight is still the previous NY day
    expect(dateKeyFor(at("2026-01-15T00:30:00Z"))).toBe("2026-01-14");
    // EDT (UTC-4): NY midnight = 04:00Z
    expect(dateKeyFor(at("2026-07-04T03:59:59Z"))).toBe("2026-07-03");
    expect(dateKeyFor(at("2026-07-04T04:00:00Z"))).toBe("2026-07-04");
  });

  it("T-002: spring-forward day (2026-03-08) is 23 hours long", () => {
    const start = zonedMidnight("2026-03-08");
    const end = zonedMidnight("2026-03-09");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3600_000).toBe(23);
    expect(dateKeyFor(at("2026-03-08T06:59:59Z"))).toBe("2026-03-08"); // 01:59:59 EST
    expect(dateKeyFor(at("2026-03-08T07:00:00Z"))).toBe("2026-03-08"); // 03:00 EDT
  });

  it("T-003: fall-back day (2026-11-01) is 25 hours with a repeated 01:00 hour", () => {
    const start = zonedMidnight("2026-11-01");
    const end = zonedMidnight("2026-11-02");
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3600_000).toBe(25);
    expect(dateKeyFor(at("2026-11-01T05:30:00Z"))).toBe("2026-11-01"); // first 01:30
    expect(dateKeyFor(at("2026-11-01T06:30:00Z"))).toBe("2026-11-01"); // second 01:30
    expect(dateKeyFor(at("2026-11-02T04:59:59Z"))).toBe("2026-11-01");
  });

  it("leap day and year rollover", () => {
    expect(dateKeyFor(at("2028-02-29T12:00:00Z"))).toBe("2028-02-29");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(dateKeyFor(at("2027-01-01T04:59:59Z"))).toBe("2026-12-31");
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
  });

  it("countdown targets the next NY midnight across DST", () => {
    expect(nextReleaseAt(at("2026-03-07T12:00:00Z")).toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(nextReleaseAt(at("2026-03-08T12:00:00Z")).toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect(msUntilNextRelease(at("2026-11-01T05:00:00Z"))).toBe(24 * 3600_000);
  });
});
