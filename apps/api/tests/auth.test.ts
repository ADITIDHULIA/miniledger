import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { testOtpSink } from "../src/lib/otp";
import { prisma } from "../src/lib/prisma";
import { app, auth, login, resetDb } from "./helpers";

beforeEach(resetDb);

describe("POST /api/auth/send-otp", () => {
  it("creates an OTP, hashes it in the DB, and does not return it in the response", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({ phone: "98765 43210" }).expect(200);
    const otp = testOtpSink.get("+919876543210")!;
    expect(otp).toMatch(/^\d{6}$/);
    expect(JSON.stringify(res.body)).not.toContain(otp);
    const row = await prisma.otpRequest.findFirstOrThrow();
    expect(row.codeHash).not.toContain(otp);
  });

  it("rejects invalid phone numbers with a helpful message", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({ phone: "12345" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/10-digit/);
    await request(app).post("/api/auth/send-otp").send({}).expect(400);
  });

  it("enforces the resend cooldown", async () => {
    await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" }).expect(200);
    const res = await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" }).expect(429);
    expect(res.body.error.code).toBe("OTP_COOLDOWN");
    expect(res.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("limits sends per hour", async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.otpRequest.updateMany({ data: { createdAt: new Date(Date.now() - 60_000 * (i + 1)) } });
      await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" }).expect(200);
    }
    await prisma.otpRequest.updateMany({ data: { createdAt: new Date(Date.now() - 60_000) } });
    const res = await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" }).expect(429);
    expect(res.body.error.code).toBe("OTP_RATE_LIMIT");
  });
});

describe("POST /api/auth/verify-otp", () => {
  it("returns a JWT for a correct OTP and /me works with it", async () => {
    const { token } = await login();
    const me = await request(app).get("/api/auth/me").set(auth(token)).expect(200);
    expect(me.body.data.phone).toBe("+919876543210");
  });

  it("rejects a wrong OTP and counts attempts", async () => {
    await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" });
    const real = testOtpSink.get("+919876543210")!;
    const wrong = real === "111111" ? "222222" : "111111";
    const res = await request(app).post("/api/auth/verify-otp").send({ phone: "9876543210", otp: wrong }).expect(400);
    expect(res.body.error.code).toBe("OTP_INVALID");
    expect(res.body.error.details.attemptsLeft).toBe(4);
  });

  it("locks the OTP after too many wrong attempts, even if the right code is then used", async () => {
    await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" });
    const real = testOtpSink.get("+919876543210")!;
    const wrong = real === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++)
      await request(app).post("/api/auth/verify-otp").send({ phone: "9876543210", otp: wrong }).expect(400);
    const res = await request(app).post("/api/auth/verify-otp").send({ phone: "9876543210", otp: real }).expect(429);
    expect(res.body.error.code).toBe("OTP_ATTEMPTS_EXCEEDED");
  });

  it("rejects an expired OTP", async () => {
    await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" });
    await prisma.otpRequest.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: "9876543210", otp: testOtpSink.get("+919876543210") })
      .expect(400);
    expect(res.body.error.code).toBe("OTP_EXPIRED");
  });

  it("does not allow an OTP to be used twice", async () => {
    await request(app).post("/api/auth/send-otp").send({ phone: "9876543210" });
    const body = { phone: "9876543210", otp: testOtpSink.get("+919876543210") };
    await request(app).post("/api/auth/verify-otp").send(body).expect(200);
    await request(app).post("/api/auth/verify-otp").send(body).expect(400);
  });

  it("rejects malformed OTPs and verification without a request", async () => {
    await request(app).post("/api/auth/verify-otp").send({ phone: "9876543210", otp: "12" }).expect(400);
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: "9876543210", otp: "123456" })
      .expect(400);
    expect(res.body.error.code).toBe("OTP_NOT_FOUND");
  });
});

describe("token handling", () => {
  it("rejects missing and invalid tokens", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/loans").expect(401);
    await request(app).get("/api/loans").set(auth("not.a.token")).expect(401);
  });
});
