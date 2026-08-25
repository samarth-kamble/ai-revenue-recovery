import { Controller, Get, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RecordAttemptDto } from './dto/record-attempt.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async createPayment(
    @Headers('x-merchant-id') merchantIdHeader: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const merchantId = merchantIdHeader || dto.merchantId;
    if (!merchantId) {
      throw new BadRequestException('Merchant ID is required (via x-merchant-id header or request body).');
    }
    return this.paymentsService.createPayment({
      ...dto,
      merchantId,
    });
  }

  @Post('attempts')
  async recordAttempt(@Body() dto: RecordAttemptDto) {
    return this.paymentsService.recordAttempt(dto);
  }

  @Get()
  async getPayments(@Headers('x-merchant-id') merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.paymentsService.getPaymentsByMerchant(merchantId);
  }

  @Get(':id')
  async getPayment(
    @Param('id') id: string,
    @Headers('x-merchant-id') merchantId: string,
  ) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.paymentsService.getPaymentById(id, merchantId);
  }
}
