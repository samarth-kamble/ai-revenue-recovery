import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class EvaluatePolicyRequestDto {
  @IsString()
  @IsNotEmpty()
  proposedAction!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  recoveryProbability!: number;

  @IsNumber()
  @Min(1)
  currentAttemptCount!: number;

  @IsString()
  @IsOptional()
  merchantId?: string;
}
