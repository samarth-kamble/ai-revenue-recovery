import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum OutreachActionType {
  SEND_SMS_REMINDER = 'SEND_SMS_REMINDER',
  SEND_EMAIL_LINK = 'SEND_EMAIL_LINK',
  PAYMENT_SUCCESS_RECEIPT = 'PAYMENT_SUCCESS_RECEIPT',
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsString()
  @IsOptional()
  recoveryCaseId?: string;

  @IsString()
  @IsOptional()
  merchantId?: string;

  @IsEnum(OutreachActionType)
  actionType!: OutreachActionType;

  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  customMessage?: string;
}
