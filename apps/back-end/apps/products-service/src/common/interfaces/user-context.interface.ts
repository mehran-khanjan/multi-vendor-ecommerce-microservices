// src/common/interfaces/user-context.interface.ts
import { Role } from '@common/enums';

export interface UserContext {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  vendorId?: string;
  tenantId?: string;
}

export interface RequestContext {
  requestId: string;
  user: UserContext | null;
  isAuthenticated: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}
