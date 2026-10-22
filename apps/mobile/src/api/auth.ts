import type { User } from "../types";
import { api } from "./client";

export async function sendOtp(phone: string) {
  const res = await api.post<{ data: { phone: string; resendAfterSeconds: number } }>("/api/auth/send-otp", {
    phone,
  });
  return res.data.data;
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await api.post<{ data: { token: string; user: User } }>("/api/auth/verify-otp", { phone, otp });
  return res.data.data;
}

export async function fetchMe() {
  const res = await api.get<{ data: User }>("/api/auth/me");
  return res.data.data;
}
