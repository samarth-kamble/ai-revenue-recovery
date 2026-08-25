import { Controller, Post, Get, Body, Headers, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(
    @Headers('x-merchant-id') merchantIdHeader: string,
    @Body() dto: SendNotificationDto,
  ) {
    const merchantId = merchantIdHeader || dto.merchantId;
    return this.notificationsService.sendOutreachNotification({
      ...dto,
      merchantId,
    });
  }

  @Get('logs')
  async getLogs(@Headers('x-merchant-id') merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException('x-merchant-id header is required.');
    }
    return this.notificationsService.getNotificationLogs(merchantId);
  }
}
