// src/modules/categories/categories.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Category)
    private readonly categoryTreeRepository: TreeRepository<Category>,
  ) {}

  async findAll(includeInactive = false): Promise<Category[]> {
    const query = this.categoryRepository.createQueryBuilder('category');

    if (!includeInactive) {
      query.where('category.is_active = :isActive', { isActive: true });
    }

    return query.orderBy('category.display_order', 'ASC').getMany();
  }

  async findTree(): Promise<Category[]> {
    return this.categoryTreeRepository.findTrees();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const slug =
      input.slug || slugify(input.name, { lower: true, strict: true });

    // Check for duplicate slug
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    let parent: Category | undefined;
    if (input.parentId) {
      parent = await this.findById(input.parentId);
    }

    const category = this.categoryRepository.create({
      ...input,
      slug,
      parent,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id} (${saved.name})`);

    return saved;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.findById(id);

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: input.slug },
      });
      if (existing && existing.id !== id) {
        throw new Error('Category with this slug already exists');
      }
    }

    if (input.parentId && input.parentId !== category.parentId) {
      const parent = await this.findById(input.parentId);
      category.parent = parent;
    }

    Object.assign(category, input);
    const saved = await this.categoryRepository.save(category);

    this.logger.log(`Category updated: ${id}`);

    return saved;
  }

  async delete(id: string): Promise<boolean> {
    const category = await this.findById(id);
    await this.categoryRepository.softDelete(id);
    this.logger.log(`Category deleted: ${id}`);
    return true;
  }

  async getFeaturedCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isFeatured: true, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }
}
