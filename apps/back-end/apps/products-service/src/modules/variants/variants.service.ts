// src/modules/variants/variants.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './entities/variant.entity';
import { VariantOption } from './entities/variant-option.entity';
import { CreateVariantInput, UpdateVariantInput } from './dto';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { UserContext } from '@common/interfaces';
import { Action, Subject } from '@common/enums';

@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name);

  constructor(
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(VariantOption)
    private readonly optionRepository: Repository<VariantOption>,
    private readonly authService: AuthorizationService,
  ) {}

  async findById(id: string): Promise<Variant> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product', 'options'],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  async findByProductId(productId: string): Promise<Variant[]> {
    return this.variantRepository.find({
      where: { productId },
      relations: ['options'],
      order: { displayOrder: 'ASC' },
    });
  }

  async findActiveByProductId(productId: string): Promise<Variant[]> {
    return this.variantRepository.find({
      where: { productId, isActive: true },
      relations: ['options'],
      order: { displayOrder: 'ASC' },
    });
  }

  // ==========================================
  // Admin Only Methods
  // ==========================================

  async create(input: CreateVariantInput, user: UserContext): Promise<Variant> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can create variants');
    }

    const variant = this.variantRepository.create({
      productId: input.productId,
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      costPrice: input.costPrice,
      basePrice: input.basePrice,
      weight: input.weight,
      isActive: input.isActive ?? true,
      displayOrder: input.displayOrder ?? 0,
      imageUrl: input.imageUrl,
    });

    const saved = await this.variantRepository.save(variant);

    // Add options if provided
    if (input.options && input.options.length > 0) {
      const options = input.options.map((opt) =>
        this.optionRepository.create({
          variantId: saved.id,
          name: opt.name,
          value: opt.value,
          displayOrder: opt.displayOrder ?? 0,
        }),
      );
      await this.optionRepository.save(options);
    }

    this.logger.log(`Variant created by admin ${user.id}: ${saved.id}`);

    return this.findById(saved.id);
  }

  async update(
    id: string,
    input: UpdateVariantInput,
    user: UserContext,
  ): Promise<Variant> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can update variants');
    }

    const variant = await this.findById(id);

    // Update variant fields
    Object.assign(variant, input);

    // Handle options update
    if (input.options) {
      // Remove existing options
      await this.optionRepository.delete({ variantId: id });

      // Add new options
      const options = input.options.map((opt) =>
        this.optionRepository.create({
          variantId: id,
          name: opt.name,
          value: opt.value,
          displayOrder: opt.displayOrder ?? 0,
        }),
      );
      await this.optionRepository.save(options);
    }

    await this.variantRepository.save(variant);

    this.logger.log(`Variant updated by admin ${user.id}: ${id}`);

    return this.findById(id);
  }

  async delete(id: string, user: UserContext): Promise<boolean> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can delete variants');
    }

    await this.findById(id);
    await this.variantRepository.softDelete(id);

    this.logger.log(`Variant deleted by admin ${user.id}: ${id}`);

    return true;
  }

  // ==========================================
  // Field Access Control
  // ==========================================

  filterVariantForUser(
    variant: Variant,
    user: UserContext | null,
  ): Partial<Variant> {
    const filtered = { ...variant } as any;

    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_SKU, Subject.VARIANT)
    ) {
      delete filtered.sku;
    }

    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_COST, Subject.VARIANT)
    ) {
      delete filtered.costPrice;
    }

    return filtered;
  }
}
