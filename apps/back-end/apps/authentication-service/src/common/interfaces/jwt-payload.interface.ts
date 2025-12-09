// src/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  vendorId?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
