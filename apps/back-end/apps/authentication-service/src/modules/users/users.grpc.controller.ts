// auth-service/src/modules/users/users.grpc.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { AddressService } from '@modules/address/address.service';

@Controller()
export class UsersGrpcController {
  private readonly logger = new Logger(UsersGrpcController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly addressService: AddressService,
  ) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(request: { token: string }) {
    try {
      const result = await this.usersService.validateToken(request.token);

      if (!result.valid) {
        return { valid: false, error: result.error };
      }

      return {
        valid: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          vendorId: result.user.vendorId,
          permissions:
            result.user.permissions?.map((p) => ({
              action: p.action,
              subject: p.subject,
              conditions: p.conditions ? JSON.stringify(p.conditions) : null,
            })) || [],
        },
      };
    } catch (error) {
      this.logger.error(`ValidateToken error: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  @GrpcMethod('AuthService', 'GetUserAddress')
  async getUserAddress(request: { userId: string; addressId: string }) {
    try {
      const address = await this.addressService.findById(
        request.addressId,
        request.userId,
      );

      if (!address) {
        return { success: false, error: 'Address not found' };
      }

      return {
        success: true,
        address: {
          id: address.id,
          userId: address.userId,
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        },
      };
    } catch (error) {
      this.logger.error(`GetUserAddress error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('AuthService', 'GetUserAddresses')
  async getUserAddresses(request: { userId: string }) {
    try {
      const addresses = await this.addressService.findByUserId(request.userId);

      return {
        success: true,
        addresses: addresses.map((address) => ({
          id: address.id,
          userId: address.userId,
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        })),
      };
    } catch (error) {
      this.logger.error(`GetUserAddresses error: ${error.message}`);
      return { success: false, addresses: [], error: error.message };
    }
  }

  @GrpcMethod('AuthService', 'GetUserById')
  async getUserById(request: { userId: string }) {
    try {
      const user = await this.usersService.findById(request.userId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          vendorId: user.vendorId,
          permissions:
            user.permissions?.map((p) => ({
              action: p.action,
              subject: p.subject,
              conditions: p.conditions ? JSON.stringify(p.conditions) : null,
            })) || [],
        },
      };
    } catch (error) {
      this.logger.error(`GetUserById error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
