// src/common/utils/room.utils.ts
export class RoomUtils {
  // Vendor rooms
  static vendorRoom(vendorId: string): string {
    return `vendor:${vendorId}`;
  }

  static vendorOrdersRoom(vendorId: string): string {
    return `vendor:${vendorId}:orders`;
  }

  static vendorInventoryRoom(vendorId: string): string {
    return `vendor:${vendorId}:inventory`;
  }

  static vendorAnalyticsRoom(vendorId: string): string {
    return `vendor:${vendorId}:analytics`;
  }

  // Customer rooms
  static customerRoom(customerId: string): string {
    return `customer:${customerId}`;
  }

  static customerOrdersRoom(customerId: string): string {
    return `customer:${customerId}:orders`;
  }

  // Admin rooms
  static adminRoom(): string {
    return 'admin:all';
  }

  static adminOrdersRoom(): string {
    return 'admin:orders';
  }

  static adminVendorsRoom(): string {
    return 'admin:vendors';
  }

  static adminSystemRoom(): string {
    return 'admin:system';
  }

  // Parse room to get info
  static parseRoom(room: string): {
    type: string;
    id?: string;
    channel?: string;
  } {
    const parts = room.split(':');
    return {
      type: parts[0],
      id: parts[1],
      channel: parts[2],
    };
  }

  // Validate room access
  static canJoinRoom(
    room: string,
    userRole: string,
    userId: string,
    vendorId?: string,
  ): boolean {
    const parsed = this.parseRoom(room);

    switch (parsed.type) {
      case 'vendor':
        return (
          userRole === 'admin' ||
          (userRole === 'vendor' && vendorId === parsed.id)
        );
      case 'customer':
        return (
          userRole === 'admin' ||
          (userRole === 'customer' && userId === parsed.id)
        );
      case 'admin':
        return userRole === 'admin';
      default:
        return false;
    }
  }
}
