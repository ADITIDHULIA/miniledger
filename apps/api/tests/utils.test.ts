import { describe, expect, it } from "vitest";
import { parseDueDate } from "../src/lib/dates";
import { rupeesToPaise } from "../src/lib/money";

describe("rupeesToPaise", () => {
  it("converts without floating point error", () => {
    expect(rupeesToPaise("0.10")).toBe(10);
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise("100")).toBe(10000);
    expect(rupeesToPaise("1.5")).toBe(150);
  });
  it("rejects bad values", () => {
    for (const v of ["", "-1", "1.234", "1e3", "abc", "1,000"]) expect(rupeesToPaise(v)).toBeNull();
  });
});

describe("parseDueDate", () => {
  it("uses end of day IST for date-only input", () => {
    expect(parseDueDate("2026-03-01")?.toISOString()).toBe("2026-03-01T18:29:59.999Z");
  });
  it("returns null for garbage", () => {
    expect(parseDueDate("hello")).toBeNull();
    expect(parseDueDate("2026-13-45")).toBeNull();
  });
});
