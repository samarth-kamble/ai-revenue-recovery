import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum PaymentAttemptStatusEnum {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
}

export enum FailureClassificationEnum {
  TRANSIENT_NETWORK = 'TRANSIENT_NETWORK',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BANK_DOWNTIME = 'BANK_DOWNTIME',
  CARD_EXPIRED = 'CARD_EXPIRED',
  INVALID_ACCOUNT = 'INVALID_ACCOUNT',
  OTHER = 'OTHER',
}

export class RecordAttemptDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  attemptNumber?: number = 1;

  @IsString()
  @IsOptional()
  gateway?: string = 'RAZORPAY';

  @IsString()
  @IsOptional()
  gatewayTransactionId?: string;

  @IsEnum(PaymentAttemptStatusEnum)
  @IsNotEmpty()
  status!: PaymentAttemptStatusEnum;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsString()
  @IsOptional()
  rawErrorCode?: string;

  @IsEnum(FailureClassificationEnum)
  @IsOptional()
  errorClassification?: FailureClassificationEnum;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsOptional()
  rawResponse?: Record<string, unknown>;
}
