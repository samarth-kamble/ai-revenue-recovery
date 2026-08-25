import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'api-gateways',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
