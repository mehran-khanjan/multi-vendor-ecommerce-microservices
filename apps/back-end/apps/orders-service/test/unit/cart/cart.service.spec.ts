// test/unit/cart/cart.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '@modules/cart/cart.service';
import { CartRepository } from '@modules/cart/cart.repository';
import { ProductGrpcClient } from '@grpc/clients';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { AddToCartInput } from '@modules/cart/dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartService', () => {
    let service: CartService;
    let cartRepository: CartRepository;
    let productGrpcClient: ProductGrpcClient;
    let authService: AuthorizationService;

    const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
    };

    const mockProduct = {
        success: true,
        product: {
            id: 'product-123',
            name: 'Test Product',
            slug: 'test-product',
            isPublished: true,
            status: 'active',
            variants: [],
            vendorProducts: [
                {
                    id: 'vp-123',
                    vendorId: 'vendor-123',
                    price: 49.99,
                    isPublished: true,
                    status: 'active',
                    vendorVariants: [],
                },
            ],
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                {
                    provide: CartRepository,
                    useValue: {
                        findActiveByCustomerId: jest.fn(),
                        findById: jest.fn(),
                        createCart: jest.fn(),
                        findCartItem: jest.fn(),
                        findCartItemById: jest.fn(),
                        addItem: jest.fn(),
                        updateItem: jest.fn(),
                        removeItem: jest.fn(),
                        clearCart: jest.fn(),
                        updateCartStatus: jest.fn(),
                    },
                },
                {
                    provide: ProductGrpcClient,
                    useValue: {
                        getProductBySlug: jest.fn(),
                        checkStock: jest.fn(),
                    },
                },
                {
                    provide: AuthorizationService,
                    useValue: {
                        isAdmin: jest.fn(),
                        isVendor: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        cartRepository = module.get<CartRepository>(CartRepository);
        productGrpcClient = module.get<ProductGrpcClient>(ProductGrpcClient);
        authService = module.get<AuthorizationService>(AuthorizationService);
    });

    describe('addToCart', () => {
        const addToCartInput: AddToCartInput = {
            productSlug: 'test-product',
            vendorProductId: 'vp-123',
            quantity: 2,
        };

        beforeEach(() => {
            jest.spyOn(productGrpcClient, 'getProductBySlug').mockResolvedValue(mockProduct);
            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: true,
                results: [{ isAvailable: true }],
            });
            jest.spyOn(cartRepository, 'findActiveByCustomerId').mockResolvedValue(null);
            jest.spyOn(cartRepository, 'createCart').mockResolvedValue({
                id: 'cart-123',
                customerId: mockUser.id,
                items: [],
            } as any);
            jest.spyOn(cartRepository, 'findCartItem').mockResolvedValue(null);
        });

        it('should add new item to cart', async () => {
            const result = await service.addToCart(addToCartInput, mockUser);

            expect(result).toBeDefined();
            expect(productGrpcClient.getProductBySlug).toHaveBeenCalledWith('test-product');
            expect(productGrpcClient.checkStock).toHaveBeenCalled();
            expect(cartRepository.addItem).toHaveBeenCalled();
        });

        it('should update quantity for existing item', async () => {
            const existingCart = {
                id: 'cart-123',
                customerId: mockUser.id,
                items: [],
            };

            const existingItem = {
                id: 'item-123',
                vendorProductId: 'vp-123',
                quantity: 1,
                unitPrice: 49.99,
            };

            jest.spyOn(cartRepository, 'findActiveByCustomerId').mockResolvedValue(existingCart as any);
            jest.spyOn(cartRepository, 'findCartItem').mockResolvedValue(existingItem as any);

            await service.addToCart(addToCartInput, mockUser);

            expect(cartRepository.updateItem).toHaveBeenCalledWith('item-123', {
                quantity: 3,
                unitPrice: 49.99,
            });
        });

        it('should throw error for unpublished product', async () => {
            jest.spyOn(productGrpcClient, 'getProductBySlug').mockResolvedValue({
                ...mockProduct,
                product: {
                    ...mockProduct.product,
                    isPublished: false,
                },
            });

            await expect(service.addToCart(addToCartInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error for insufficient stock', async () => {
            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: false,
                results: [{ isAvailable: false, availableQuantity: 1 }],
            });

            await expect(service.addToCart(addToCartInput, mockUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('validateCartForCheckout', () => {
        it('should validate cart successfully', async () => {
            const cart = {
                id: 'cart-123',
                items: [
                    {
                        id: 'item-1',
                        vendorProductId: 'vp-123',
                        quantity: 2,
                        unitPrice: 49.99,
                    },
                ],
            };

            jest.spyOn(cartRepository, 'findActiveByCustomerId').mockResolvedValue(cart as any);
            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: true,
                results: [{ isAvailable: true, availableQuantity: 5 }],
            });

            const result = await service.validateCartForCheckout(mockUser);

            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        it('should detect price changes', async () => {
            const cart = {
                id: 'cart-123',
                items: [
                    {
                        id: 'item-1',
                        vendorProductId: 'vp-123',
                        quantity: 2,
                        unitPrice: 49.99,
                    },
                ],
            };

            jest.spyOn(cartRepository, 'findActiveByCustomerId').mockResolvedValue(cart as any);
            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: true,
                results: [{ isAvailable: true }],
            });
            jest.spyOn(productGrpcClient, 'getVendorProduct').mockResolvedValue({
                success: true,
                vendorProduct: {
                    price: 59.99, // Price increased from 49.99
                    isPublished: true,
                    status: 'active',
                },
            });

            const result = await service.validateCartForCheckout(mockUser);

            expect(result.valid).toBe(false);
            expect(result.issues[0].type).toBe('price_changed');
        });

        it('should detect out of stock items', async () => {
            const cart = {
                id: 'cart-123',
                items: [
                    {
                        id: 'item-1',
                        vendorProductId: 'vp-123',
                        quantity: 2,
                        unitPrice: 49.99,
                    },
                ],
            };

            jest.spyOn(cartRepository, 'findActiveByCustomerId').mockResolvedValue(cart as any);
            jest.spyOn(productGrpcClient, 'checkStock').mockResolvedValue({
                success: true,
                allAvailable: false,
                results: [{ isAvailable: false, availableQuantity: 0 }],
            });

            const result = await service.validateCartForCheckout(mockUser);

            expect(result.valid).toBe(false);
            expect(result.issues[0].type).toBe('out_of_stock');
        });
    });
});