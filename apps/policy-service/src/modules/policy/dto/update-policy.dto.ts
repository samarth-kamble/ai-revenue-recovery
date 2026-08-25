import { IsNumber, IsOptional, Min, Max, IsArray, IsString } from 'class-validator';

export class UpdatePolicyDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxRetries?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minRecoveryProbability?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedActions?: string[];

  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @IsString()
  @IsOptional()
  quietHoursEnd?: string;
}
