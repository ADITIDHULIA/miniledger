import { z } from "zod";
import { parseDueDate } from "../lib/dates";
import { rupeesToPaise } from "../lib/money";

// Accepts "9876543210", "+919876543210", "91 98765 43210" and normalises to +91XXXXXXXXXX (Indian mobile numbers).
export const phoneSchema = z
  .string({ required_error: "Phone number is required" })
  .transform((v) => v.replace(/[\s-]/g, ""))
  .transform((v) => v.replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => `+91${v}`);

export const sendOtpSchema = z.object({ phone: phoneSchema });
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: "Friend's name is required" })
    .trim()
    .min(1, "Friend's name is required")
    .max(80),
  amount: z
    .union([z.string(), z.number()], {
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .transform((v, ctx) => {
      const paise = rupeesToPaise(v);
      if (paise === null || paise <= 0) {
        ctx.addIssue({ code: "custom", message: "Amount must be greater than 0 (max 2 decimal places)" });
        return z.NEVER;
      }
      if (paise > 100_000_000) {
        ctx.addIssue({ code: "custom", message: "Amount cannot exceed ₹10,00,000" });
        return z.NEVER;
      }
      return paise;
    }),
  dueDate: z.string({ required_error: "Due date is required" }).transform((v, ctx) => {
    const date = parseDueDate(v);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Due date must be a valid date (YYYY-MM-DD)" });
      return z.NEVER;
    }
    return date;
  }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes can be at most 500 characters")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const listLoansQuerySchema = z.object({
  status: z.enum(["all", "pending", "overdue", "repaid"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
