export function validatePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "Enter your mobile number";
  if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit Indian mobile number";
  return null;
}

export function validateOtp(raw: string): string | null {
  if (!raw) return "Enter the 6-digit OTP";
  if (!/^\d{6}$/.test(raw)) return "OTP must be exactly 6 digits";
  return null;
}

export interface LoanFormValues {
  friendName: string;
  amount: string;
  dueDate: Date | null;
  notes: string;
}
export type LoanFormErrors = Partial<Record<"friendName" | "amount" | "dueDate" | "notes", string>>;

export function validateLoanForm(values: LoanFormValues): LoanFormErrors {
  const errors: LoanFormErrors = {};
  if (!values.friendName.trim()) errors.friendName = "Friend's name is required";
  else if (values.friendName.trim().length > 80) errors.friendName = "Name is too long (max 80 characters)";

  const amount = values.amount.trim();
  if (!amount) errors.amount = "Enter the amount";
  else if (!/^\d+(\.\d{1,2})?$/.test(amount)) errors.amount = "Enter a valid amount (up to 2 decimals)";
  else if (Number(amount) <= 0) errors.amount = "Amount must be greater than 0";
  else if (Number(amount) > 1_000_000) errors.amount = "Amount cannot exceed ₹10,00,000";

  if (!values.dueDate || Number.isNaN(values.dueDate.getTime())) errors.dueDate = "Pick a valid due date";
  if (values.notes.length > 500) errors.notes = "Notes can be at most 500 characters";
  return errors;
}
