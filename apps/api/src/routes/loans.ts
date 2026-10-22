import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import type { Loan, Prisma } from "@prisma/client";
import { AppError, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { ok } from "../lib/response";
import { requireAuth } from "../middleware/auth";
import { createLoanSchema, idParamSchema, listLoansQuerySchema } from "../schemas";

export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

// Simple local-disk storage. Random file names; extension chosen from the validated MIME type.
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED[file.mimetype] ?? ".bin"}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype]
      ? cb(null, true)
      : cb(new AppError(400, "INVALID_FILE", "Receipt must be a JPEG, PNG or WebP image")),
});

export const loansRouter = Router();
loansRouter.use(requireAuth);

type LoanStatus = "pending" | "overdue" | "repaid";
const statusOf = (loan: Loan, now: Date): LoanStatus =>
  loan.isRepaid ? "repaid" : loan.dueDate < now ? "overdue" : "pending";

const serialize = (loan: Loan, now = new Date()) => ({
  id: loan.id,
  friendName: loan.friendName,
  amountPaise: loan.amountPaise,
  dueDate: loan.dueDate.toISOString(),
  isRepaid: loan.isRepaid,
  repaidAt: loan.repaidAt?.toISOString() ?? null,
  notes: loan.notes,
  receiptUrl: loan.receiptPath ? `/uploads/${loan.receiptPath}` : null,
  status: statusOf(loan, now),
  createdAt: loan.createdAt.toISOString(),
});

const removeFile = (name?: string | null) => {
  if (name) fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined);
};

// POST /api/loans  (JSON, or multipart/form-data with an optional `receipt` image)
loansRouter.post("/", upload.single("receipt"), async (req, res, next) => {
  const uploaded = req.file?.filename;
  try {
    const data = createLoanSchema.parse(req.body);
    const loan = await prisma.loan.create({
      data: {
        userId: req.userId!,
        friendName: data.friendName,
        amountPaise: data.amount,
        dueDate: data.dueDate,
        notes: data.notes,
        receiptPath: uploaded,
      },
    });
    ok(res, serialize(loan), 201);
  } catch (err) {
    removeFile(uploaded); // don't leave orphaned files when validation fails
    next(err);
  }
});

// GET /api/loans/summary  — computed in the database with aggregates, never from client data.
// Must be declared before "/:id".
loansRouter.get("/summary", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const [lent, repaid, overdue] = await prisma.$transaction([
      prisma.loan.aggregate({ where: { userId }, _sum: { amountPaise: true } }),
      prisma.loan.aggregate({ where: { userId, isRepaid: true }, _sum: { amountPaise: true } }),
      prisma.loan.aggregate({ where: { userId, isRepaid: false, dueDate: { lt: now } }, _sum: { amountPaise: true } }),
    ]);
    ok(res, {
      totalLentPaise: lent._sum.amountPaise ?? 0,
      totalRepaidPaise: repaid._sum.amountPaise ?? 0,
      overdueAmountPaise: overdue._sum.amountPaise ?? 0,
      currency: "INR",
      asOf: now.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/loans?status=all|pending|overdue|repaid
loansRouter.get("/", async (req, res, next) => {
  try {
    const { status, limit, offset } = listLoansQuerySchema.parse(req.query);
    const now = new Date();
    const where: Prisma.LoanWhereInput = { userId: req.userId! };
    if (status === "repaid") where.isRepaid = true;
    if (status === "pending") Object.assign(where, { isRepaid: false, dueDate: { gte: now } });
    if (status === "overdue") Object.assign(where, { isRepaid: false, dueDate: { lt: now } });

    const [loans, total] = await prisma.$transaction([
      prisma.loan.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      prisma.loan.count({ where }),
    ]);
    ok(res, { loans: loans.map((l) => serialize(l, now)), total, limit, offset });
  } catch (err) {
    next(err);
  }
});

// Every query below filters by BOTH id and userId, so changing an ID never exposes another user's data.
const findOwned = async (id: string, userId: string) => {
  const parsed = idParamSchema.safeParse({ id });
  if (!parsed.success) throw notFound("Loan");
  const loan = await prisma.loan.findFirst({ where: { id, userId } });
  if (!loan) throw notFound("Loan");
  return loan;
};

loansRouter.get("/:id", async (req, res, next) => {
  try {
    ok(res, serialize(await findOwned(req.params.id, req.userId!)));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/loans/:id/repay — one atomic conditional UPDATE: only succeeds if the loan is still unpaid,
// so double-taps and parallel requests can never record a repayment twice.
loansRouter.patch("/:id/repay", async (req, res, next) => {
  try {
    const loan = await findOwned(req.params.id, req.userId!);
    const result = await prisma.loan.updateMany({
      where: { id: loan.id, userId: req.userId!, isRepaid: false },
      data: { isRepaid: true, repaidAt: new Date() },
    });
    if (result.count === 0) throw new AppError(409, "ALREADY_REPAID", "This loan is already marked as repaid");
    ok(res, serialize(await findOwned(loan.id, req.userId!)));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/loans/:id — only unpaid loans can be deleted.
loansRouter.delete("/:id", async (req, res, next) => {
  try {
    const loan = await findOwned(req.params.id, req.userId!);
    const result = await prisma.loan.deleteMany({ where: { id: loan.id, userId: req.userId!, isRepaid: false } });
    if (result.count === 0) throw new AppError(409, "LOAN_REPAID", "Repaid loans cannot be deleted");
    removeFile(loan.receiptPath);
    ok(res, { id: loan.id, deleted: true });
  } catch (err) {
    next(err);
  }
});
