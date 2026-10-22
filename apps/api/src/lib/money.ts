// All money is stored and calculated as integer paise (1 INR = 100 paise).

/** Convert a rupee amount ("1250.50" or 1250.5) to paise. Returns null if invalid (more than 2 decimals, negative, etc). */
export function rupeesToPaise(input: string | number): number | null {
  const text = typeof input === "number" ? String(input) : input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [rupees, fraction = ""] = text.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}
