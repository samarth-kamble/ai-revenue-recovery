import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  merchantId: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface TenantRequest extends Request {
  user?: AuthenticatedUser;
  merchantId?: string;
  correlationId?: string;
}
