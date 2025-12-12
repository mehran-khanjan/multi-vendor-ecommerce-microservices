// test/unit/products/products.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductsRepository } from '@modules/products/products.repository';
import { Product } from '@modules/products/entities/product.entity';
import { ProductImage } from '@modules/products/entities/product-image.entity';
import { ProductFilterInput } from '@modules/products/dto';
import { PaginationInput } from '@common/dto';

describe('ProductsRepository', () => {
    let repository: ProductsRepository;
    let productRepo: Repository<Product>;
    let imageRepo: Repository<ProductImage>;

    const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        slug: 'test-product',
        basePrice: 99.99,
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsRepository,
                {
                    provide: getRepositoryToken(Product),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(ProductImage),
                    useClass: Repository,
                },
            ],
        }).compile();

        repository = module.get<ProductsRepository>(ProductsRepository);
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        imageRepo = module.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
    });

    describe('findAll', () => {
        it('should build query with filters', async () => {
            const filter: ProductFilterInput = {
                categoryId: 'cat-123',
                isPublished: true,
                minPrice: 10,
                maxPrice: 100,
            };
            const pagination: PaginationInput = {
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'DESC',
            };

            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
            };

            jest.spyOn(productRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

            const result = await repository.findAll(filter, pagination, true);

            expect(result.products).toHaveLength(1);
            expect(result.meta.totalItems).toBe(1);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'product.isPublished = :isPublished',
                { isPublished: true },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'product.categoryId = :categoryId',
                { categoryId: 'cat-123' },
            );
        });
    });

    describe('create', () => {
        it('should create product with images', async () => {
            const productData = {
                name: 'New Product',
                slug: 'new-product',
                basePrice: 49.99,
            };

            const createdProduct = {
                ...productData,
                id: 'new-id',
                createdAt: new Date(),
            };

            jest.spyOn(productRepo, 'create').mockReturnValue(createdProduct as any);
            jest.spyOn(productRepo, 'save').mockResolvedValue(createdProduct as any);

            const result = await repository.create(productData as any);

            expect(result).toEqual(createdProduct);
            expect(productRepo.create).toHaveBeenCalledWith(productData);
            expect(productRepo.save).toHaveBeenCalledWith(createdProduct);
        });
    });

    describe('addImages', () => {
        it('should add multiple images to product', async () => {
            const productId = 'product-123';
            const images = [
                { url: 'image1.jpg', isPrimary: true },
                { url: 'image2.jpg', isPrimary: false },
            ];

            const createdImages = images.map((img, idx) => ({
                ...img,
                id: `img-${idx}`,
                productId,
            }));

            jest.spyOn(imageRepo, 'create').mockImplementation((data) => data as any);
            jest.spyOn(imageRepo, 'save').mockResolvedValue(createdImages as any);

            const result = await repository.addImages(productId, images);

            expect(result).toHaveLength(2);
            expect(result[0].productId).toBe(productId);
            expect(imageRepo.create).toHaveBeenCalledTimes(2);
            expect(imageRepo.save).toHaveBeenCalledWith(expect.arrayContaining(createdImages));
        });
    });
});