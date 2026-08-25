import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@workspace/database';
import { CreatePaymentDto, PaymentStatusEnum } from './dto/create-payment.dto';
import { RecordAttemptDto, PaymentAttemptStatusEnum, FailureClassificationEnum } from './dto/record-attempt.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly prisma = new PrismaClient();

  async createPayment(dto: CreatePaymentDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID '${dto.merchantId}' not found.`);
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID '${dto.customerId}' not found.`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        merchantId: dto.merchantId!,
        customerId: dto.customerId,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        status: (dto.status || PaymentStatusEnum.PENDING) as any,
        gateway: dto.gateway || 'RAZORPAY',
        metadata: dto.metadata as any,
      },
      include: {
        customer: true,
      },
    });

    this.logger.log(`Created Payment '${payment.id}' for Merchant '${payment.merchantId}'`);
    return payment;
  }

  async recordAttempt(dto: RecordAttemptDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${dto.paymentId}' not found.`);
    }

    // Idempotency check
    const existingAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existingAttempt) {
      this.logger.warn(`Idempotent retry detected for key '${dto.idempotencyKey}'`);
      return {
        duplicate: true,
        attempt: existingAttempt,
      };
    }

    // Create PaymentAttempt
    const attempt = await this.prisma.paymentAttempt.create({
      data: {
        paymentId: dto.paymentId,
        attemptNumber: dto.attemptNumber || 1,
        gateway: dto.gateway || payment.gateway,
        gatewayTransactionId: dto.gatewayTransactionId,
        status: dto.status as any,
        idempotencyKey: dto.idempotencyKey,
        rawResponse: dto.rawResponse as any,
      },
    });

    if (dto.status === PaymentAttemptStatusEnum.SUCCESS) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CAPTURED' },
      });
    } else if (dto.status === PaymentAttemptStatusEnum.FAILED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await this.prisma.paymentFailure.create({
        data: {
          paymentAttemptId: attempt.id,
          rawErrorCode: dto.rawErrorCode || 'GENERIC_FAILURE',
          errorClassification: (dto.errorClassification || FailureClassificationEnum.OTHER) as any,
          errorMessage: dto.errorMessage || 'Payment processing failed',
        },
      });

      await this.triggerRecoveryIfApplicable(payment, attempt, dto);
    }

    return {
      duplicate: false,
      attempt,
    };
  }

  private async triggerRecoveryIfApplicable(
    payment: { id: string; merchantId: string; amount: any; currency: string },
    attempt: { id: string },
    dto: RecordAttemptDto,
  ) {
    try {
      const existingRisk = await this.prisma.revenueRisk.findUnique({
        where: { paymentId: payment.id },
      });

      if (!existingRisk) {
        const risk = await this.prisma.revenueRisk.create({
          data: {
            paymentId: payment.id,
            merchantId: payment.merchantId,
            amountAtRisk: payment.amount,
            currency: payment.currency,
            riskScore: 0.85,
            status: 'ACTIVE_RECOVERY',
          },
        });

        const recoveryCase = await this.prisma.recoveryCase.create({
          data: {
            paymentId: payment.id,
            merchantId: payment.merchantId,
            status: 'IN_PROGRESS',
            currentStep: 1,
            totalAttempts: 1,
          },
        });

        await this.prisma.auditEvent.create({
          data: {
            merchantId: payment.merchantId,
            recoveryCaseId: recoveryCase.id,
            eventType: 'RISK_DETECTED',
            actor: 'SYSTEM',
            details: {
              amountAtRisk: payment.amount,
              riskId: risk.id,
              reason: `Payment failure: ${dto.errorMessage || dto.errorClassification || 'FAILED'}`,
            },
          },
        });

        this.logger.log(`Initialized RevenueRisk '${risk.id}' & RecoveryCase '${recoveryCase.id}' for payment '${payment.id}'`);
      }
    } catch (err) {
      this.logger.error(`Failed to trigger recovery for payment '${payment.id}':`, err);
    }
  }

  async getPaymentsByMerchant(merchantId: string) {
    return this.prisma.payment.findMany({
      where: { merchantId },
      include: {
        customer: true,
        attempts: {
          include: {
            failures: true,
          },
        },
        revenueRisk: true,
        recoveryCase: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(id: string, merchantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, merchantId },
      include: {
        customer: true,
        attempts: {
          include: {
            failures: true,
          },
        },
        revenueRisk: true,
        recoveryCase: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${id}' not found for merchant '${merchantId}'`);
    }

    return payment;
  }
}
