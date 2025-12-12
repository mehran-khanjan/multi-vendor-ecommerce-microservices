// src/grpc/interfaces/auth.interface.ts
import { Observable } from 'rxjs';

export interface Permission {
  action: string;
  subject: string;
  conditions?: string;
}

export interface UserData {
  id: string;
  email: string;
  role: string;
  vendorId?: string;
  permissions: Permission[];
  firstName?: string;
  lastName?: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: UserData;
  error?: string;
}

export interface GetUserByIdRequest {
  userId: string;
}

export interface UserResponse {
  success: boolean;
  user?: UserData;
  error?: string;
}

export interface IAuthGrpcService {
  validateToken(
    request: ValidateTokenRequest,
  ): Observable<ValidateTokenResponse>;
  getUserById(request: GetUserByIdRequest): Observable<UserResponse>;
}
