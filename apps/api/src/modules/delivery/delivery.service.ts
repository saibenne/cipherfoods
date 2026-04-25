import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus, DeliveryProvider } from './entities/delivery.entity';
import { CreateDeliveryDto, EstimateDeliveryDto } from './dto/delivery.dto';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from '@cipherfoods/shared';
import { FREE_DELIVERY_THRESHOLD, DEFAULT_DELIVERY_CHARGE } from '@cipherfoods/shared';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private readonly dunzoApiKey: string;
  private readonly dunzoBaseUrl: string;

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) {
    this.dunzoApiKey = this.configService.get<string>('DUNZO_API_KEY', '');
    this.dunzoBaseUrl = this.configService.get<string>('DUNZO_BASE_URL', 'https://api.dunzo.com/api/v1');
  }

  async createDeliveryTask(
    dto: CreateDeliveryDto,
    vendorId: string,
  ): Promise<Delivery> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const existingDelivery = await this.deliveryRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existingDelivery) {
      throw new BadRequestException('Delivery task already exists for this order');
    }

    let externalTaskId: string | undefined;
    let trackingUrl: string | undefined;
    let estimatedDistance: number | undefined;
    let estimatedDuration: string | undefined;
    let providerResponse: Record<string, unknown> | undefined;
    let provider = DeliveryProvider.SELF;

    // Try Dunzo API if configured
    if (this.dunzoApiKey) {
      try {
        const taskResponse = await fetch(`${this.dunzoBaseUrl}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.dunzoApiKey,
          },
          body: JSON.stringify({
            pickup_details: [{
              address: {
                street_address_1: dto.pickupAddress.addressLine1,
                street_address_2: dto.pickupAddress.addressLine2 || '',
                city: dto.pickupAddress.city,
                state: dto.pickupAddress.state,
                pincode: dto.pickupAddress.pincode,
                lat: dto.pickupAddress.lat,
                lng: dto.pickupAddress.lng,
              },
              contact: {
                name: dto.pickupAddress.contactName,
                phone_number: dto.pickupAddress.contactPhone,
              },
            }],
            drop_details: [{
              address: {
                street_address_1: dto.dropAddress.addressLine1,
                street_address_2: dto.dropAddress.addressLine2 || '',
                city: dto.dropAddress.city,
                state: dto.dropAddress.state,
                pincode: dto.dropAddress.pincode,
                lat: dto.dropAddress.lat,
                lng: dto.dropAddress.lng,
              },
              contact: {
                name: dto.dropAddress.contactName,
                phone_number: dto.dropAddress.contactPhone,
              },
            }],
            payment_method: 'DUNZO_CREDIT',
            order_amount: Number(order.totalAmount),
          }),
        });

        if (taskResponse.ok) {
          const data = await taskResponse.json() as Record<string, unknown>;
          externalTaskId = data.task_id as string;
          trackingUrl = data.tracking_url as string;
          estimatedDistance = data.estimated_distance as number;
          estimatedDuration = data.eta as string;
          providerResponse = data;
          provider = DeliveryProvider.DUNZO;
        } else {
          this.logger.warn('Dunzo task creation failed, falling back to self delivery');
        }
      } catch (error) {
        this.logger.error('Dunzo API error', error);
      }
    }

    const delivery = this.deliveryRepo.create({
      orderId: dto.orderId,
      vendorId,
      provider,
      externalTaskId,
      trackingUrl,
      status: DeliveryStatus.PENDING,
      pickupAddress: dto.pickupAddress,
      dropAddress: dto.dropAddress,
      deliveryCost: Number(order.deliveryCharge),
      estimatedDistance,
      estimatedDuration,
      providerResponse,
    });

    const saved = await this.deliveryRepo.save(delivery);

    // Update order with tracking info
    if (externalTaskId) {
      await this.orderRepo.update(dto.orderId, {
        deliveryTrackingId: externalTaskId,
      });
    }

    this.logger.log(`Delivery created for order ${dto.orderId} via ${provider}`);
    return saved;
  }

  async getDeliveryByOrderId(orderId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { orderId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found for this order');
    }
    return delivery;
  }

  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    driverInfo?: { name: string; phone: string },
  ): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    delivery.status = status;

    if (driverInfo) {
      delivery.driverName = driverInfo.name;
      delivery.driverPhone = driverInfo.phone;
    }

    if (status === DeliveryStatus.PICKED_UP) {
      delivery.pickedUpAt = new Date();
      await this.orderRepo.update(delivery.orderId, { status: OrderStatus.PICKED_UP });
    }

    if (status === DeliveryStatus.IN_TRANSIT) {
      await this.orderRepo.update(delivery.orderId, { status: OrderStatus.IN_TRANSIT });
    }

    if (status === DeliveryStatus.DELIVERED) {
      delivery.deliveredAt = new Date();
      await this.orderRepo.update(delivery.orderId, { status: OrderStatus.DELIVERED });
    }

    if (status === DeliveryStatus.FAILED) {
      this.logger.warn(`Delivery ${deliveryId} failed`);
    }

    return this.deliveryRepo.save(delivery);
  }

  async handleWebhook(body: Record<string, unknown>): Promise<void> {
    const taskId = body.task_id as string;
    const status = body.status as string;

    if (!taskId) {
      this.logger.warn('Webhook received without task_id');
      return;
    }

    const delivery = await this.deliveryRepo.findOne({
      where: { externalTaskId: taskId },
    });

    if (!delivery) {
      this.logger.warn(`No delivery found for external task ${taskId}`);
      return;
    }

    const statusMap: Record<string, DeliveryStatus> = {
      'runner_assigned': DeliveryStatus.ASSIGNED,
      'picked_up': DeliveryStatus.PICKED_UP,
      'in_transit': DeliveryStatus.IN_TRANSIT,
      'delivered': DeliveryStatus.DELIVERED,
      'failed': DeliveryStatus.FAILED,
      'cancelled': DeliveryStatus.CANCELLED,
      'returned': DeliveryStatus.RETURNED,
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) {
      this.logger.log(`Unknown delivery status from webhook: ${status}`);
      return;
    }

    const runner = body.runner as Record<string, string> | undefined;
    await this.updateStatus(
      delivery.id,
      mappedStatus,
      runner ? { name: runner.name, phone: runner.phone_number } : undefined,
    );

    delivery.providerResponse = body;
    await this.deliveryRepo.save(delivery);

    this.logger.log(`Delivery ${delivery.id} updated to ${mappedStatus} via webhook`);
  }

  async estimateDelivery(
    dto: EstimateDeliveryDto,
  ): Promise<{ estimatedCost: number; estimatedDuration: string; provider: string }> {
    // Try Dunzo estimation
    if (this.dunzoApiKey) {
      try {
        const response = await fetch(`${this.dunzoBaseUrl}/tasks/estimate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.dunzoApiKey,
          },
          body: JSON.stringify({
            pickup_details: [{
              lat: dto.pickupAddress.lat,
              lng: dto.pickupAddress.lng,
            }],
            drop_details: [{
              lat: dto.dropAddress.lat,
              lng: dto.dropAddress.lng,
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return {
            estimatedCost: (data.estimated_price as number) || DEFAULT_DELIVERY_CHARGE,
            estimatedDuration: (data.eta as string) || '45-60 mins',
            provider: 'dunzo',
          };
        }
      } catch (error) {
        this.logger.error('Dunzo estimation failed', error);
      }
    }

    // Fallback to flat rate
    return {
      estimatedCost: DEFAULT_DELIVERY_CHARGE,
      estimatedDuration: '45-60 mins',
      provider: 'self',
    };
  }

  async getVendorDeliveries(
    vendorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Delivery>> {
    const [items, total] = await this.deliveryRepo.findAndCount({
      where: { vendorId },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }
}
