# Interview explanation (≈ 2 minutes)

**Architecture.** A monorepo with two apps. `apps/api` is a layered Express + TypeScript API: routes → Zod validation → Prisma → PostgreSQL, with auth middleware and one central error handler. `apps/mobile` is an Expo/React Native app: screens call a small Axios API layer through hooks; reusable components (SummaryCard, LoanCard, StatusBadge…) keep screens thin.

**OTP flow.** User enters a phone → `send-otp` generates a random 6-digit code, stores only an HMAC hash with a 5-minute expiry, and prints the code to the server console (mock SMS). `verify-otp` checks the newest OTP: not expired, not used, fewer than 5 attempts, constant-time hash comparison. On success it marks the OTP used, upserts the user, and returns a signed JWT. The app stores only the JWT (AsyncStorage), restores it at startup via `/auth/me`, and logs out automatically on a 401. Resend has a 30-second cooldown and a 5-per-hour cap.

**Database schema.** `User(id, phone unique, timestamps)`, `Loan(id, userId FK, friendName, amountPaise, dueDate, isRepaid, repaidAt, notes, receiptPath, timestamps)` and `OtpRequest` for the mock OTP. Money is integer paise. Indexes on `(userId, createdAt desc)` for the list and `(userId, isRepaid, dueDate)` for summary/overdue queries. CHECK constraints: amount > 0, and `isRepaid`/`repaidAt` must agree.

**API design.** REST, JSON envelope `{success, data | error}`, proper status codes (400 validation, 401 auth, 404 not found, 409 conflicts like double repayment, 429 rate limits). Every loan query filters by id **and** userId, so users can't touch each other's data. Repay is a single conditional UPDATE, so it is safe against double taps/races.

**Summary calculation.** Done in PostgreSQL with three aggregates: `totalLent` = all loans, `totalRepaid` = repaid loans, `overdueAmount` = unpaid loans with `dueDate < now`. A repaid loan never counts as overdue. A date-only due date means end of that day (IST), so "due today" isn't overdue yet.

**Testing.** 32 backend tests with Supertest on an isolated `_test` database (OTP rules, validation, ownership, repay + race, summary edge cases) plus mobile validation/format tests.

**Honest trade-offs to mention.** Mock OTP, local-disk receipts without auth, no partial payments — and what I'd change for production (SMS provider, S3 + signed URLs, refresh tokens, per-IP rate limiting).
