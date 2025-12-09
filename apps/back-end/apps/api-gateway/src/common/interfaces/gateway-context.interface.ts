// src/common/interfaces/gateway-context.interface.ts
import { Request, Response } from 'express';
import { AuthUser } from './auth-user.interface';
import { OriginDomain } from '@common/enums';

export interface GatewayContext {
  req: Request;
  res: Response;
  requestId: string;
  correlationId: string;
  startTime: number;
  originDomain: OriginDomain;
  user: AuthUser | null;
  isAuthenticated: boolean;
  clientIp: string;
  userAgent: string;
}
