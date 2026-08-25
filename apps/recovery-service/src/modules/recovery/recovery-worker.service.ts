import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@workspace/database';

@Injectable()
export class RecoveryWorkerService {
  private readonly logger = new Logger(RecoveryWorkerService.name);
  private readonly prisma = new PrismaClient();

  async executePendingActions(merchantIdFilter?: string) {
    // 1. Fetch SCHEDULED actions
    const pendingActions = await this.prisma.recoveryAction.findMany({
      where: {
        status: 'SCHEDULED',
      },
      include: {
        recoveryCase: {
          include: {
            payment: {
              include: { customer: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    if (pendingActions.length === 0) {
      return {
        executedCount: 0,
        message: 'No pending recovery actions found.',
        actions: [],
      };
    }

    const executedResults: Array<{ actionId: string; actionType: string; outcome: string; paymentId: string; amountRecovered?: number }> = [];

    for (const action of pendingActions) {
      const caseItem = action.recoveryCase;
      const payment = caseItem.payment;
      const merchantId = caseItem.merchantId || merchantIdFilter || 'merch_demo_rzp';

      this.logger.log(`⚡ Executing scheduled recovery action '${action.actionType}' for Case ID ${caseItem.id} (Payment ID ${payment.id})`);

      if (action.actionType === 'RETRY_PAYMENT') {
        // Execute Payment Retry -> Succeeds and marks case RECOVERED
        await this.prisma.recoveryAction.update({
          where: { id: action.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(),
          },
        });

        await this.prisma.recoveryCase.update({
          where: { id: caseItem.id },
          data: {
            status: 'RECOVERED',
          },
        });

        await this.prisma.auditEvent.create({
          data: {
            merchantId,
            recoveryCaseId: caseItem.id,
            eventType: 'PAYMENT_RECOVERED',
            actor: 'RECOVERY_WORKER',
            details: {
              actionId: action.id,
              actionType: action.actionType,
              paymentId: payment.id,
              amountRecovered: Number(payment.amount),
              currency: payment.currency,
              message: 'Payment retry succeeded on attempt. Case marked RECOVERED.',
            },
          },
        });

        executedResults.push({
          actionId: action.id,
          actionType: action.actionType,
          outcome: 'RECOVERED',
          paymentId: payment.id,
          amountRecovered: Number(payment.amount),
        });
      } else if (action.actionType === 'SEND_SMS_REMINDER' || action.actionType === 'SEND_EMAIL_LINK') {
        // Execute Customer Outreach Notification
        await this.prisma.recoveryAction.update({
          where: { id: action.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(),
          },
        });

        await this.prisma.auditEvent.create({
          data: {
            merchantId,
            recoveryCaseId: caseItem.id,
            eventType: 'ACTION_EXECUTED',
            actor: 'RECOVERY_WORKER',
            details: {
              actionId: action.id,
              actionType: action.actionType,
              recipientEmail: payment.customer.email,
              recipientPhone: payment.customer.phone,
              message: `Dispatched customer outreach via ${action.actionType}.`,
            },
          },
        });

        executedResults.push({
          actionId: action.id,
          actionType: action.actionType,
          outcome: 'NOTIFIED',
          paymentId: payment.id,
        });
      } else {
        // Manual Escalation or Other
        await this.prisma.recoveryAction.update({
          where: { id: action.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(),
          },
        });

        await this.prisma.recoveryCase.update({
          where: { id: caseItem.id },
          data: {
            status: 'ESCALATED',
          },
        });

        await this.prisma.auditEvent.create({
          data: {
            merchantId,
            recoveryCaseId: caseItem.id,
            eventType: 'ACTION_EXECUTED',
            actor: 'RECOVERY_WORKER',
            details: {
              actionId: action.id,
              actionType: action.actionType,
              reason: 'Escalated to human operator for manual resolution.',
            },
          },
        });

        executedResults.push({
          actionId: action.id,
          actionType: action.actionType,
          outcome: 'ESCALATED',
          paymentId: payment.id,
        });
      }
    }

    return {
      executedCount: executedResults.length,
      message: `Successfully executed ${executedResults.length} pending recovery actions.`,
      actions: executedResults,
    };
  }
}
