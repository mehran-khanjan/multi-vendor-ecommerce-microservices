// test/unit/consumers/order.consumer.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrderConsumer } from '@modules/consumers/order.consumer';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RedisService } from '@modules/redis/redis.service';
import { VendorGateway } from '@modules/gateways/vendor.gateway';
import { CustomerGateway } from '@modules/gateways/customer.gateway';
import { AdminGateway } from '@modules/gateways/admin.gateway';
import { RabbitMQMessage } from '@common/interfaces';
import { NotificationType, RecipientType } from '@common/enums';

describe('OrderConsumer', () => {
    let consumer: OrderConsumer;
    let rabbitMQService: RabbitMQService;
    let notificationsService: NotificationsService;
    let vendorGateway: VendorGateway;
    let customerGateway: CustomerGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderConsumer,
                {
                    provide: RabbitMQService,
                    useValue: {
                        consume: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        createNotification: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        exists: jest.fn(),
                        set: jest.fn(),
                    },
                },
                {
                    provide: VendorGateway,
                    useValue: {
                        notifyNewOrder: jest.fn(),
                        notifyOrderCancelled: jest.fn(),
                    },
                },
                {
                    provide: CustomerGateway,
                    useValue: {
                        notifyOrderConfirmed: jest.fn(),
                        notifyOrderCancelled: jest.fn(),
                    },
                },
                {
                    provide: AdminGateway,
                    useValue: {
                        notifyHighValueOrder: jest.fn(),
                    },
                },
            ],
        }).compile();

        consumer = module.get<OrderConsumer>(OrderConsumer);
        rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
        notificationsService = module.get<NotificationsService>(NotificationsService);
        vendorGateway = module.get<VendorGateway>(VendorGateway);
        customerGateway = module.get<CustomerGateway>(CustomerGateway);
    });

    describe('processMessage - ORDER_CREATED', () => {
        const orderCreatedMessage: RabbitMQMessage = {
            id: 'msg-123',
            type: 'ORDER_CREATED',
            timestamp: new Date().toISOString(),
            payload: {
                orderId: 'order-123',
                orderNumber: 'ORD-001',
                vendorId: 'vendor-123',
                customerId: 'customer-123',
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-123',
                        productName: 'Test Product',
                        quantity: 2,
                        unitPrice: 49.99,
                        totalPrice: 99.98,
                    },
                ],
                subtotal: 99.98,
                totalAmount: 115.96,
                currency: 'USD',
                shippingAddress: {
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                },
                createdAt: new Date().toISOString(),
            },
            metadata: {
                source: 'order-service',
                version: '1.0',
                correlationId: 'corr-123',
            },
        };

        it('should process order created message', async () => {
            await (consumer as any).processMessage(orderCreatedMessage);

            expect(notificationsService.createNotification).toHaveBeenCalledTimes(2);
            expect(notificationsService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationType.ORDER_CREATED,
                    recipientType: RecipientType.VENDOR,
                    recipientId: 'vendor-123',
                }),
            );
            expect(notificationsService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationType.ORDER_CONFIRMED,
                    recipientType: RecipientType.CUSTOMER,
                    recipientId: 'customer-123',
                }),
            );
            expect(vendorGateway.notifyNewOrder).toHaveBeenCalledWith(
                'vendor-123',
                orderCreatedMessage.payload,
            );
            expect(customerGateway.notifyOrderConfirmed).toHaveBeenCalledWith(
                'customer-123',
                expect.any(Object),
            );
        });

        it('should notify admin for high-value orders', async () => {
            const highValueMessage = {
                ...orderCreatedMessage,
                payload: {
                    ...orderCreatedMessage.payload,
                    totalAmount: 600, // > $500 threshold
                },
            };

            await (consumer as any).processMessage(highValueMessage);

            expect(vendorGateway.notifyNewOrder).toHaveBeenCalled();
            expect(customerGateway.notifyOrderConfirmed).toHaveBeenCalled();
        });
    });

    describe('processMessage - ORDER_CANCELLED', () => {
        const orderCancelledMessage: RabbitMQMessage = {
            id: 'msg-124',
            type: 'ORDER_CANCELLED',
            timestamp: new Date().toISOString(),
            payload: {
                orderId: 'order-123',
                orderNumber: 'ORD-001',
                vendorId: 'vendor-123',
                customerId: 'customer-123',
                reason: 'Customer request',
                refundStatus: 'processing',
            },
            metadata: {
                source: 'order-service',
                version: '1.0',
                correlationId: 'corr-124',
            },
        };

        it('should process order cancelled message', async () => {
            await (consumer as any).processMessage(orderCancelledMessage);

            expect(notificationsService.createNotification).toHaveBeenCalledTimes(2);
            expect(vendorGateway.notifyOrderCancelled).toHaveBeenCalledWith(
                'vendor-123',
                expect.objectContaining({
                    orderId: 'order-123',
                    reason: 'Customer request',
                }),
            );
            expect(customerGateway.notifyOrderCancelled).toHaveBeenCalledWith(
                'customer-123',
                expect.objectContaining({
                    orderId: 'order-123',
                    refundStatus: 'processing',
                }),
            );
        });
    });

    describe('startConsuming', () => {
        it('should start consuming from queue', async () => {
            const mockCallback = jest.fn();
            jest.spyOn(rabbitMQService, 'consume').mockImplementation(async (queue, callback) => {
                // Simulate message processing
                const ack = jest.fn();
                const nack = jest.fn();
                await callback({ id: 'test-msg' }, ack, nack);
            });

            await consumer.onModuleInit();

            expect(rabbitMQService.consume).toHaveBeenCalledWith(
                'notifications.vendor.orders',
                expect.any(Function),
            );
        });
    });
});