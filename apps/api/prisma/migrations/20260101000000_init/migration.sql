-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendName" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isRepaid" BOOLEAN NOT NULL DEFAULT false,
    "repaidAt" TIMESTAMP(3),
    "notes" TEXT,
    "receiptPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "OtpRequest_phone_createdAt_idx" ON "OtpRequest"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "Loan_userId_createdAt_idx" ON "Loan"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Loan_userId_isRepaid_dueDate_idx" ON "Loan"("userId", "isRepaid", "dueDate");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added business rules enforced at the database level
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_amountPaise_positive" CHECK ("amountPaise" > 0);
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_repaid_consistency" CHECK (("isRepaid" = true AND "repaidAt" IS NOT NULL) OR ("isRepaid" = false AND "repaidAt" IS NULL));
