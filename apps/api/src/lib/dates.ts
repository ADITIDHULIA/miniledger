import { config } from "../config";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a due date. A date-only string (YYYY-MM-DD) means "end of that day in IST",
 * so a loan due today is still pending until the day is over.
 * Full ISO timestamps are used as given. Returns null if invalid.
 */
export function parseDueDate(input: string): Date | null {
  const value = DATE_ONLY.test(input) ? `${input}T23:59:59.999${config.businessUtcOffset}` : input;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
