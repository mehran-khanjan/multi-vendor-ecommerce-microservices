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
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: UserData;
  error?: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface GetUserAddressRequest {
  userId: string;
  addressId: string;
}

export interface GetUserAddressResponse {
  success: boolean;
  address?: Address;
  error?: string;
}

export interface GetUserAddressesRequest {
  userId: string;
}

export interface GetUserAddressesResponse {
  success: boolean;
  addresses: Address[];
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
  getUserAddress(
    request: GetUserAddressRequest,
  ): Observable<GetUserAddressResponse>;
  getUserAddresses(
    request: GetUserAddressesRequest,
  ): Observable<GetUserAddressesResponse>;
  getUserById(request: GetUserByIdRequest): Observable<UserResponse>;
}
