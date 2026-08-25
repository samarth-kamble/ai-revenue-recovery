import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantRequest } from '../interfaces/tenant-request.interface';

@Injectable()
export class TenantAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'] as string;
    const merchantIdHeader = request.headers['x-merchant-id'] as string;

    request.correlationId =
      (request.headers['x-correlation-id'] as string) ||
      `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (authHeader?.startsWith('Bearer ')) {
      // In production: decode and verify JWT token
      request.user = {
        userId: 'usr_demo_123',
        merchantId: merchantIdHeader || 'merch_demo_rzp',
        email: 'merchant@example.com',
        role: 'ADMIN',
      };
      request.merchantId = request.user.merchantId;
      return true;
    }

    if (apiKeyHeader) {
      request.merchantId = merchantIdHeader || 'merch_demo_rzp';
      return true;
    }

    if (process.env.NODE_ENV !== 'production' && merchantIdHeader) {
      request.merchantId = merchantIdHeader;
      return true;
    }

    throw new UnauthorizedException(
      'Authentication required: Provide a valid Bearer token or X-API-Key header.',
    );
  }
}
