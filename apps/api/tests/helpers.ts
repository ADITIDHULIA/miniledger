import request from "supertest";
import { createApp } from "../src/app";
import { testOtpSink } from "../src/lib/otp";
import { prisma } from "../src/lib/prisma";

export const app = createApp();

export async function resetDb() {
  await prisma.loan.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.user.deleteMany();
  testOtpSink.clear();
}

/** Run the full OTP flow and return a token + user. */
export async function login(phone = "9876543210") {
  const normalized = `+91${phone}`;
  // Skip the resend cooldown for repeat logins in tests.
  await prisma.otpRequest.updateMany({
    where: { phone: normalized },
    data: { createdAt: new Date(Date.now() - 60_000) },
  });
  await request(app).post("/api/auth/send-otp").send({ phone }).expect(200);
  const res = await request(app)
    .post("/api/auth/verify-otp")
    .send({ phone, otp: testOtpSink.get(normalized) })
    .expect(200);
  return { token: res.body.data.token as string, userId: res.body.data.user.id as string };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const dateOnly = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000 + 5.5 * 3_600_000); // shift to IST calendar date
  return d.toISOString().slice(0, 10);
};
