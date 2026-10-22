import { createHmac, randomInt } from "crypto";
import { config } from "../config";

export const generateOtp = () => String(randomInt(100000, 1000000));

// Only an HMAC of the OTP is stored in the database, never the OTP itself.
export const hashOtp = (phone: string, code: string) =>
  createHmac("sha256", config.jwtSecret).update(`${phone}:${code}`).digest("hex");

/** Tests read the latest OTP from here (populated only when NODE_ENV=test). */
export const testOtpSink = new Map<string, string>();

/** Mock "SMS provider": prints the OTP to the server console. */
export function deliverOtp(phone: string, code: string) {
  if (config.isTest) testOtpSink.set(phone, code);
  else console.log(`\n[MOCK OTP] ${phone} -> ${code}  (valid ${config.otp.ttlMs / 60000} min)\n`);
}
