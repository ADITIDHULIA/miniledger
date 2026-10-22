import { describe, expect, it } from "vitest";
import { formatINR, toDateOnly } from "../src/utils/format";
import { validateLoanForm, validateOtp, validatePhone } from "../src/utils/validation";

describe("formatINR", () => {
  it("uses Indian digit grouping and hides .00", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(99)).toBe("₹0.99");
    expect(formatINR(125050)).toBe("₹1,250.50");
    expect(formatINR(10000000)).toBe("₹1,00,000");
    expect(formatINR(123456700)).toBe("₹12,34,567");
  });
});

describe("toDateOnly", () => {
  it("formats local calendar dates", () => {
    expect(toDateOnly(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});

describe("validatePhone / validateOtp", () => {
  it("validates phone numbers", () => {
    expect(validatePhone("")).toMatch(/Enter/);
    expect(validatePhone("12345")).toMatch(/10-digit/);
    expect(validatePhone("5876543210")).toMatch(/10-digit/);
    expect(validatePhone("98765 43210")).toBeNull();
  });
  it("validates OTPs", () => {
    expect(validateOtp("")).toBeTruthy();
    expect(validateOtp("12345")).toBeTruthy();
    expect(validateOtp("123456")).toBeNull();
  });
});

describe("validateLoanForm", () => {
  const ok = { friendName: "Rohan", amount: "100", dueDate: new Date(), notes: "" };
  it("accepts a valid form", () => expect(validateLoanForm(ok)).toEqual({}));
  it("flags each invalid field", () => {
    const errors = validateLoanForm({ friendName: " ", amount: "0", dueDate: null, notes: "x".repeat(501) });
    expect(Object.keys(errors).sort()).toEqual(["amount", "dueDate", "friendName", "notes"]);
  });
  it("rejects bad amounts", () => {
    for (const amount of ["", "-5", "abc", "1.234", "0", "2000000"]) {
      expect(validateLoanForm({ ...ok, amount }).amount).toBeTruthy();
    }
    expect(validateLoanForm({ ...ok, amount: "99.5" }).amount).toBeUndefined();
  });
});
