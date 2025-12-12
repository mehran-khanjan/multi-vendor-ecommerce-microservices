// test/unit/notifications/notifications.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateNotificationDto } from '@modules/notifications/dto';
import { RecipientType, NotificationType, NotificationPriority } from '@common/enums';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let repository: NotificationsRepository;
    let configService: ConfigService;

    const mockNotification = {
        id: 'notif-123',
        type: NotificationType.ORDER_CREATED,
        priority: NotificationPriority.HIGH,
        recipientType: RecipientType.VENDOR,
        recipientId: 'vendor-123',
        title: 'New Order',
        message: 'You have a new order',
        status: 'pending',
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: NotificationsRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        findByRecipient: jest.fn(),
                        findPendingByRecipient: jest.fn(),
                        markAsDelivered: jest.fn(),
                        markAsDeliveredBatch: jest.fn(),
                        markAsRead: jest.fn(),
                        markAsReadBatch: jest.fn(),
                        markAllAsRead: jest.fn(),
                        getUnreadCount: jest.fn(),
                        deleteOld: jest.fn(),
                        deleteExpired: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(30),
                    },
                },
                {
                    provide: SchedulerRegistry,
                    useValue: {
                        addCronJob: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        repository = module.get<NotificationsRepository>(NotificationsRepository);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('createNotification', () => {
        const createDto: CreateNotificationDto = {
            type: NotificationType.ORDER_CREATED,
            priority: NotificationPriority.HIGH,
            recipientType: RecipientType.VENDOR,
            recipientId: 'vendor-123',
            title: 'New Order',
            message: 'You have a new order',
            actionUrl: '/orders/123',
            source: 'order-service',
        };

        it('should create notification successfully', async () => {
            jest.spyOn(repository, 'create').mockResolvedValue(mockNotification as any);

            const result = await service.createNotification(createDto);

            expect(result).toEqual(mockNotification);
            expect(repository.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('getNotifications', () => {
        it('should return paginated notifications', async () => {
            const filter = {
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'DESC' as const,
            };

            const mockResult = {
                items: [mockNotification],
                meta: {
                    totalItems: 1,
                    itemCount: 1,
                    itemsPerPage: 20,
                    totalPages: 1,
                    currentPage: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };

            jest.spyOn(repository, 'findByRecipient').mockResolvedValue(mockResult);

            const result = await service.getNotifications(
                RecipientType.VENDOR,
                'vendor-123',
                filter,
            );

            expect(result).toEqual(mockResult);
            expect(repository.findByRecipient).toHaveBeenCalledWith(
                RecipientType.VENDOR,
                'vendor-123',
                filter,
            );
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            jest.spyOn(repository, 'getUnreadCount').mockResolvedValue(5);

            const result = await service.getUnreadCount(RecipientType.VENDOR, 'vendor-123');

            expect(result).toBe(5);
            expect(repository.getUnreadCount).toHaveBeenCalledWith(
                RecipientType.VENDOR,
                'vendor-123',
            );
        });
    });

    describe('markAsReadBatch', () => {
        it('should mark notifications as read', async () => {
            const notificationIds = ['notif-1', 'notif-2', 'notif-3'];
            jest.spyOn(repository, 'markAsReadBatch').mockResolvedValue();

            await service.markAsReadBatch(notificationIds);

            expect(repository.markAsReadBatch).toHaveBeenCalledWith(notificationIds);
        });
    });

    describe('cleanupOldNotifications', () => {
        it('should delete old notifications', async () => {
            jest.spyOn(configService, 'get').mockReturnValue(30);
            jest.spyOn(repository, 'deleteOld').mockResolvedValue(10);

            await (service as any).cleanupOldNotifications();

            expect(repository.deleteOld).toHaveBeenCalledWith(30);
        });

        it('should handle cleanup errors', async () => {
            jest.spyOn(repository, 'deleteOld').mockRejectedValue(new Error('DB error'));

            // Should not throw error
            await expect((service as any).cleanupOldNotifications()).resolves.not.toThrow();
        });
    });

    describe('buildNotificationPayload', () => {
        it('should build proper notification payload', () => {
            const notification = {
                ...mockNotification,
                data: { orderId: 'order-123' },
                actionUrl: '/orders/123',
                source: 'order-service',
                correlationId: 'corr-123',
                expiresAt: new Date(Date.now() + 86400000),
            };

            const payload = service.buildNotificationPayload(notification as any);

            expect(payload.id).toBe('notif-123');
            expect(payload.type).toBe(NotificationType.ORDER_CREATED);
            expect(payload.recipientType).toBe(RecipientType.VENDOR);
            expect(payload.recipientId).toBe('vendor-123');
            expect(payload.data).toEqual({ orderId: 'order-123' });
            expect(payload.metadata.source).toBe('order-service');
            expect(payload.metadata.correlationId).toBe('corr-123');
            expect(payload.expiresAt).toBeDefined();
        });
    });
});