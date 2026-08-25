import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';
import { TenantContext } from '../../common/decorators/tenant-context.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(TenantAuthGuard)
  @Get('me')
  getProfile(@TenantContext() context: Record<string, unknown>) {
    return {
      success: true,
      context,
    };
  }
}
