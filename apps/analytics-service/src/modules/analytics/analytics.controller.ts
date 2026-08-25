import { Controller, Get, Headers, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Headers('x-merchant-id') merchantIdHeader: string) {
    const merchantId = merchantIdHeader || 'merch_demo_rzp';
    return this.analyticsService.getOverview(merchantId);
  }

  @Get('breakdown')
  async getBreakdown(@Headers('x-merchant-id') merchantIdHeader: string) {
    const merchantId = merchantIdHeader || 'merch_demo_rzp';
    return this.analyticsService.getFailureBreakdown(merchantId);
  }

  @Get('trends')
  async getTrends(@Headers('x-merchant-id') merchantIdHeader: string) {
    const merchantId = merchantIdHeader || 'merch_demo_rzp';
    return this.analyticsService.getRecoveryTrends(merchantId);
  }
}
