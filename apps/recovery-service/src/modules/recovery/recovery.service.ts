import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@workspace/database';
import { EvaluateRecoveryDto } from './dto/evaluate-recovery.dto';

@Injectable()
export class RecoveryService {
  private readonly logger = new Logger(RecoveryService.name);
  private readonly prisma = new PrismaClient();

  /**
   * Complete End-to-End Decision Pipeline:
   * Payment Failure -> ML Prediction -> AI Agent Recommendation -> Policy Engine Check -> Action / Stop
   */
  async evaluateRecoveryCase(dto: EvaluateRecoveryDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: {
        customer: true,
        attempts: {
          include: { failures: true },
          orderBy: { attemptNumber: 'desc' },
        },
        revenueRisk: true,
        recoveryCase: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${dto.paymentId}' not found.`);
    }

    const merchantId = dto.merchantId || payment.merchantId;

    // Ensure RecoveryCase exists
    let recoveryCase = payment.recoveryCase;
    if (!recoveryCase) {
      recoveryCase = await this.prisma.recoveryCase.create({
        data: {
          paymentId: payment.id,
          merchantId,
          status: 'IN_PROGRESS',
          currentStep: 1,
          totalAttempts: payment.attempts.length,
        },
      });
    }

    // 1. ML Prediction Engine
    const latestAttempt = payment.attempts[0];
    const latestFailure = latestAttempt?.failures[0];
    const failureClass = latestFailure?.errorClassification || 'OTHER';

    const probabilityMap: Record<string, number> = {
      TRANSIENT_NETWORK: 0.92,
      GATEWAY_TIMEOUT: 0.85,
      BANK_DOWNTIME: 0.88,
      CARD_EXPIRED: 0.75,
      INSUFFICIENT_FUNDS: 0.65,
      INVALID_ACCOUNT: 0.15,
      OTHER: 0.50,
    };

    let recoveryProbability = probabilityMap[failureClass] ?? 0.50;

    // Adjust probability based on previous failed attempts
    if (payment.attempts.length > 1) {
      recoveryProbability = Math.max(0.05, recoveryProbability - (payment.attempts.length - 1) * 0.20);
    }

    const riskTier = recoveryProbability >= 0.75 ? 'LOW' : recoveryProbability >= 0.40 ? 'MEDIUM' : 'HIGH';

    const mlPrediction = await this.prisma.mLPrediction.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        recoveryProbability,
        riskTier,
        featureSnapshot: {
          amount: Number(payment.amount),
          currency: payment.currency,
          failureClassification: failureClass,
          attemptsCount: payment.attempts.length,
          customerEmail: payment.customer.email,
        },
        modelVersion: 'v1.0.0',
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        merchantId,
        recoveryCaseId: recoveryCase.id,
        eventType: 'PREDICTION_GENERATED',
        actor: 'ML_MODEL',
        details: {
          predictionId: mlPrediction.id,
          recoveryProbability,
          riskTier,
        },
      },
    });

    // 2. AI Recovery Agent Recommendation
    let recommendedAction: 'RETRY_PAYMENT' | 'SEND_SMS_REMINDER' | 'SEND_EMAIL_LINK' | 'WAIT_COOLDOWN' | 'MANUAL_ESCALATION';
    let delayMinutes = 30;
    let confidence = 0.88;
    let reasonCodes: string[] = [];

    if (recoveryProbability < 0.20 || payment.attempts.length >= 3) {
      recommendedAction = 'MANUAL_ESCALATION';
      delayMinutes = 0;
      confidence = 0.95;
      reasonCodes = ['LOW_PROBABILITY', 'MAX_RETRIES_REACHED', 'ESCALATE_TO_HUMAN'];
    } else if (failureClass === 'GATEWAY_TIMEOUT' || failureClass === 'TRANSIENT_NETWORK') {
      recommendedAction = 'RETRY_PAYMENT';
      delayMinutes = 15;
      confidence = 0.90;
      reasonCodes = ['TRANSIENT_FAILURE', 'HIGH_RECOVERY_PROBABILITY'];
    } else if (failureClass === 'INSUFFICIENT_FUNDS') {
      recommendedAction = 'SEND_SMS_REMINDER';
      delayMinutes = 720; // 12 hours
      confidence = 0.82;
      reasonCodes = ['INSUFFICIENT_FUNDS', 'SCHEDULE_REMINDER_AND_RETRY'];
    } else {
      recommendedAction = 'RETRY_PAYMENT';
      delayMinutes = 60;
      confidence = 0.75;
      reasonCodes = ['STANDARD_RETRY_POLICY'];
    }

    const aiDecision = await this.prisma.aIDecision.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        recommendedAction: recommendedAction as any,
        recommendedDelayMinutes: delayMinutes,
        confidenceScore: confidence,
        reasonCodes,
        agentVersion: 'v1.0.0',
        rawResponse: {
          recommendedAction,
          delayMinutes,
          confidence,
          reasonCodes,
        },
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        merchantId,
        recoveryCaseId: recoveryCase.id,
        eventType: 'RECOMMENDATION_CREATED',
        actor: 'AI_AGENT',
        details: {
          aiDecisionId: aiDecision.id,
          recommendedAction,
          delayMinutes,
          confidence,
        },
      },
    });

    // 3. Policy Engine Validation (ALLOW / DENY & Stopping Rules)
    const policy = await this.prisma.policy.findFirst({
      where: { merchantId },
    });

    const maxRetries = policy?.maxRetries ?? 3;
    const minProbability = policy?.minRecoveryProbability ?? 0.50;
    const allowedActions = policy?.allowedActions ?? ['RETRY_PAYMENT', 'SEND_SMS_REMINDER', 'SEND_EMAIL_LINK'];

    const evaluatedRules: string[] = [];
    let isAllowed = true;

    // Rule 1: Attempt Count Limit
    if (payment.attempts.length >= maxRetries) {
      evaluatedRules.push(`DENY: Attempt count (${payment.attempts.length}) >= Max Retries (${maxRetries})`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Attempt count (${payment.attempts.length}) < Max Retries (${maxRetries})`);
    }

    // Rule 2: Minimum Recovery Probability Threshold
    if (recoveryProbability < minProbability && recommendedAction !== 'MANUAL_ESCALATION') {
      evaluatedRules.push(`DENY: Probability (${recoveryProbability}) < Min Threshold (${minProbability})`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Probability (${recoveryProbability}) >= Min Threshold (${minProbability})`);
    }

    // Rule 3: Allowed Action Configuration
    if (!allowedActions.includes(recommendedAction) && recommendedAction !== 'MANUAL_ESCALATION') {
      evaluatedRules.push(`DENY: Action '${recommendedAction}' is not in merchant allowed actions list`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Action '${recommendedAction}' is permitted by merchant policy`);
    }

    const outcome = isAllowed ? 'ALLOW' : 'DENY';

    const policyDecision = await this.prisma.policyDecision.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        aiDecisionId: aiDecision.id,
        outcome,
        evaluatedRules,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        merchantId,
        recoveryCaseId: recoveryCase.id,
        eventType: 'POLICY_EVALUATED',
        actor: 'POLICY_ENGINE',
        details: {
          policyDecisionId: policyDecision.id,
          outcome,
          evaluatedRules,
        },
      },
    });

    // 4. Execution / Stopping Decision
    let scheduledAction: any = null;
    if (outcome === 'ALLOW' && recommendedAction !== 'MANUAL_ESCALATION') {
      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
      const idempotencyKey = `act_${recoveryCase.id}_step_${recoveryCase.currentStep + 1}_${Date.now()}`;

      scheduledAction = await this.prisma.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          actionType: recommendedAction as any,
          status: 'SCHEDULED',
          scheduledAt,
          idempotencyKey,
        },
      });

      await this.prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: 'IN_PROGRESS',
          currentStep: recoveryCase.currentStep + 1,
        },
      });

      await this.prisma.auditEvent.create({
        data: {
          merchantId,
          recoveryCaseId: recoveryCase.id,
          eventType: 'ACTION_SCHEDULED',
          actor: 'WORKFLOW_ENGINE',
          details: {
            actionId: scheduledAction?.id,
            actionType: recommendedAction,
            scheduledAt: scheduledAt.toISOString(),
          },
        },
      });
    } else {
      // DENY or ESCALATE -> STOP WORKFLOW
      const stopReason = !isAllowed ? 'POLICY_DENIED' : 'ESCALATED_TO_OPERATOR';
      await this.prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: recommendedAction === 'MANUAL_ESCALATION' ? 'ESCALATED' : 'STOPPED',
          stoppedReason: stopReason,
        },
      });

      await this.prisma.auditEvent.create({
        data: {
          merchantId,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RECOVERY_STOPPED',
          actor: 'POLICY_ENGINE',
          details: {
            reason: stopReason,
            evaluatedRules,
          },
        },
      });
    }

    return {
      recoveryCaseId: recoveryCase.id,
      mlPrediction: {
        probability: recoveryProbability,
        riskTier,
      },
      aiDecision: {
        recommendedAction,
        delayMinutes,
        confidence,
        reasonCodes,
      },
      policyDecision: {
        outcome,
        evaluatedRules,
      },
      scheduledAction,
    };
  }

  async getRecoveryCaseById(id: string, merchantId: string) {
    const recoveryCase = await this.prisma.recoveryCase.findFirst({
      where: { id, merchantId },
      include: {
        payment: {
          include: { customer: true, attempts: true },
        },
        predictions: { orderBy: { createdAt: 'desc' } },
        aiDecisions: { orderBy: { createdAt: 'desc' } },
        policyDecisions: { orderBy: { createdAt: 'desc' } },
        recoveryActions: { orderBy: { createdAt: 'desc' } },
        auditEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!recoveryCase) {
      throw new NotFoundException(`RecoveryCase with ID '${id}' not found.`);
    }

    return recoveryCase;
  }

  async listRecoveryCases(merchantId: string) {
    return this.prisma.recoveryCase.findMany({
      where: { merchantId },
      include: {
        payment: { include: { customer: true } },
        predictions: { take: 1, orderBy: { createdAt: 'desc' } },
        aiDecisions: { take: 1, orderBy: { createdAt: 'desc' } },
        policyDecisions: { take: 1, orderBy: { createdAt: 'desc' } },
        recoveryActions: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
