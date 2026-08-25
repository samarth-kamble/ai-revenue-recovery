-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RecoveryCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED', 'STOPPED');

-- CreateEnum
CREATE TYPE "RecoveryActionType" AS ENUM ('RETRY_PAYMENT', 'SEND_REMINDER', 'REQUEST_PAYMENT_METHOD_UPDATE', 'ESCALATE', 'STOP');

-- CreateEnum
CREATE TYPE "RecoveryActionStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PolicyResult" AS ENUM ('ALLOWED', 'DENIED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('PAYMENT_CREATED', 'PAYMENT_FAILED', 'PAYMENT_SUCCEEDED', 'REVENUE_RISK_DETECTED', 'RECOVERY_CASE_CREATED', 'ML_PREDICTION_CREATED', 'AI_DECISION_CREATED', 'POLICY_APPROVED', 'POLICY_DENIED', 'RECOVERY_ACTION_SCHEDULED', 'RECOVERY_ACTION_EXECUTED', 'RECOVERY_COMPLETED', 'RECOVERY_ESCALATED', 'RECOVERY_STOPPED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "subscriptionType" TEXT,
    "lifetimeStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "method" TEXT,
    "failureReason" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "gatewayRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueRisk" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountAtRisk" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "reason" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCase" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "revenueRiskId" TEXT,
    "customerId" TEXT NOT NULL,
    "status" "RecoveryCaseStatus" NOT NULL DEFAULT 'OPEN',
    "correlationId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLPrediction" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "recoveryProbability" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "features" JSONB,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDecision" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "mlPredictionId" TEXT,
    "recommendedAction" "RecoveryActionType" NOT NULL,
    "delayHours" INTEGER,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "rawOutput" JSONB,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDecision" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "aiDecisionId" TEXT NOT NULL,
    "result" "PolicyResult" NOT NULL,
    "evaluatedAction" "RecoveryActionType" NOT NULL,
    "reason" TEXT,
    "violatedRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAction" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "policyDecisionId" TEXT NOT NULL,
    "aiDecisionId" TEXT,
    "type" "RecoveryActionType" NOT NULL,
    "status" "RecoveryActionStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "attemptId" TEXT,
    "workflowId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "recoveryActionId" TEXT,
    "customerId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "templateKey" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "AuditEventType" NOT NULL,
    "actor" TEXT NOT NULL,
    "paymentId" TEXT,
    "recoveryCaseId" TEXT,
    "decision" TEXT,
    "policyResult" "PolicyResult",
    "modelVersion" TEXT,
    "correlationId" TEXT,
    "traceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_externalId_key" ON "Customer"("externalId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_paymentId_idx" ON "PaymentAttempt"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_idx" ON "PaymentAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_paymentId_attemptNumber_key" ON "PaymentAttempt"("paymentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueRisk_paymentId_key" ON "RevenueRisk"("paymentId");

-- CreateIndex
CREATE INDEX "RevenueRisk_detectedAt_idx" ON "RevenueRisk"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCase_paymentId_key" ON "RecoveryCase"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCase_revenueRiskId_key" ON "RecoveryCase"("revenueRiskId");

-- CreateIndex
CREATE INDEX "RecoveryCase_status_idx" ON "RecoveryCase"("status");

-- CreateIndex
CREATE INDEX "RecoveryCase_customerId_idx" ON "RecoveryCase"("customerId");

-- CreateIndex
CREATE INDEX "RecoveryCase_correlationId_idx" ON "RecoveryCase"("correlationId");

-- CreateIndex
CREATE INDEX "MLPrediction_recoveryCaseId_idx" ON "MLPrediction"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "MLPrediction_modelVersion_idx" ON "MLPrediction"("modelVersion");

-- CreateIndex
CREATE INDEX "AIDecision_recoveryCaseId_idx" ON "AIDecision"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "AIDecision_recommendedAction_idx" ON "AIDecision"("recommendedAction");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDecision_aiDecisionId_key" ON "PolicyDecision"("aiDecisionId");

-- CreateIndex
CREATE INDEX "PolicyDecision_recoveryCaseId_idx" ON "PolicyDecision"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "PolicyDecision_result_idx" ON "PolicyDecision"("result");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_policyDecisionId_key" ON "RecoveryAction"("policyDecisionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_aiDecisionId_key" ON "RecoveryAction"("aiDecisionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_attemptId_key" ON "RecoveryAction"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_idempotencyKey_key" ON "RecoveryAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RecoveryAction_recoveryCaseId_idx" ON "RecoveryAction"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "RecoveryAction_status_idx" ON "RecoveryAction"("status");

-- CreateIndex
CREATE INDEX "RecoveryAction_scheduledFor_idx" ON "RecoveryAction"("scheduledFor");

-- CreateIndex
CREATE INDEX "Notification_recoveryCaseId_idx" ON "Notification"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "Notification_customerId_idx" ON "Notification"("customerId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_paymentId_idx" ON "AuditEvent"("paymentId");

-- CreateIndex
CREATE INDEX "AuditEvent_recoveryCaseId_idx" ON "AuditEvent"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

-- CreateIndex
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRisk" ADD CONSTRAINT "RevenueRisk_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_revenueRiskId_fkey" FOREIGN KEY ("revenueRiskId") REFERENCES "RevenueRisk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLPrediction" ADD CONSTRAINT "MLPrediction_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDecision" ADD CONSTRAINT "AIDecision_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDecision" ADD CONSTRAINT "AIDecision_mlPredictionId_fkey" FOREIGN KEY ("mlPredictionId") REFERENCES "MLPrediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDecision" ADD CONSTRAINT "PolicyDecision_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDecision" ADD CONSTRAINT "PolicyDecision_aiDecisionId_fkey" FOREIGN KEY ("aiDecisionId") REFERENCES "AIDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_policyDecisionId_fkey" FOREIGN KEY ("policyDecisionId") REFERENCES "PolicyDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_aiDecisionId_fkey" FOREIGN KEY ("aiDecisionId") REFERENCES "AIDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recoveryActionId_fkey" FOREIGN KEY ("recoveryActionId") REFERENCES "RecoveryAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
