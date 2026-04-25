import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';
import { ProductService } from '../catalog/services/product.service';
import { MAX_CART_ITEMS } from '@cipherfoods/shared';

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  vendorGroups: { vendorId: string; items: CartItem[]; subtotal: number }[];
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
    private readonly productService: ProductService,
  ) {}

  async getCart(userId: string): Promise<CartSummary> {
    const items = await this.cartRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return this.buildCartSummary(items);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartSummary> {
    const product = await this.productService.findById(dto.productId);

    // Check max cart items
    const existingCount = await this.cartRepo.count({ where: { userId } });
    if (existingCount >= MAX_CART_ITEMS) {
      throw new BadRequestException(`Cart cannot exceed ${MAX_CART_ITEMS} items`);
    }

    // Check for existing item
    const existing = await this.cartRepo.findOne({
      where: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId ?? undefined,
      },
    });

    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartRepo.save(existing);
    } else {
      let unitPrice = Number(product.basePrice);
      let imageUrl: string | undefined;

      if (dto.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === dto.variantId);
        if (variant) {
          unitPrice = Number(variant.salePrice ?? variant.price);
        }
      } else if (product.salePrice) {
        unitPrice = Number(product.salePrice);
      }

      if (product.images && product.images.length > 0) {
        imageUrl = product.images[0].url;
      }

      const cartItem = this.cartRepo.create({
        userId,
        productId: dto.productId,
        variantId: dto.variantId,
        vendorId: product.vendorId,
        productName: product.name,
        unitPrice,
        quantity: dto.quantity,
        imageUrl,
      });

      await this.cartRepo.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartSummary> {
    const item = await this.cartRepo.findOne({ where: { id: itemId, userId } });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await this.cartRepo.save(item);

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartSummary> {
    const result = await this.cartRepo.delete({ id: itemId, userId });

    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    await this.cartRepo.delete({ userId });
    return { message: 'Cart cleared' };
  }

  private buildCartSummary(items: CartItem[]): CartSummary {
    const vendorMap = new Map<string, CartItem[]>();

    for (const item of items) {
      const existing = vendorMap.get(item.vendorId) || [];
      existing.push(item);
      vendorMap.set(item.vendorId, existing);
    }

    const vendorGroups = Array.from(vendorMap.entries()).map(([vendorId, vendorItems]) => ({
      vendorId,
      items: vendorItems,
      subtotal: vendorItems.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
    }));

    return {
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
      vendorGroups,
    };
  }
}
