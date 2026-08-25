import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@workspace/database';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { EvaluatePolicyRequestDto } from './dto/evaluate-policy-request.dto';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  private readonly prisma = new PrismaClient();

  async getMerchantPolicy(merchantId: string) {
    let policy = await this.prisma.policy.findFirst({
      where: { merchantId },
    });

    if (!policy) {
      // Auto-create default policy guardrails for merchant
      policy = await this.prisma.policy.create({
        data: {
          merchantId,
          maxRetries: 3,
          minRecoveryProbability: 0.50,
          allowedActions: ['RETRY_PAYMENT', 'SEND_SMS_REMINDER', 'SEND_EMAIL_LINK'],
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
      });
    }

    return policy;
  }

  async updateMerchantPolicy(merchantId: string, dto: UpdatePolicyDto) {
    const existing = await this.getMerchantPolicy(merchantId);

    const updated = await this.prisma.policy.update({
      where: { id: existing.id },
      data: {
        maxRetries: dto.maxRetries ?? existing.maxRetries,
        minRecoveryProbability: dto.minRecoveryProbability ?? existing.minRecoveryProbability,
        allowedActions: dto.allowedActions ?? existing.allowedActions,
        quietHoursStart: dto.quietHoursStart ?? existing.quietHoursStart,
        quietHoursEnd: dto.quietHoursEnd ?? existing.quietHoursEnd,
      },
    });

    this.logger.log(`🛡️ Updated guardrail policy for merchant '${merchantId}': maxRetries=${updated.maxRetries}, minProb=${updated.minRecoveryProbability}`);
    return updated;
  }

  async evaluatePolicy(merchantId: string, dto: EvaluatePolicyRequestDto) {
    const policy = await this.getMerchantPolicy(merchantId);
    const evaluatedRules: string[] = [];
    let isAllowed = true;

    // Rule 1: Max Retries
    if (dto.currentAttemptCount >= policy.maxRetries) {
      evaluatedRules.push(`DENY: Attempt count (${dto.currentAttemptCount}) >= Merchant Max Retries (${policy.maxRetries})`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Attempt count (${dto.currentAttemptCount}) < Merchant Max Retries (${policy.maxRetries})`);
    }

    // Rule 2: Minimum Probability Threshold
    if (dto.recoveryProbability < policy.minRecoveryProbability && dto.proposedAction !== 'MANUAL_ESCALATION') {
      evaluatedRules.push(`DENY: Recovery probability (${dto.recoveryProbability}) < Min Threshold (${policy.minRecoveryProbability})`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Recovery probability (${dto.recoveryProbability}) >= Min Threshold (${policy.minRecoveryProbability})`);
    }

    // Rule 3: Allowed Actions List
    if (!policy.allowedActions.includes(dto.proposedAction) && dto.proposedAction !== 'MANUAL_ESCALATION') {
      evaluatedRules.push(`DENY: Proposed action '${dto.proposedAction}' is not permitted by merchant policy`);
      isAllowed = false;
    } else {
      evaluatedRules.push(`ALLOW: Proposed action '${dto.proposedAction}' is permitted by merchant policy`);
    }

    const outcome = isAllowed ? 'ALLOW' : 'DENY';

    return {
      merchantId,
      policyId: policy.id,
      outcome,
      evaluatedRules,
      policyLimits: {
        maxRetries: policy.maxRetries,
        minRecoveryProbability: policy.minRecoveryProbability,
        allowedActions: policy.allowedActions,
      },
    };
  }
}
