import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PolicyCheckDto {
  @IsString()
  @IsNotEmpty()
  recoveryCaseId!: string;

  @IsString()
  @IsNotEmpty()
  proposedAction!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  recoveryProbability!: number;

  @IsString()
  @IsOptional()
  merchantId?: string;
}
