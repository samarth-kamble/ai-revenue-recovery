import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { RecoveryWorkerService } from './recovery-worker.service';
import { EvaluateRecoveryDto } from './dto/evaluate-recovery.dto';

@Controller('recovery')
export class RecoveryController {
  constructor(
    private readonly recoveryService: RecoveryService,
    private readonly recoveryWorkerService: RecoveryWorkerService,
  ) {}

  @Post('evaluate')
  async evaluateCase(@Body() dto: EvaluateRecoveryDto) {
    return this.recoveryService.evaluateRecoveryCase(dto);
  }

  @Post('execute-pending')
  async executePendingActions(@Headers('x-merchant-id') merchantIdHeader?: string) {
    return this.recoveryWorkerService.executePendingActions(merchantIdHeader);
  }

  @Get('cases')
  async getCases(@Headers('x-merchant-id') merchantIdHeader?: string) {
    const merchantId = merchantIdHeader || 'merch_demo_rzp';
    return this.recoveryService.listRecoveryCases(merchantId);
  }

  @Get('cases/:id')
  async getCaseById(
    @Param('id') id: string,
    @Headers('x-merchant-id') merchantIdHeader?: string,
  ) {
    const merchantId = merchantIdHeader || 'merch_demo_rzp';
    return this.recoveryService.getRecoveryCaseById(id, merchantId);
  }
}
