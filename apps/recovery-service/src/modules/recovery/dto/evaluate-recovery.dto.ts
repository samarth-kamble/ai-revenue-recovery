import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EvaluateRecoveryDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsString()
  @IsOptional()
  merchantId?: string;
}
