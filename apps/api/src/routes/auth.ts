import { timingSafeEqual } from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AppError, notFound } from "../lib/errors";
import { deliverOtp, generateOtp, hashOtp } from "../lib/otp";
import { prisma } from "../lib/prisma";
import { ok } from "../lib/response";
import { requireAuth } from "../middleware/auth";
import { sendOtpSchema, verifyOtpSchema } from "../schemas";

export const authRouter = Router();

authRouter.post("/send-otp", async (req, res, next) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    const now = Date.now();

    const last = await prisma.otpRequest.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (last) {
      const waitMs = last.createdAt.getTime() + config.otp.resendCooldownMs - now;
      if (waitMs > 0) {
        const retryAfterSeconds = Math.ceil(waitMs / 1000);
        res.setHeader("Retry-After", String(retryAfterSeconds));
        throw new AppError(429, "OTP_COOLDOWN", `Please wait ${retryAfterSeconds}s before requesting another OTP`, {
          retryAfterSeconds,
        });
      }
    }
    const sentLastHour = await prisma.otpRequest.count({
      where: { phone, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    });
    if (sentLastHour >= config.otp.maxSendsPerHour) {
      throw new AppError(429, "OTP_RATE_LIMIT", "Too many OTP requests. Try again in an hour.");
    }

    const code = generateOtp();
    await prisma.otpRequest.create({
      data: { phone, codeHash: hashOtp(phone, code), expiresAt: new Date(now + config.otp.ttlMs) },
    });
    deliverOtp(phone, code);

    ok(res, {
      phone,
      expiresInSeconds: config.otp.ttlMs / 1000,
      resendAfterSeconds: config.otp.resendCooldownMs / 1000,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    // Only the newest OTP for this phone is valid.
    const request = await prisma.otpRequest.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (!request || request.consumed)
      throw new AppError(400, "OTP_NOT_FOUND", "No active OTP. Please request a new one.");
    if (request.expiresAt.getTime() < Date.now())
      throw new AppError(400, "OTP_EXPIRED", "OTP has expired. Please request a new one.");
    if (request.attempts >= config.otp.maxAttempts) {
      throw new AppError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many wrong attempts. Please request a new OTP.");
    }

    // Count the attempt first (atomic increment) so parallel guesses can't bypass the limit.
    const updated = await prisma.otpRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
    if (updated.attempts > config.otp.maxAttempts) {
      throw new AppError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many wrong attempts. Please request a new OTP.");
    }

    const expected = Buffer.from(request.codeHash, "hex");
    const actual = Buffer.from(hashOtp(phone, otp), "hex");
    if (!timingSafeEqual(expected, actual)) {
      const left = config.otp.maxAttempts - updated.attempts;
      throw new AppError(400, "OTP_INVALID", `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.`, {
        attemptsLeft: left,
      });
    }

    // Consume exactly once.
    const consumed = await prisma.otpRequest.updateMany({
      where: { id: request.id, consumed: false },
      data: { consumed: true },
    });
    if (consumed.count === 0) throw new AppError(400, "OTP_NOT_FOUND", "OTP already used. Please request a new one.");

    const user = await prisma.user.upsert({ where: { phone }, update: {}, create: { phone } });
    const token = jwt.sign({}, config.jwtSecret, {
      subject: user.id,
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
    ok(res, { token, user: { id: user.id, phone: user.phone } });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw notFound("User");
    ok(res, { id: user.id, phone: user.phone, createdAt: user.createdAt });
  } catch (err) {
    next(err);
  }
});
