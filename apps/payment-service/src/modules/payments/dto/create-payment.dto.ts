import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum PaymentGatewayEnum {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  PAYTM = 'PAYTM',
  SIMULATOR = 'SIMULATOR',
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
  REFUNDED = 'REFUNDED',
}

export class CreatePaymentDto {
  @IsString()
  @IsOptional()
  merchantId?: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string = 'INR';

  @IsEnum(PaymentStatusEnum)
  @IsOptional()
  status?: PaymentStatusEnum = PaymentStatusEnum.PENDING;

  @IsEnum(PaymentGatewayEnum)
  @IsOptional()
  gateway?: PaymentGatewayEnum = PaymentGatewayEnum.RAZORPAY;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
