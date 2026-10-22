# MiniLedger

A mobile app for tracking money you've lent to friends. Log in with your phone number (mock OTP), add loans with an optional receipt photo, see what's pending / overdue / repaid, and mark loans as repaid.

> **Assignment note:** authentication is a *mock* OTP flow for learning purposes. It is not production phone verification.

## Features

- Phone-number login with a 6-digit mock OTP (printed in the API console), 5-minute expiry, 5 attempts, resend cooldown and hourly send limit
- JWT-protected API; token persisted on the device with AsyncStorage; session restored on startup; expired tokens log the user out gracefully
- Dashboard: summary card (total lent / repaid / overdue), recent loans, pull-to-refresh, empty and loading states, INR formatting
- Add loan with client **and** server validation, optional receipt photo
- Loan list with All / Pending / Overdue / Repaid filters; overdue loans in orange/red, repaid in green
- Loan details, mark-as-repaid (with confirmation, duplicate-safe), delete unpaid loans
- 32 backend tests (Vitest + Supertest on an isolated test DB) + mobile utility tests

## Tech stack

| Layer    | Tech |
|----------|------|
| API      | Node.js, TypeScript, Express, Zod, JWT (`jsonwebtoken`), Multer |
| Database | PostgreSQL 16, Prisma 6 (with the `pg` driver adapter) |
| Mobile   | React Native, Expo SDK 58, TypeScript, React Navigation, Axios, AsyncStorage, expo-image-picker |
| Tooling  | ESLint, Prettier, Vitest, Supertest, Docker Compose |

```
miniledger/
├── apps/
│   ├── api/        Express + Prisma backend  (src/routes, src/middleware, src/schemas, prisma/, tests/)
│   └── mobile/     Expo app (src/screens, components, navigation, api, hooks, context, utils, theme, types)
├── docker/         Postgres init script (creates the test DB)
├── docs/           Demo checklist, interview notes, screenshots
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+ (22 recommended) and npm
- Docker Desktop **or** a local PostgreSQL 14+ install
- Git
- The **Expo Go** app on your phone (or an Android emulator / iOS simulator)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Start PostgreSQL

**Option A — Docker (recommended).** Start Docker Desktop, then:

```bash
npm run db:up
```

This creates user/password `miniledger` / `miniledger`, a `miniledger` database, and a `miniledger_test` database.

**Option B — local PostgreSQL (no Docker).** In `psql` (or pgAdmin) run:

```sql
CREATE USER miniledger WITH PASSWORD 'miniledger' CREATEDB;
CREATE DATABASE miniledger OWNER miniledger;
CREATE DATABASE miniledger_test OWNER miniledger;
```

If your credentials differ, change `DATABASE_URL` / `TEST_DATABASE_URL` in step 3.

### 3. Environment variables

```bash
# macOS / Linux / Git Bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```
```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/api/.env` and set `JWT_SECRET` to a long random string. Never commit `.env` files (they're git-ignored).

| Variable | App | Meaning |
|---|---|---|
| `DATABASE_URL` | api | Dev database connection string |
| `TEST_DATABASE_URL` | api | Test database — **must end in `_test`** (tests refuse to run otherwise) |
| `JWT_SECRET` | api | Secret used to sign tokens and hash OTPs |
| `JWT_EXPIRES_IN` | api | Token lifetime (default `7d`) |
| `PORT` | api | API port (default `4000`) |
| `EXPO_PUBLIC_API_URL` | mobile | API base URL (see below) |

### 4. Migrate and seed the database

```bash
npm run db:migrate    # applies prisma/migrations to the dev DB
npm run db:seed       # optional: sample loans for phone 9999999999
```

> While changing the schema in future, use `npm run prisma:migrate --prefix apps/api` (`prisma migrate dev`) to generate new migrations.

### 5. Run the API

```bash
npm run api:dev
```

You should see `MiniLedger API listening on http://0.0.0.0:4000`. Check http://localhost:4000/health.

### 6. Run the mobile app

```bash
npm run mobile:start
```

Scan the QR code with Expo Go (phone and laptop on the **same Wi-Fi**), or press `a` (Android emulator) / `i` (iOS simulator).

#### Pointing the app at the API

The app never hardcodes `localhost`. It uses `EXPO_PUBLIC_API_URL` from `apps/mobile/.env`:

| Where the app runs | Value |
|---|---|
| **Physical phone** | `http://<your-laptop-LAN-IP>:4000` — find the IP with `ipconfig` (Windows, "IPv4 Address") or `ifconfig` (macOS/Linux), e.g. `http://192.168.1.23:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| iOS simulator | `http://localhost:4000` |

If `EXPO_PUBLIC_API_URL` is left empty, the app falls back to the same LAN IP that serves the Expo bundle (usually correct for a physical phone). After editing `.env`, restart Expo with `npx expo start -c`.

**Windows firewall:** the first time Node listens on port 4000, allow it on *Private networks*. If the phone can't connect, open `http://<laptop-IP>:4000/health` in the phone's browser to test.

### OTP development workflow

1. Enter a phone number in the app and tap **Send OTP**.
2. Look at the terminal running the API: `[MOCK OTP] +919999999999 -> 482913`.
3. Type that code in the app. The OTP is never returned by the API or shown in the UI.

## Tests, lint, type checks

```bash
npm test             # API tests (needs Postgres running) + mobile tests
npm run lint
npm run typecheck
```

API tests run against `TEST_DATABASE_URL` only. `scripts/test-db.ts` and `src/config.ts` both refuse to run unless the database name ends in `_test`.

## Business rules (summary calculation)

All money is stored as **integer paise** (₹1 = 100 paise) — no floating point anywhere. The API sums and the app formats to ₹.

- Each loan is a single, fully outstanding amount until it is marked repaid (no partial repayments).
- `totalLent` = sum of **all** the user's loans, including repaid ones.
- `totalRepaid` = sum of loans marked repaid (full amounts).
- `overdueAmount` = sum of loans that are **not** repaid **and** whose `dueDate < now`. Repaid loans never count.
- Summaries are computed in PostgreSQL via Prisma aggregates, scoped to the authenticated user.
- **Due dates:** the app sends a date (`YYYY-MM-DD`). The API stores it as the *end of that day in IST* (`23:59:59.999 +05:30`). A loan due today is therefore *pending* until the day ends. A full ISO timestamp is also accepted and used as-is. Past due dates are allowed (so you can record an already-late loan).
- Status is computed from `isRepaid` and `dueDate`: `repaid` / `overdue` / `pending`.

## API reference

Base URL `http://<host>:4000`. All responses use one shape:

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "amount": "…" } } }
```

Protected endpoints need `Authorization: Bearer <token>`.

### Auth

**POST `/api/auth/send-otp`** — body `{ "phone": "9876543210" }` → `200`
```json
{ "success": true, "data": { "phone": "+919876543210", "expiresInSeconds": 300, "resendAfterSeconds": 30 } }
```
Errors: `400 VALIDATION_ERROR`, `429 OTP_COOLDOWN` (with `Retry-After`), `429 OTP_RATE_LIMIT`.

**POST `/api/auth/verify-otp`** — body `{ "phone": "9876543210", "otp": "482913" }` → `200`
```json
{ "success": true, "data": { "token": "<jwt>", "user": { "id": "…", "phone": "+919876543210" } } }
```
Errors: `400 OTP_INVALID` (with `attemptsLeft`), `400 OTP_EXPIRED`, `400 OTP_NOT_FOUND`, `429 OTP_ATTEMPTS_EXCEEDED`.

**GET `/api/auth/me`** → `200 { id, phone, createdAt }`; `401` without a valid token.

### Loans (all protected, all scoped to the logged-in user)

**POST `/api/loans`** — JSON or `multipart/form-data` (optional `receipt` file: JPEG/PNG/WebP, ≤ 5 MB)
```json
{ "friendName": "Rohan", "amount": "1250.50", "dueDate": "2026-12-01", "notes": "Dinner" }
```
→ `201`
```json
{ "success": true, "data": { "id": "…", "friendName": "Rohan", "amountPaise": 125050, "dueDate": "2026-12-01T18:29:59.999Z",
  "isRepaid": false, "repaidAt": null, "notes": "Dinner", "receiptUrl": null, "status": "pending", "createdAt": "…" } }
```

**GET `/api/loans?status=all|pending|overdue|repaid&limit=50&offset=0`** → `{ loans: [...], total, limit, offset }`, newest first.

**GET `/api/loans/summary`** →
```json
{ "success": true, "data": { "totalLentPaise": 1100050, "totalRepaidPaise": 80000, "overdueAmountPaise": 400000, "currency": "INR", "asOf": "…" } }
```

**GET `/api/loans/:id`** → loan, or `404` (also returned for another user's loan, so IDs can't be probed).

**PATCH `/api/loans/:id/repay`** → updated loan with `repaidAt`; `409 ALREADY_REPAID` if repeated.

**DELETE `/api/loans/:id`** → `{ id, deleted: true }`; `409 LOAN_REPAID` for repaid loans.

Example:
```bash
curl -X POST localhost:4000/api/loans -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"friendName":"Rohan","amount":500,"dueDate":"2026-12-01"}'
```

## Architectural decisions

- **Integer paise for money** — avoids floating-point errors; the DB also has `CHECK (amountPaise > 0)`.
- **Ownership in every query** — loan queries always filter by `id` *and* `userId`; another user's loan is indistinguishable from a missing one (404).
- **Atomic repay** — one conditional `UPDATE … WHERE isRepaid = false`, so double taps/races record only one repayment.
- **OTP stored hashed** (HMAC), single-use, expiring, attempt-limited; the OTP never appears in API responses.
- **Zod at the edge + central error handler** — consistent error JSON for validation, auth, upload and unexpected errors.
- **Server-side summary** — aggregates in the database, not from whatever the client has loaded.
- **Protected navigation by auth state** — the navigator renders either the auth stack or the app stack, so logged-out users can't reach app screens.
- **Prisma 6 `engineType = "client"`** with `@prisma/adapter-pg` — pure-JS driver, no native query-engine binary at runtime.

## Known limitations

- Mock OTP only; no SMS provider. OTP/rate limits are per phone number (there is no per-IP limiting).
- Receipts are stored on the API server's **local disk** (`apps/api/uploads`) and served from `/uploads/<uuid>.<ext>` by unguessable file name without authentication. Fine for a demo; production should use private object storage with signed URLs. The phone's local image URI is only used for the upload — it is never stored.
- No partial repayments, no editing of loans, no push notifications for due dates.
- Single currency (INR); amounts are capped at ₹10,00,000 per loan.
- The mobile UI has no automated component tests (only utility/validation tests).

## Screenshots

Add screenshots here after running the app:

| Login | OTP | Dashboard | Add loan | Loans |
|---|---|---|---|---|
| `docs/screenshots/login.png` | `docs/screenshots/otp.png` | `docs/screenshots/dashboard.png` | `docs/screenshots/add-loan.png` | `docs/screenshots/loans.png` |

See also: [`docs/INTERVIEW_NOTES.md`](docs/INTERVIEW_NOTES.md) and [`docs/DEMO_CHECKLIST.md`](docs/DEMO_CHECKLIST.md).
