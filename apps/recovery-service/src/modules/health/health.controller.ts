import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'recovery-service',
      timestamp: new Date().toISOString(),
    };
  }
}
