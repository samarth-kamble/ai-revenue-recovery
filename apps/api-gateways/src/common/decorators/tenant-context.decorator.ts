import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantRequest } from '../interfaces/tenant-request.interface';

export const TenantContext = createParamDecorator(
  (data: keyof TenantRequest | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();

    const merchantId = request.merchantId ?? request.user?.merchantId;

    if (!merchantId) {
      throw new UnauthorizedException('Missing merchant isolation context');
    }

    if (data === 'merchantId') {
      return merchantId;
    }

    if (data && data in request) {
      return request[data];
    }

    return {
      merchantId,
      user: request.user,
      correlationId: request.correlationId,
    };
  },
);
