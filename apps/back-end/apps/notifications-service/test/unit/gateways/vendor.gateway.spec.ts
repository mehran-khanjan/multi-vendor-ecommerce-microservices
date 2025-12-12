// test/unit/gateways/vendor.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { VendorGateway } from '@modules/gateways/vendor.gateway';
import { AuthGrpcClient } from '@grpc/clients';
import { ConnectionManagerService } from '@modules/gateways/connection-manager.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { SocketWithAuth } from '@common/interfaces';
import { RecipientType } from '@common/enums';

describe('VendorGateway', () => {
    let gateway: VendorGateway;
    let authGrpcClient: AuthGrpcClient;
    let connectionManager: ConnectionManagerService;
    let notificationsService: NotificationsService;

    const mockSocket: Partial<SocketWithAuth> = {
        id: 'socket-123',
        handshake: {
            headers: {},
            auth: {},
            address: '127.0.0.1',
        },
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
    };

    const mockUser = {
        id: 'user-123',
        email: 'vendor@example.com',
        role: 'vendor',
        vendorId: 'vendor-123',
        permissions: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VendorGateway,
                {
                    provide: AuthGrpcClient,
                    useValue: {
                        validateToken: jest.fn(),
                    },
                },
                {
                    provide: ConnectionManagerService,
                    useValue: {
                        registerConnection: jest.fn(),
                        unregisterConnection: jest.fn(),
                        joinRoom: jest.fn(),
                        leaveRoom: jest.fn(),
                        updateActivity: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        getPendingNotifications: jest.fn(),
                        markAsDeliveredBatch: jest.fn(),
                        buildNotificationPayload: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<VendorGateway>(VendorGateway);
        authGrpcClient = module.get<AuthGrpcClient>(AuthGrpcClient);
        connectionManager = module.get<ConnectionManagerService>(ConnectionManagerService);
        notificationsService = module.get<NotificationsService>(NotificationsService);
    });

    describe('handleConnection', () => {
        it('should accept valid vendor connection', async () => {
            jest.spyOn(authGrpcClient, 'validateToken').mockResolvedValue({
                valid: true,
                user: mockUser,
            });
            jest.spyOn(connectionManager, 'registerConnection').mockResolvedValue('conn-123');
            jest.spyOn(connectionManager, 'joinRoom').mockResolvedValue(true);

            const socket = { ...mockSocket } as SocketWithAuth;
            socket.handshake.auth = { token: 'valid-token' };

            await gateway.handleConnection(socket);

            expect(authGrpcClient.validateToken).toHaveBeenCalledWith('valid-token');
            expect(connectionManager.registerConnection).toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
        });

        it('should reject invalid token', async () => {
            jest.spyOn(authGrpcClient, 'validateToken').mockResolvedValue({
                valid: false,
                error: 'Invalid token',
            });

            const socket = { ...mockSocket } as SocketWithAuth;
            socket.handshake.auth = { token: 'invalid-token' };

            await gateway.handleConnection(socket);

            expect(socket.emit).toHaveBeenCalledWith('error', expect.any(Object));
            expect(socket.disconnect).toHaveBeenCalledWith(true);
        });

        it('should reject non-vendor user', async () => {
            jest.spyOn(authGrpcClient, 'validateToken').mockResolvedValue({
                valid: true,
                user: {
                    ...mockUser,
                    role: 'customer',
                },
            });

            const socket = { ...mockSocket } as SocketWithAuth;
            socket.handshake.auth = { token: 'customer-token' };

            await gateway.handleConnection(socket);

            expect(socket.emit).toHaveBeenCalledWith(
                'error',
                expect.objectContaining({ code: 'ACCESS_DENIED' }),
            );
        });
    });

    describe('handleDisconnect', () => {
        it('should cleanup connection', async () => {
            const socket = {
                ...mockSocket,
                user: mockUser,
            } as SocketWithAuth;

            await gateway.handleDisconnect(socket);

            expect(connectionManager.leaveAllRooms).toHaveBeenCalledWith(socket);
            expect(connectionManager.unregisterConnection).toHaveBeenCalledWith(socket);
        });
    });

    describe('notifyNewOrder', () => {
        it('should send new order notification to vendor', async () => {
            const serverMock = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            };

            (gateway as any).server = serverMock;

            const payload = {
                orderId: 'order-123',
                orderNumber: 'ORD-001',
                vendorId: 'vendor-123',
                items: [],
                totalAmount: 99.99,
            };

            await gateway.notifyNewOrder('vendor-123', payload as any);

            expect(serverMock.to).toHaveBeenCalledWith('vendor:vendor-123:orders');
            expect(serverMock.emit).toHaveBeenCalledWith('new-order', expect.any(Object));
        });
    });

    describe('notifyLowStock', () => {
        it('should send low stock alert to vendor', async () => {
            const serverMock = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            };

            (gateway as any).server = serverMock;

            const payload = {
                productId: 'product-123',
                productName: 'Test Product',
                currentStock: 3,
                threshold: 5,
            };

            await gateway.notifyLowStock('vendor-123', payload);

            expect(serverMock.to).toHaveBeenCalledWith('vendor:vendor-123:inventory');
            expect(serverMock.emit).toHaveBeenCalledWith('low-stock', expect.any(Object));
        });
    });
});