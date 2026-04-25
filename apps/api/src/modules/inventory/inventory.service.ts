import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { UpdateStockDto, ReserveStockDto } from './dto/inventory.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
  ) {}

  async findAllByVendor(
    vendorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<InventoryItem>> {
    const [items, total] = await this.inventoryRepo.findAndCount({
      where: { vendorId },
      order: { updatedAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getStock(productId: string, variantId?: string): Promise<InventoryItem> {
    const where: Record<string, unknown> = { productId };
    if (variantId) where.variantId = variantId;

    const item = await this.inventoryRepo.findOne({ where });
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }
    return item;
  }

  async updateStock(
    productId: string,
    vendorId: string,
    dto: UpdateStockDto,
    variantId?: string,
    changedBy?: string,
  ): Promise<InventoryItem> {
    const where: Record<string, unknown> = { productId, vendorId };
    if (variantId) where.variantId = variantId;

    let item = await this.inventoryRepo.findOne({ where });

    if (!item) {
      item = this.inventoryRepo.create({
        productId,
        variantId,
        vendorId,
        quantity: dto.quantity,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      });
    } else {
      const previousStock = item.quantity;
      item.quantity = dto.quantity;
      if (dto.lowStockThreshold !== undefined) item.lowStockThreshold = dto.lowStockThreshold;
      if (dto.batchNumber !== undefined) item.batchNumber = dto.batchNumber;
      if (dto.expiryDate) item.expiryDate = new Date(dto.expiryDate);

      // Record stock movement
      const movement = this.movementRepo.create({
        inventoryItemId: item.id,
        productId,
        variantId,
        vendorId,
        type: StockMovementType.ADJUSTMENT,
        quantity: dto.quantity - previousStock,
        previousStock,
        newStock: dto.quantity,
        reason: dto.reason || 'Manual stock update',
        changedBy,
      });
      await this.movementRepo.save(movement);
    }

    const saved = await this.inventoryRepo.save(item);

    if (saved.quantity <= saved.lowStockThreshold) {
      this.logger.warn(`Low stock alert: product ${productId}, current: ${saved.quantity}, threshold: ${saved.lowStockThreshold}`);
    }

    return saved;
  }

  async reserveStock(dto: ReserveStockDto, vendorId: string): Promise<InventoryItem> {
    const where: Record<string, unknown> = { productId: dto.productId, vendorId };
    if (dto.variantId) where.variantId = dto.variantId;

    const item = await this.inventoryRepo.findOne({ where });
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }

    const availableStock = item.quantity - item.reservedQuantity;
    if (availableStock < dto.quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${availableStock}, Requested: ${dto.quantity}`);
    }

    const previousStock = item.quantity;
    item.reservedQuantity += dto.quantity;

    await this.inventoryRepo.save(item);

    const movement = this.movementRepo.create({
      inventoryItemId: item.id,
      productId: dto.productId,
      variantId: dto.variantId,
      vendorId,
      type: StockMovementType.RESERVED,
      quantity: dto.quantity,
      previousStock,
      newStock: item.quantity,
      orderId: dto.orderId,
      reason: `Reserved for order ${dto.orderId}`,
    });
    await this.movementRepo.save(movement);

    return item;
  }

  async releaseStock(
    productId: string,
    vendorId: string,
    quantity: number,
    orderId: string,
    variantId?: string,
  ): Promise<InventoryItem> {
    const where: Record<string, unknown> = { productId, vendorId };
    if (variantId) where.variantId = variantId;

    const item = await this.inventoryRepo.findOne({ where });
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }

    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);
    await this.inventoryRepo.save(item);

    const movement = this.movementRepo.create({
      inventoryItemId: item.id,
      productId,
      variantId,
      vendorId,
      type: StockMovementType.RELEASED,
      quantity,
      previousStock: item.quantity,
      newStock: item.quantity,
      orderId,
      reason: `Released from cancelled order ${orderId}`,
    });
    await this.movementRepo.save(movement);

    return item;
  }

  async deductStock(
    productId: string,
    vendorId: string,
    quantity: number,
    orderId: string,
    variantId?: string,
  ): Promise<InventoryItem> {
    const where: Record<string, unknown> = { productId, vendorId };
    if (variantId) where.variantId = variantId;

    const item = await this.inventoryRepo.findOne({ where });
    if (!item) {
      throw new NotFoundException('Inventory record not found');
    }

    const previousStock = item.quantity;
    item.quantity -= quantity;
    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);

    await this.inventoryRepo.save(item);

    const movement = this.movementRepo.create({
      inventoryItemId: item.id,
      productId,
      variantId,
      vendorId,
      type: StockMovementType.OUT,
      quantity,
      previousStock,
      newStock: item.quantity,
      orderId,
      reason: `Fulfilled order ${orderId}`,
    });
    await this.movementRepo.save(movement);

    return item;
  }

  async getLowStockItems(
    vendorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<InventoryItem>> {
    const qb = this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.vendorId = :vendorId', { vendorId })
      .andWhere('inv.quantity <= inv.lowStockThreshold')
      .orderBy('inv.quantity', 'ASC');

    const [items, total] = await qb
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getExpiringItems(
    vendorId: string,
    daysAhead: number = 7,
  ): Promise<InventoryItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.inventoryRepo.find({
      where: {
        vendorId,
        expiryDate: LessThanOrEqual(futureDate),
      },
      order: { expiryDate: 'ASC' },
    });
  }

  async getStockMovements(
    productId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<StockMovement>> {
    const [items, total] = await this.movementRepo.findAndCount({
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }
}
