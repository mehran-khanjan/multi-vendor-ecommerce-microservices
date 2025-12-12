// src/common/interfaces/user-context.interface.ts
export interface Permission {
  action: string;
  subject: string;
  conditions?: Record<string, any>;
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
  vendorId?: string;
  permissions: Permission[];
  firstName?: string;
  lastName?: string;
}
