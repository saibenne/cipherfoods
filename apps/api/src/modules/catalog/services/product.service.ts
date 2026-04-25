import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, vendorId: string): Promise<Product> {
    const slug = this.generateSlug(dto.name);

    const product = this.productRepo.create({
      ...dto,
      slug,
      vendorId,
    });

    const saved = await this.productRepo.save(product);

    // Update search vector using raw query for tsvector
    await this.updateSearchVector(saved.id);

    return this.findById(saved.id);
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResult<Product>> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.isActive = :isActive', { isActive: true });

    this.applyFilters(qb, query);
    this.applySearch(qb, query);
    this.applySorting(qb, query);

    const [items, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: ['category', 'variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product not found`);
    }

    return product;
  }

  async update(id: string, dto: Partial<CreateProductDto>, vendorId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, vendorId },
      relations: ['variants', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Handle variant replacement separately to avoid cascade conflicts
    const incomingVariants = dto.variants;
    const { variants: _ignored, ...restDto } = dto;

    Object.assign(product, restDto);

    if (dto.name) {
      product.slug = this.generateSlug(dto.name);
    }

    if (dto.categoryId) {
      product.categoryId = dto.categoryId;
    }

    if (incomingVariants) {
      // Delete existing variants to avoid duplicates/FK issues
      await this.productRepo.query(
        `DELETE FROM catalog.product_variants WHERE product_id = $1`,
        [id],
      );
      // Assign new variants without IDs so TypeORM creates fresh records
      product.variants = incomingVariants.map((v) => {
        const { id: _id, ...rest } = v as unknown as Record<string, unknown>;
        const variant = Object.assign(new ProductVariant(), rest);
        variant.product = product;
        return variant;
      });
    }

    await this.productRepo.save(product);
    await this.updateSearchVector(id);

    return this.findById(id);
  }

  async delete(id: string, vendorId: string): Promise<void> {
    const result = await this.productRepo.delete({ id, vendorId });

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async findByVendor(vendorId: string, query: ProductQueryDto): Promise<PaginatedResult<Product>> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.vendorId = :vendorId', { vendorId });

    this.applySearch(qb, query);
    this.applySorting(qb, query);

    const [items, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  private applyFilters(qb: SelectQueryBuilder<Product>, query: ProductQueryDto): void {
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.vendorId) {
      qb.andWhere('product.vendorId = :vendorId', { vendorId: query.vendorId });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('product.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.basePrice >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.basePrice <= :maxPrice', { maxPrice: query.maxPrice });
    }
  }

  private applySearch(qb: SelectQueryBuilder<Product>, query: ProductQueryDto): void {
    if (query.search) {
      qb.andWhere(
        `product."searchVector" @@ plainto_tsquery('english', :search)`,
        { search: query.search },
      );
      // Boost relevance scoring
      qb.addSelect(
        `ts_rank(product."searchVector", plainto_tsquery('english', :search))`,
        'search_rank',
      );
      qb.orderBy('search_rank', 'DESC');
    }
  }

  private applySorting(qb: SelectQueryBuilder<Product>, query: ProductQueryDto): void {
    if (!query.search) {
      // Only apply custom sorting when not searching (search already sorts by relevance)
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';
      qb.orderBy(`product.${sortBy}`, sortOrder);
    }
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
  }

  private async updateSearchVector(productId: string): Promise<void> {
    await this.productRepo.query(
      `UPDATE catalog.products
       SET "searchVector" = 
         setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
         setweight(to_tsvector('english', COALESCE("shortDescription", '')), 'B') ||
         setweight(to_tsvector('english', COALESCE(description, '')), 'C')
       WHERE id = $1`,
      [productId],
    );
  }
}
