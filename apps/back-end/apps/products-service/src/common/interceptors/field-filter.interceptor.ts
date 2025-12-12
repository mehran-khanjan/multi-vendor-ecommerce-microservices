// src/common/interceptors/field-filter.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { Role } from '@common/enums';

/**
 * Interceptor to filter out fields based on user permissions
 * This provides field-level access control
 */
@Injectable()
export class FieldFilterInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthorizationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.context?.user;

    return next.handle().pipe(
      map((data) => {
        if (!data) return data;
        return this.filterFields(data, user);
      }),
    );
  }

  private filterFields(data: any, user: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.filterFields(item, user));
    }

    if (data && typeof data === 'object') {
      const filtered = { ...data };

      // Get restricted fields based on user role
      const restrictedFields = this.getRestrictedFields(user);

      for (const field of restrictedFields) {
        if (field in filtered) {
          delete filtered[field];
        }
      }

      // Recursively filter nested objects
      for (const key of Object.keys(filtered)) {
        if (filtered[key] && typeof filtered[key] === 'object') {
          filtered[key] = this.filterFields(filtered[key], user);
        }
      }

      return filtered;
    }

    return data;
  }

  private getRestrictedFields(user: any): string[] {
    const fields: string[] = [];

    if (!user) {
      // Guest/unauthenticated - restrict all sensitive fields
      fields.push(
        'sku',
        'costPrice',
        'stockQuantity',
        'lowStockThreshold',
        'vendorId',
      );
      return fields;
    }

    const roles = user.roles || [];

    // Customer restrictions
    if (
      roles.includes(Role.CUSTOMER) &&
      !roles.includes(Role.ADMIN) &&
      !roles.includes(Role.VENDOR)
    ) {
      fields.push('stockQuantity', 'lowStockThreshold', 'costPrice', 'sku');
    }

    // Vendor can see their own stock but not cost (unless owner)
    if (roles.includes(Role.VENDOR) && !roles.includes(Role.VENDOR_OWNER)) {
      fields.push('costPrice');
    }

    return fields;
  }
}
