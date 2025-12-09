// src/auth/dto/token-payload.dto.ts
export interface TokenPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  roles: string[];
  permissions: string[];
  tenant_id?: string;
  vendor_id?: string;
  metadata?: Record<string, any>;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
