import { Controller, Get, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { EvaluateRecoveryDto } from './dto/evaluate-recovery.dto';

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('evaluate')
  async evaluateCase(
    @Headers('x-merchant-id') merchantIdHeader: string,
    @Body() dto: EvaluateRecoveryDto,
  ) {
    const merchantId = merchantIdHeader || dto.merchantId;
    return this.recoveryService.evaluateRecoveryCase({
      ...dto,
      merchantId,
    });
  }

  @Get('cases')
  async listCases(@Headers('x-merchant-id') merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.recoveryService.listRecoveryCases(merchantId);
  }

  @Get('cases/:id')
  async getCase(
    @Param('id') id: string,
    @Headers('x-merchant-id') merchantId: string,
  ) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.recoveryService.getRecoveryCaseById(id, merchantId);
  }
}
