// src/modules/products/products.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductFilterInput } from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'images'],
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'variants', 'images'],
    });
  }

  async findAll(
    filter: ProductFilterInput,
    pagination: PaginationInput,
    onlyPublished = false,
  ): Promise<{ products: Product[]; meta: PaginationMeta }> {
    const query = this.buildFilterQuery(filter, onlyPublished);

    // Sorting
    const sortField = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'DESC';
    query.orderBy(`product.${sortField}`, sortOrder);

    // Pagination
    const skip = (pagination.page - 1) * pagination.limit;
    query.skip(skip).take(pagination.limit);

    const [products, totalItems] = await query.getManyAndCount();

    const meta: PaginationMeta = {
      totalItems,
      itemCount: products.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { products, meta };
  }

  private buildFilterQuery(
    filter: ProductFilterInput,
    onlyPublished: boolean,
  ): SelectQueryBuilder<Product> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images');

    if (onlyPublished) {
      query.andWhere('product.isPublished = :isPublished', {
        isPublished: true,
      });
      query.andWhere('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
    }

    if (filter.search) {
      query.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    if (filter.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.type) {
      query.andWhere('product.type = :type', { type: filter.type });
    }

    if (filter.status) {
      query.andWhere('product.status = :status', { status: filter.status });
    }

    if (filter.isPublished !== undefined) {
      query.andWhere('product.isPublished = :isPublished', {
        isPublished: filter.isPublished,
      });
    }

    if (filter.isFeatured !== undefined) {
      query.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: filter.isFeatured,
      });
    }

    if (filter.minPrice !== undefined) {
      query.andWhere('product.basePrice >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }

    if (filter.maxPrice !== undefined) {
      query.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    return query;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    await this.productRepository.update(id, productData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.productRepository.softDelete(id);
  }

  async addImages(
    productId: string,
    images: Partial<ProductImage>[],
  ): Promise<ProductImage[]> {
    const entities = images.map((img) =>
      this.imageRepository.create({ ...img, productId }),
    );
    return this.imageRepository.save(entities);
  }

  async removeImage(imageId: string): Promise<void> {
    await this.imageRepository.delete(imageId);
  }

  async updateImageOrder(imageId: string, order: number): Promise<void> {
    await this.imageRepository.update(imageId, { displayOrder: order });
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        isFeatured: true,
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      relations: ['category', 'images'],
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
