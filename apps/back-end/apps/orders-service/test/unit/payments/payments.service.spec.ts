// test/unit/payments/payments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '@modules/payments/payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCard } from '@modules/payments/entities/payment-card.entity';
import { Payment } from '@modules/payments/entities/payment.entity';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentCardInput, ProcessPaymentInput } from '@modules/payments/dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentStatus, PaymentMethod } from '@modules/payments/entities/payment.entity';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let paymentCardRepo: Repository<PaymentCard>;
    let paymentRepo: Repository<Payment>;
    let authService: AuthorizationService;
    let configService: ConfigService;

    const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: getRepositoryToken(PaymentCard),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(Payment),
                    useClass: Repository,
                },
                {
                    provide: AuthorizationService,
                    useValue: {
                        canAccessUserData: jest.fn(),
                        isAdmin: jest.fn(),
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

        service = module.get<PaymentsService>(PaymentsService);
        paymentCardRepo = module.get<Repository<PaymentCard>>(getRepositoryToken(PaymentCard));
        paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
        authService = module.get<AuthorizationService>(AuthorizationService);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('addPaymentCard', () => {
        const createInput: CreatePaymentCardInput = {
            cardHolderName: 'John Doe',
            cardNumber: '4111111111111111',
            expiryMonth: '12',
            expiryYear: '2028',
            cvv: '123',
            isDefault: false,
        };

        it('should add valid payment card', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('test-encryption-key');
            jest.spyOn(paymentCardRepo, 'count').mockResolvedValue(0);
            jest.spyOn(paymentCardRepo, 'create').mockImplementation((data) => data as any);
            jest.spyOn(paymentCardRepo, 'save').mockImplementation((data) => Promise.resolve(data as any));

            const result = await service.addPaymentCard(createInput, mockUser);

            expect(result.customerId).toBe(mockUser.id);
            expect(result.lastFourDigits).toBe('1111');
            expect(result.isDefault).toBe(true); // First card should be default
            expect(result.encryptedToken).toBeDefined();
        });

        it('should throw error for invalid card number', async () => {
            const invalidInput = {
                ...createInput,
                cardNumber: '1234567890123456', // Invalid Luhn number
            };

            await expect(service.addPaymentCard(invalidInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error for expired card', async () => {
            const expiredInput = {
                ...createInput,
                expiryMonth: '01',
                expiryYear: '2020',
            };

            await expect(service.addPaymentCard(expiredInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should set new card as default and unset others', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('test-encryption-key');
            jest.spyOn(paymentCardRepo, 'count').mockResolvedValue(2);
            jest.spyOn(paymentCardRepo, 'update').mockResolvedValue({} as any);

            const result = await service.addPaymentCard(
                { ...createInput, isDefault: true },
                mockUser,
            );

            expect(paymentCardRepo.update).toHaveBeenCalledWith(
                { customerId: mockUser.id, isDefault: true },
                { isDefault: false },
            );
        });
    });

    describe('processPayment', () => {
        const processInput: ProcessPaymentInput = {
            orderId: 'order-123',
            paymentCardId: 'card-123',
            amount: 100.0,
            currency: 'USD',
            method: PaymentMethod.CARD,
        };

        beforeEach(() => {
            jest.spyOn(service as any, 'getCardById').mockResolvedValue({
                id: 'card-123',
                isExpired: false,
            });
        });

        it('should process successful payment', async () => {
            jest.spyOn(paymentRepo, 'create').mockImplementation((data) => data as any);
            jest.spyOn(paymentRepo, 'save').mockImplementation((data) => Promise.resolve(data as any));

            const result = await service.processPayment(processInput, mockUser);

            expect(result.status).toBe(PaymentStatus.PROCESSING);
            expect(result.customerId).toBe(mockUser.id);
            expect(result.orderId).toBe('order-123');
        });

        it('should throw error for expired card', async () => {
            jest.spyOn(service as any, 'getCardById').mockResolvedValue({
                id: 'card-123',
                isExpired: true,
            });

            await expect(service.processPayment(processInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('processRefund', () => {
        it('should process refund successfully', async () => {
            const payment = {
                id: 'payment-123',
                customerId: mockUser.id,
                amount: 100.0,
                status: PaymentStatus.COMPLETED,
                refundedAmount: 0,
            };

            jest.spyOn(paymentRepo, 'findOne').mockResolvedValue(payment as any);
            jest.spyOn(authService, 'isAdmin').mockReturnValue(true);
            jest.spyOn(paymentRepo, 'save').mockImplementation((data) => Promise.resolve(data as any));

            const result = await service.processRefund('payment-123', 50.0, 'Customer request', mockUser);

            expect(result.refundedAmount).toBe(50.0);
            expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
        });

        it('should throw error for non-admin unauthorized user', async () => {
            const payment = {
                id: 'payment-123',
                customerId: 'other-user',
                amount: 100.0,
                status: PaymentStatus.COMPLETED,
            };

            jest.spyOn(paymentRepo, 'findOne').mockResolvedValue(payment as any);
            jest.spyOn(authService, 'isAdmin').mockReturnValue(false);
            jest.spyOn(authService, 'canAccessUserData').mockReturnValue(false);

            await expect(
                service.processRefund('payment-123', 50.0, 'Customer request', mockUser),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw error for invalid payment status', async () => {
            const payment = {
                id: 'payment-123',
                customerId: mockUser.id,
                amount: 100.0,
                status: PaymentStatus.PENDING,
            };

            jest.spyOn(paymentRepo, 'findOne').mockResolvedValue(payment as any);
            jest.spyOn(authService, 'isAdmin').mockReturnValue(true);

            await expect(
                service.processRefund('payment-123', 50.0, 'Customer request', mockUser),
            ).rejects.toThrow(BadRequestException);
        });
    });
});