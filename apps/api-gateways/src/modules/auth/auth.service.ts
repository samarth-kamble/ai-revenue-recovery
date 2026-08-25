import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.merchantId) {
      throw new UnauthorizedException('Invalid login parameters');
    }

    const mockAccessToken = `jwt_session_${Date.now()}_${Buffer.from(loginDto.merchantId).toString('base64')}`;

    return {
      accessToken: mockAccessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        userId: 'usr_demo_123',
        merchantId: loginDto.merchantId,
        email: loginDto.email,
        role: 'ADMIN',
      },
    };
  }

  verifyApiKey(apiKey: string, merchantId: string) {
    if (!apiKey || !merchantId) {
      return { valid: false };
    }
    return {
      valid: true,
      merchantId,
      permissions: ['read:recovery_cases', 'write:recovery_actions'],
    };
  }
}
