import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CartService } from '../../cart/cart.service';
import {
  OrderStatus,
  PaymentStatus,
  generateOrderNumber,
  MIN_ORDER_AMOUNT,
  FREE_DELIVERY_THRESHOLD,
  DEFAULT_DELIVERY_CHARGE,
} from '@cipherfoods/shared';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepo: Repository<OrderStatusHistory>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates orders from the user's cart. If the cart has items from multiple vendors,
   * it creates a parent order + one sub-order per vendor.
   */
  async createFromCart(userId: string, dto: CreateOrderDto): Promise<Order | Order[]> {
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (cart.subtotal < MIN_ORDER_AMOUNT) {
      throw new BadRequestException(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (cart.vendorGroups.length === 1) {
        // Single vendor — create one order directly
        const vendorGroup = cart.vendorGroups[0];
        const deliveryCharge = cart.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_CHARGE;
        const totalAmount = cart.subtotal + deliveryCharge;

        const order = queryRunner.manager.create(Order, {
          orderNumber: generateOrderNumber(),
          userId,
          vendorId: vendorGroup.vendorId,
          status: OrderStatus.PLACED,
          paymentStatus: dto.paymentMethod === 'cod' ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          subtotal: cart.subtotal,
          deliveryCharge,
          totalAmount,
          deliveryAddress: dto.deliveryAddress,
          notes: dto.notes,
        });

        const savedOrder = await queryRunner.manager.save(order);

        // Create order items
        const orderItems = cart.items.map((cartItem: { productId: string; variantId: string; productName: string; unitPrice: number; quantity: number; imageUrl: string }) =>
          queryRunner.manager.create(OrderItem, {
            orderId: savedOrder.id,
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            productName: cartItem.productName,
            unitPrice: cartItem.unitPrice,
            quantity: cartItem.quantity,
            totalPrice: Number(cartItem.unitPrice) * cartItem.quantity,
            imageUrl: cartItem.imageUrl,
          }),
        );

        await queryRunner.manager.save(orderItems);

        // Create initial status history
        const initialHistory = queryRunner.manager.create(OrderStatusHistory, {
          orderId: savedOrder.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PLACED,
          note: 'Order placed by customer',
          changedBy: userId,
        });
        await queryRunner.manager.save(initialHistory);

        await queryRunner.commitTransaction();

        // Clear cart after successful order
        await this.cartService.clearCart(userId);

        return this.findById(savedOrder.id);
      }

      // Multi-vendor — create parent order + sub-orders per vendor
      const totalDeliveryCharge = cart.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_CHARGE;
      const totalAmount = cart.subtotal + totalDeliveryCharge;

      const parentOrder = queryRunner.manager.create(Order, {
        orderNumber: generateOrderNumber(),
        userId,
        status: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        subtotal: cart.subtotal,
        deliveryCharge: totalDeliveryCharge,
        totalAmount,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
      });

      const savedParent = await queryRunner.manager.save(parentOrder);

      const subOrders: Order[] = [];

      for (const vendorGroup of cart.vendorGroups) {
        const subOrder = queryRunner.manager.create(Order, {
          orderNumber: generateOrderNumber(),
          userId,
          vendorId: vendorGroup.vendorId,
          parentOrderId: savedParent.id,
          status: OrderStatus.PLACED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          subtotal: vendorGroup.subtotal,
          deliveryCharge: 0, // delivery charge only on parent
          totalAmount: vendorGroup.subtotal,
          deliveryAddress: dto.deliveryAddress,
        });

        const savedSub = await queryRunner.manager.save(subOrder);
        subOrders.push(savedSub);

        // Create order items for this sub-order
        const items = vendorGroup.items.map((cartItem: { productId: string; variantId: string; productName: string; unitPrice: number; quantity: number; imageUrl: string }) =>
          queryRunner.manager.create(OrderItem, {
            orderId: savedSub.id,
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            productName: cartItem.productName,
            unitPrice: cartItem.unitPrice,
            quantity: cartItem.quantity,
            totalPrice: Number(cartItem.unitPrice) * cartItem.quantity,
            imageUrl: cartItem.imageUrl,
          }),
        );

        await queryRunner.manager.save(items);

        // Status history for sub-order
        const subHistory = queryRunner.manager.create(OrderStatusHistory, {
          orderId: savedSub.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PLACED,
          note: 'Sub-order placed (multi-vendor split)',
          changedBy: userId,
        });
        await queryRunner.manager.save(subHistory);
      }

      // Status history for parent
      const parentHistory = queryRunner.manager.create(OrderStatusHistory, {
        orderId: savedParent.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.PLACED,
        note: `Order split into ${subOrders.length} vendor sub-orders`,
        changedBy: userId,
      });
      await queryRunner.manager.save(parentHistory);

      await queryRunner.commitTransaction();
      await this.cartService.clearCart(userId);

      return this.findById(savedParent.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
      order: { statusHistory: { createdAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { orderNumber },
      relations: ['items', 'statusHistory'],
    });

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    return order;
  }

  async findByUser(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Order>> {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { userId, parentOrderId: undefined },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async findByVendor(vendorId: string, pagination: PaginationDto): Promise<PaginatedResult<Order>> {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { vendorId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const oldStatus = order.status;

    order.status = newStatus;
    await this.orderRepo.save(order);

    await this.statusHistoryRepo.save(
      this.statusHistoryRepo.create({
        orderId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        note,
        changedBy,
      }),
    );

    return this.findById(orderId);
  }

  async cancelOrder(orderId: string, userId: string, reason: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.userId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    const cancellableStatuses: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('This order cannot be cancelled at this stage');
    }

    order.cancellationReason = reason;
    await this.orderRepo.save(order);

    return this.updateStatus(orderId, OrderStatus.CANCELLED, userId, reason);
  }
}
