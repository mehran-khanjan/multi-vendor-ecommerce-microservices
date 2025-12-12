// src/modules/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationFilterDto, MarkReadDto } from './dto';
import { Notification } from './entities/notification.entity';
import { PaginatedResult } from '@common/dto';
import { RecipientType } from '@common/enums';

// Simple auth guard placeholder - integrate with your auth system
// @UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query() filter: NotificationFilterDto,
    @Req() req: any,
  ): Promise<PaginatedResult<Notification>> {
    // Get user from request (set by auth middleware)
    const user = req.user;
    const recipientType =
      user.role === 'vendor' ? RecipientType.VENDOR : RecipientType.CUSTOMER;
    const recipientId = user.role === 'vendor' ? user.vendorId : user.id;

    return this.notificationsService.getNotifications(
      recipientType,
      recipientId,
      filter,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any): Promise<{ count: number }> {
    const user = req.user;
    const recipientType =
      user.role === 'vendor' ? RecipientType.VENDOR : RecipientType.CUSTOMER;
    const recipientId = user.role === 'vendor' ? user.vendorId : user.id;

    const count = await this.notificationsService.getUnreadCount(
      recipientType,
      recipientId,
    );
    return { count };
  }

  @Get(':id')
  async getNotification(@Param('id') id: string): Promise<Notification> {
    return this.notificationsService.getNotification(id);
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Body() dto: MarkReadDto): Promise<{ success: boolean }> {
    await this.notificationsService.markAsReadBatch(dto.notificationIds);
    return { success: true };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any): Promise<{ count: number }> {
    const user = req.user;
    const recipientType =
      user.role === 'vendor' ? RecipientType.VENDOR : RecipientType.CUSTOMER;
    const recipientId = user.role === 'vendor' ? user.vendorId : user.id;

    const count = await this.notificationsService.markAllAsRead(
      recipientType,
      recipientId,
    );
    return { count };
  }
}
