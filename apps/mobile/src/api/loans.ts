import type { Loan, LoanFilter, Summary } from "../types";
import { api } from "./client";

export interface NewLoanInput {
  friendName: string;
  amount: string; // rupees as typed, e.g. "1250.50" — the server converts to paise
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  receiptUri?: string | null;
}

export async function fetchSummary() {
  const res = await api.get<{ data: Summary }>("/api/loans/summary");
  return res.data.data;
}

export async function fetchLoans(status: LoanFilter = "all", limit = 50) {
  const res = await api.get<{ data: { loans: Loan[]; total: number } }>("/api/loans", {
    params: { status, limit },
  });
  return res.data.data;
}

export async function fetchLoan(id: string) {
  const res = await api.get<{ data: Loan }>(`/api/loans/${id}`);
  return res.data.data;
}

export async function createLoan(input: NewLoanInput) {
  const form = new FormData();
  form.append("friendName", input.friendName.trim());
  form.append("amount", input.amount.trim());
  form.append("dueDate", input.dueDate);
  if (input.notes?.trim()) form.append("notes", input.notes.trim());
  if (input.receiptUri) {
    const ext = input.receiptUri.split(".").pop()?.toLowerCase();
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    // React Native's FormData accepts { uri, name, type } for files (not part of the DOM typings).
    form.append("receipt", {
      uri: input.receiptUri,
      name: `receipt.${ext ?? "jpg"}`,
      type,
    } as unknown as Blob);
  }
  const res = await api.post<{ data: Loan }>("/api/loans", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function repayLoan(id: string) {
  const res = await api.patch<{ data: Loan }>(`/api/loans/${id}/repay`);
  return res.data.data;
}

export async function deleteLoan(id: string) {
  await api.delete(`/api/loans/${id}`);
}
