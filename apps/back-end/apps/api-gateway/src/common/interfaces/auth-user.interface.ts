// src/common/interfaces/auth-user.interface.ts
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  vendorId?: string;
  metadata?: Record<string, any>;
  iat?: number;
  exp?: number;
}
