// test/unit/orders/orders.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '@modules/orders/orders.service';
import { OrdersRepository } from '@modules/orders/orders.repository';
import { CartService } from '@modules/cart/cart.service';
import { PaymentsService } from '@modules/payments/payments.service';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { AuthGrpcClient, ProductGrpcClient } from '@grpc/clients';
import { ConfigService } from '@nestjs/config';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, OrderPaymentStatus } from '@modules/orders/enums';
import { CreateOrderInput } from '@modules/orders/dto';
import { PaymentStatus, PaymentMethod } from '@modules/payments/entities/payment.entity';

describe('OrdersService', () => {
    let service: OrdersService;
    let ordersRepository: OrdersRepository;
    let cartService: CartService;
    let paymentsService: PaymentsService;
    let authService: AuthorizationService;
    let authGrpcClient: AuthGrpcClient;
    let productGrpcClient: ProductGrpcClient;
    let configService: ConfigService;

    const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
    };

    const mockCart = {
        id: 'cart-123',
        customerId: 'user-123',
        items: [
            {
                id: 'item-1',
                vendorProductId: 'vp-123',
                vendorVariantId: 'vv-123',
                productId: 'product-123',
                productName: 'Test Product',
                quantity: 2,
                unitPrice: 49.99,
                vendorId: 'vendor-123',
            },
        ],
        subtotal: 99.98,
        currency: 'USD',
    };

    const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        customerId: 'user-123',
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PENDING,
        subtotal: 99.98,
        taxAmount: 9.99,
        shippingAmount: 5.99,
        discountAmount: 0,
        totalAmount: 115.96,
        items: mockCart.items.map((item) => ({
            ...item,
            totalPrice: item.unitPrice * item.quantity,
            status: 'pending',
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: OrdersRepository,
                    useValue: {
                        findById: jest.fn(),
                        findByOrderNumber: jest.fn(),
                        findByCustomerId: jest.fn(),
                        findByVendorId: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        addStatusHistory: jest.fn(),
                        generateOrderNumber: jest.fn(),
                        getOrderStats: jest.fn(),
                    },
                },
                {
                    provide: CartService,
                    useValue: {
                        validateCartForCheckout: jest.fn(),
                        markCartAsConverted: jest.fn(),
                    },
                },
                {
                    provide: PaymentsService,
                    useValue: {
                        getCardById: jest.fn(),
                        processPayment: jest.fn(),
                        processRefund: jest.fn(),
                    },
                },
                {
                    provide: AuthorizationService,
                    useValue: {
                        canAccessUserData: jest.fn(),
                        canAccessVendorData: jest.fn(),
                        isAdmin: jest.fn(),
                    },
                },
                {
                    provide: AuthGrpcClient,
                    useValue: {
                        getUserAddress: jest.fn(),
                    },
                },
                {
                    provide: ProductGrpcClient,
                    useValue: {
                        checkStock: jest.fn(),
                        reserveStock: jest.fn(),
                        releaseStock: jest.fn(),
                        confirmStockDeduction: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        ordersRepository = module.get<OrdersRepository>(OrdersRepository);
        cartService = module.get<CartService>(CartService);
        paymentsService = module.get<PaymentsService>(PaymentsService);
        authService = module.get<AuthorizationService>(AuthorizationService);
        authGrpcClient = module.get<AuthGrpcClient>(AuthGrpcClient);
        productGrpcClient = module.get<ProductGrpcClient>(ProductGrpcClient);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('createOrder', () => {
        const createInput: CreateOrderInput = {
            shippingAddressId: 'addr-123',
            paymentCardId: 'card-123',
        };

        beforeEach(() => {
            jest.spyOn(configService, 'get').mockImplementation((key: string) => {
                if (key === 'order.orderNumberPrefix') return 'ORD';
                if (key === 'order.stockReservationTtl') return 900;
                return null;
            });

            jest.spyOn(cartService, 'validateCartForCheckout').mockResolvedValue({
                valid: true,
                cart: mockCart,
                issues: [],
            });

            jest.spyOn(authGrpcClient, 'getUserAddress').mockResolvedValue({
                success: true,
                address: {
                    id: 'addr-123',
                    fullName: 'John Doe',
                    phone: '+1234567890',
                    addressLine1: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'USA',
                },
            });

            jest.spyOn(paymentsService, 'getCardById').mockResolvedValue({
                id: 'card-123',
                isExpired: false,
            } as any);

            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: true,
                results: [{ isAvailable: true }],
            });

            jest.spyOn(productGrpcClient, 'reserveStock').mockResolvedValue({
                success: true,
                reservationId: 'res-123',
            });

            jest.spyOn(ordersRepository, 'generateOrderNumber').mockResolvedValue('ORD-2024-001');

            jest.spyOn(ordersRepository, 'create').mockResolvedValue(mockOrder as any);
        });

        it('should create order successfully', async () => {
            jest.spyOn(paymentsService, 'processPayment').mockResolvedValue({
                id: 'payment-123',
                status: PaymentStatus.COMPLETED,
            } as any);

            jest.spyOn(productGrpcClient, 'confirmStockDeduction').mockResolvedValue({
                success: true,
            });

            const result = await service.createOrder(createInput, mockUser);

            expect(result).toEqual(mockOrder);
            expect(cartService.validateCartForCheckout).toHaveBeenCalledWith(mockUser);
            expect(productGrpcClient.reserveStock).toHaveBeenCalled();
            expect(paymentsService.processPayment).toHaveBeenCalled();
            expect(cartService.markCartAsConverted).toHaveBeenCalledWith(mockCart.id);
        });

        it('should handle payment failure', async () => {
            jest.spyOn(paymentsService, 'processPayment').mockResolvedValue({
                id: 'payment-123',
                status: PaymentStatus.FAILED,
                failureReason: 'Insufficient funds',
            } as any);

            jest.spyOn(productGrpcClient, 'releaseStock').mockResolvedValue({
                success: true,
            });

            await expect(service.createOrder(createInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );

            expect(productGrpcClient.releaseStock).toHaveBeenCalled();
        });

        it('should throw error for invalid cart', async () => {
            jest.spyOn(cartService, 'validateCartForCheckout').mockResolvedValue({
                valid: false,
                cart: mockCart,
                issues: [{ itemId: 'item-1', type: 'out_of_stock', message: 'Out of stock' }],
            });

            await expect(service.createOrder(createInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error for invalid address', async () => {
            jest.spyOn(authGrpcClient, 'getUserAddress').mockResolvedValue({
                success: false,
                error: 'Address not found',
            });

            await expect(service.createOrder(createInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error for expired payment card', async () => {
            jest.spyOn(paymentsService, 'getCardById').mockResolvedValue({
                id: 'card-123',
                isExpired: true,
            } as any);

            await expect(service.createOrder(createInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('cancelOrder', () => {
        const orderId = 'order-123';
        const reason = 'Changed my mind';

        beforeEach(() => {
            jest.spyOn(service, 'getOrderById').mockResolvedValue({
                ...mockOrder,
                status: OrderStatus.CONFIRMED,
                paymentStatus: OrderPaymentStatus.PAID,
                stockReservationId: 'res-123',
            } as any);

            jest.spyOn(authService, 'canAccessUserData').mockReturnValue(true);
        });

        it('should cancel order successfully', async () => {
            jest.spyOn(productGrpcClient, 'releaseStock').mockResolvedValue({ success: true });
            jest.spyOn(paymentsService, 'processRefund').mockResolvedValue({} as any);

            const result = await service.cancelOrder(orderId, reason, mockUser);

            expect(result.status).toBe(OrderStatus.CANCELLED);
            expect(productGrpcClient.releaseStock).toHaveBeenCalledWith('res-123');
            expect(paymentsService.processRefund).toHaveBeenCalled();
        });

        it('should cancel pending order without refund', async () => {
            jest.spyOn(service, 'getOrderById').mockResolvedValue({
                ...mockOrder,
                status: OrderStatus.PENDING,
                paymentStatus: OrderPaymentStatus.PENDING,
            } as any);

            const result = await service.cancelOrder(orderId, reason, mockUser);

            expect(result.status).toBe(OrderStatus.CANCELLED);
            expect(paymentsService.processRefund).not.toHaveBeenCalled();
        });

        it('should throw error for non-cancellable status', async () => {
            jest.spyOn(service, 'getOrderById').mockResolvedValue({
                ...mockOrder,
                status: OrderStatus.SHIPPED,
            } as any);

            await expect(service.cancelOrder(orderId, reason, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error for unauthorized user', async () => {
            jest.spyOn(authService, 'canAccessUserData').mockReturnValue(false);

            await expect(service.cancelOrder(orderId, reason, mockUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('getVendorOrders', () => {
        it('should return vendor orders', async () => {
            const vendorId = 'vendor-123';
            const vendorUser = {
                ...mockUser,
                role: 'vendor',
                vendorId,
            };

            jest.spyOn(authService, 'canAccessVendorData').mockReturnValue(true);
            jest.spyOn(ordersRepository, 'findByVendorId').mockResolvedValue({
                orders: [mockOrder],
                meta: {
                    totalItems: 1,
                    itemCount: 1,
                    itemsPerPage: 20,
                    totalPages: 1,
                    currentPage: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            });

            const result = await service.getVendorOrders(vendorUser, {}, { page: 1, limit: 20 });

            expect(result.orders).toHaveLength(1);
            expect(result.orders[0].items.some((item: any) => item.vendorId === vendorId)).toBe(true);
        });

        it('should throw error for non-vendor user', async () => {
            await expect(
                service.getVendorOrders(mockUser, {}, { page: 1, limit: 20 }),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});