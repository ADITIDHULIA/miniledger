import "dotenv/config";

const isTest = process.env.NODE_ENV === "test";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const databaseUrl = isTest ? required("TEST_DATABASE_URL") : required("DATABASE_URL");

// Safety guard: tests wipe tables, so they may only ever touch a database named *_test.
if (isTest && !/_test(\?|$)/.test(new URL(databaseUrl).pathname + (new URL(databaseUrl).search || ""))) {
  throw new Error("Refusing to run tests: TEST_DATABASE_URL must point to a database whose name ends in _test");
}

export const config = {
  isTest,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl,
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  otp: {
    ttlMs: 5 * 60 * 1000, // OTP valid for 5 minutes
    maxAttempts: 5, // wrong guesses allowed per OTP
    resendCooldownMs: 30 * 1000, // min gap between sends for one phone
    maxSendsPerHour: 5,
  },
  businessUtcOffset: "+05:30", // IST: date-only due dates end at 23:59:59.999 IST
} as const;
