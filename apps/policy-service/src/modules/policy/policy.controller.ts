import { Controller, Get, Put, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { EvaluatePolicyRequestDto } from './dto/evaluate-policy-request.dto';

@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  async getPolicy(@Headers('x-merchant-id') merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.policyService.getMerchantPolicy(merchantId);
  }

  @Put()
  async updatePolicy(
    @Headers('x-merchant-id') merchantId: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.policyService.updateMerchantPolicy(merchantId, dto);
  }

  @Post('evaluate')
  async evaluatePolicy(
    @Headers('x-merchant-id') merchantIdHeader: string,
    @Body() dto: EvaluatePolicyRequestDto,
  ) {
    const merchantId = merchantIdHeader || dto.merchantId || 'merch_demo_rzp';
    return this.policyService.evaluatePolicy(merchantId, dto);
  }
}
