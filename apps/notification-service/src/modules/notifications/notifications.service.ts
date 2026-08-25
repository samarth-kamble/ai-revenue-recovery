import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@workspace/database';
import { SendNotificationDto, NotificationChannel, OutreachActionType } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly prisma = new PrismaClient();

  async sendOutreachNotification(dto: SendNotificationDto) {
    const merchantId = dto.merchantId || 'merch_demo_rzp';

    // 1. Fetch Payment & Customer details if available
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { customer: true, recoveryCase: true },
    });

    const recipientName = dto.recipientName || payment?.customer?.name || 'Valued Customer';
    const recipientEmail = dto.recipientEmail || payment?.customer?.email || 'customer@example.com';
    const recipientPhone = dto.recipientPhone || payment?.customer?.phone || '+919876543210';
    const amountStr = dto.amount ? `₹${dto.amount.toLocaleString('en-IN')}` : payment ? `₹${Number(payment.amount).toLocaleString('en-IN')}` : '₹4,999';
    const recoveryCaseId = dto.recoveryCaseId || payment?.recoveryCase?.id;

    // 2. Select Channel & Build Template
    let channel = dto.channel;
    if (!channel) {
      channel = dto.actionType === OutreachActionType.SEND_SMS_REMINDER ? NotificationChannel.SMS : NotificationChannel.EMAIL;
    }

    let messageBody = dto.customMessage;
    const recoveryLink = `https://rzp.recover/${dto.paymentId}`;

    if (!messageBody) {
      if (dto.actionType === OutreachActionType.SEND_SMS_REMINDER) {
        messageBody = `Hi ${recipientName}, your payment of ${amountStr} failed due to insufficient funds. Retry securely here: ${recoveryLink}`;
      } else if (dto.actionType === OutreachActionType.SEND_EMAIL_LINK) {
        messageBody = `Hi ${recipientName}, please update your payment method to complete your purchase of ${amountStr}. Secure link: ${recoveryLink}`;
      } else {
        messageBody = `Hi ${recipientName}, your payment of ${amountStr} was received successfully! Receipt ID: ${dto.paymentId}`;
      }
    }

    const providerMessageId = `msg_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    this.logger.log(`📱 [${channel}] Dispatching outreach notification via ${channel === NotificationChannel.SMS ? 'Twilio' : 'SendGrid'} simulated provider to ${channel === NotificationChannel.SMS ? recipientPhone : recipientEmail}`);

    // 3. Log Audit Event in Database
    if (recoveryCaseId) {
      await this.prisma.auditEvent.create({
        data: {
          merchantId,
          recoveryCaseId,
          eventType: 'ACTION_EXECUTED',
          actor: 'NOTIFICATION_SERVICE',
          details: {
            channel,
            actionType: dto.actionType,
            recipient: channel === NotificationChannel.SMS ? recipientPhone : recipientEmail,
            providerMessageId,
            messageBody,
          },
        },
      });
    }

    return {
      status: 'SENT',
      providerMessageId,
      channel,
      recipient: channel === NotificationChannel.SMS ? recipientPhone : recipientEmail,
      messageBody,
      dispatchedAt: new Date().toISOString(),
    };
  }

  async getNotificationLogs(merchantId: string) {
    return this.prisma.auditEvent.findMany({
      where: {
        merchantId,
        eventType: 'ACTION_EXECUTED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
