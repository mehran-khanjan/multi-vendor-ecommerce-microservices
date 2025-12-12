// test/unit/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '@modules/products/products.service';
import { ProductsRepository } from '@modules/products/products.repository';
import { Product } from '@modules/products/entities/product.entity';
import { ProductImage } from '@modules/products/entities/product-image.entity';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { CreateProductInput } from '@modules/products/dto';
import { ProductStatus, ProductType } from '@modules/products/entities/product.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProductsService', () => {
    let service: ProductsService;
    let productsRepository: ProductsRepository;
    let authService: AuthorizationService;
    let productRepo: Repository<Product>;
    let imageRepo: Repository<ProductImage>;

    const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        slug: 'test-product',
        categoryId: 'cat-123',
        basePrice: 99.99,
        status: ProductStatus.DRAFT,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: ProductsRepository,
                    useValue: {
                        findById: jest.fn(),
                        findBySlug: jest.fn(),
                        findAll: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                        addImages: jest.fn(),
                        getFeaturedProducts: jest.fn(),
                    },
                },
                {
                    provide: AuthorizationService,
                    useValue: {
                        isAdmin: jest.fn(),
                        checkPermission: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(ProductImage),
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        productsRepository = module.get<ProductsRepository>(ProductsRepository);
        authService = module.get<AuthorizationService>(AuthorizationService);
    });

    describe('findPublishedProductBySlug', () => {
        it('should return published product', async () => {
            const publishedProduct = {
                ...mockProduct,
                status: ProductStatus.ACTIVE,
                isPublished: true,
            };
            jest.spyOn(productsRepository, 'findBySlug').mockResolvedValue(publishedProduct as any);

            const result = await service.findPublishedProductBySlug('test-product');

            expect(result).toEqual(publishedProduct);
            expect(productsRepository.findBySlug).toHaveBeenCalledWith('test-product');
        });

        it('should throw NotFoundException for unpublished product', async () => {
            jest.spyOn(productsRepository, 'findBySlug').mockResolvedValue(mockProduct as any);

            await expect(service.findPublishedProductBySlug('test-product')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException for non-existent product', async () => {
            jest.spyOn(productsRepository, 'findBySlug').mockResolvedValue(null);

            await expect(service.findPublishedProductBySlug('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        const createInput: CreateProductInput = {
            name: 'New Product',
            categoryId: 'cat-123',
            basePrice: 49.99,
            type: ProductType.PHYSICAL,
        };

        it('should create product as admin', async () => {
            jest.spyOn(authService, 'isAdmin').mockReturnValue(true);
            jest.spyOn(productsRepository, 'findBySlug').mockResolvedValue(null);
            jest.spyOn(productsRepository, 'create').mockResolvedValue(mockProduct as any);

            const result = await service.create(createInput, {
                id: 'admin-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: [],
            });

            expect(result).toEqual(mockProduct);
            expect(authService.isAdmin).toHaveBeenCalled();
            expect(productsRepository.create).toHaveBeenCalled();
        });

        it('should throw ForbiddenException for non-admin user', async () => {
            jest.spyOn(authService, 'isAdmin').mockReturnValue(false);

            await expect(
                service.create(createInput, {
                    id: 'vendor-123',
                    email: 'vendor@example.com',
                    roles: ['vendor'],
                    permissions: [],
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw error for duplicate slug', async () => {
            jest.spyOn(authService, 'isAdmin').mockReturnValue(true);
            jest.spyOn(productsRepository, 'findBySlug').mockResolvedValue(mockProduct as any);

            await expect(
                service.create(createInput, {
                    id: 'admin-123',
                    email: 'admin@example.com',
                    roles: ['admin'],
                    permissions: [],
                }),
            ).rejects.toThrow('Product with this slug already exists');
        });
    });

    describe('filterProductForUser', () => {
        const productWithSensitiveData = {
            ...mockProduct,
            sku: 'SKU-123',
            costPrice: 29.99,
        };

        it('should hide SKU for non-admin user', () => {
            jest.spyOn(authService, 'checkPermission').mockReturnValue(false);

            const filtered = service.filterProductForUser(productWithSensitiveData as any, {
                id: 'customer-123',
                email: 'customer@example.com',
                roles: ['customer'],
                permissions: [],
            });

            expect(filtered.sku).toBeUndefined();
            expect(filtered.costPrice).toBeUndefined();
        });

        it('should show SKU for admin user', () => {
            jest.spyOn(authService, 'checkPermission').mockImplementation((user, action) => {
                return action === 'read_sku' || action === 'read_cost';
            });

            const filtered = service.filterProductForUser(productWithSensitiveData as any, {
                id: 'admin-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: [],
            });

            expect(filtered.sku).toBe('SKU-123');
            expect(filtered.costPrice).toBe(29.99);
        });
    });
});