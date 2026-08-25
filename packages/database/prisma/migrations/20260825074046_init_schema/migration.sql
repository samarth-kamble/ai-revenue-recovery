-- CreateEnum
CREATE TYPE "FailureCode" AS ENUM ('INSUFFICIENT_FUNDS', 'EXPIRED_CARD', 'BANK_DOWNTIME', 'AUTHENTICATION_FAILED', 'GATEWAY_TIMEOUT', 'INVALID_CARD', 'MANDATE_EXPIRED');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "AIDecision" ADD COLUMN     "agentVersion" TEXT,
ADD COLUMN     "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "PolicyDecision" ADD COLUMN     "policyId" TEXT,
ADD COLUMN     "policyVersion" INTEGER;

-- CreateTable
CREATE TABLE "PaymentFailure" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "paymentAttemptId" TEXT NOT NULL,
    "failureCode" "FailureCode" NOT NULL,
    "failureReason" TEXT NOT NULL,
    "isTransient" BOOLEAN NOT NULL DEFAULT false,
    "rawDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "rules" JSONB NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentFailure_paymentAttemptId_key" ON "PaymentFailure"("paymentAttemptId");

-- CreateIndex
CREATE INDEX "PaymentFailure_paymentId_idx" ON "PaymentFailure"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentFailure_failureCode_idx" ON "PaymentFailure"("failureCode");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_name_version_key" ON "Policy"("name", "version");

-- CreateIndex
CREATE INDEX "PolicyDecision_policyId_idx" ON "PolicyDecision"("policyId");

-- AddForeignKey
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFailure" ADD CONSTRAINT "PaymentFailure_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDecision" ADD CONSTRAINT "PolicyDecision_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
