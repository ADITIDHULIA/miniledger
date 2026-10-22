export type LoanStatus = "pending" | "overdue" | "repaid";
export type LoanFilter = "all" | LoanStatus;

export interface Loan {
  id: string;
  friendName: string;
  amountPaise: number;
  dueDate: string;
  isRepaid: boolean;
  repaidAt: string | null;
  notes: string | null;
  receiptUrl: string | null;
  status: LoanStatus;
  createdAt: string;
}

export interface Summary {
  totalLentPaise: number;
  totalRepaidPaise: number;
  overdueAmountPaise: number;
}

export interface User {
  id: string;
  phone: string;
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: Record<string, string> };
}
