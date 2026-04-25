import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundDto } from './dto/refund.dto';
import { Order } from '../order/entities/order.entity';
import { PaymentStatus } from '@cipherfoods/shared';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  async createRazorpayOrder(
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId, userId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const existingPayment = await this.paymentRepo.findOne({
      where: { orderId: dto.orderId, status: PaymentStatus.CAPTURED },
    });
    if (existingPayment) {
      throw new BadRequestException('Order already paid');
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    let razorpayOrder: { id: string };
    try {
      razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id, userId },
      });
    } catch (error) {
      this.logger.error('Razorpay order creation failed', error);
      throw new InternalServerErrorException('Payment gateway error');
    }

    const payment = this.paymentRepo.create({
      orderId: order.id,
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      method: dto.paymentMethod,
      attempts: 0,
    });

    await this.paymentRepo.save(payment);

    this.logger.log(`Razorpay order ${razorpayOrder.id} created for order ${order.id}`);

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found for this Razorpay order');
    }

    const expectedSignature = createHmac('sha256', this.keySecret)
      .update(dto.razorpayOrderId + '|' + dto.razorpayPaymentId)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      payment.status = PaymentStatus.FAILED;
      payment.attempts += 1;
      await this.paymentRepo.save(payment);
      throw new BadRequestException('Invalid payment signature');
    }

    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    payment.status = PaymentStatus.CAPTURED;
    payment.attempts += 1;

    await this.paymentRepo.save(payment);

    await this.orderRepo.update(payment.orderId, {
      paymentStatus: PaymentStatus.CAPTURED,
      razorpayPaymentId: dto.razorpayPaymentId,
    });

    this.logger.log(`Payment verified for order ${payment.orderId}`);

    return payment;
  }

  async handleWebhook(body: Record<string, unknown>, signature: string): Promise<void> {
    const expectedSignature = createHmac('sha256', this.keySecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = body.event as string;
    const payload = body.payload as Record<string, unknown> | undefined;
    const paymentPayload = payload?.payment as Record<string, unknown> | undefined;
    const payloadEntity = paymentPayload?.entity as Record<string, unknown> | undefined;

    if (!payloadEntity) {
      this.logger.warn(`Webhook event ${event} has no payment entity`);
      return;
    }

    const razorpayOrderId = payloadEntity.order_id as string;
    const payment = await this.paymentRepo.findOne({ where: { razorpayOrderId } });

    if (!payment) {
      this.logger.warn(`No payment found for Razorpay order ${razorpayOrderId}`);
      return;
    }

    switch (event) {
      case 'payment.captured': {
        payment.razorpayPaymentId = payloadEntity.id as string;
        payment.status = PaymentStatus.CAPTURED;
        payment.metadata = payloadEntity;
        await this.paymentRepo.save(payment);
        await this.orderRepo.update(payment.orderId, {
          paymentStatus: PaymentStatus.CAPTURED,
          razorpayPaymentId: payloadEntity.id as string,
        });
        this.logger.log(`Webhook: payment.captured for order ${payment.orderId}`);
        break;
      }
      case 'payment.failed': {
        payment.status = PaymentStatus.FAILED;
        payment.attempts += 1;
        payment.metadata = payloadEntity;
        await this.paymentRepo.save(payment);
        await this.orderRepo.update(payment.orderId, {
          paymentStatus: PaymentStatus.FAILED,
        });
        this.logger.log(`Webhook: payment.failed for order ${payment.orderId}`);
        break;
      }
      case 'refund.processed': {
        const refundPayload = payload?.refund as Record<string, unknown> | undefined;
        const refundEntity = refundPayload?.entity as Record<string, unknown> | undefined;
        if (refundEntity) {
          payment.refundId = refundEntity.id as string;
          payment.refundAmount = (refundEntity.amount as number) / 100;
          payment.status = PaymentStatus.REFUNDED;
          payment.metadata = { ...(payment.metadata || {}), refund: refundEntity };
          await this.paymentRepo.save(payment);
          await this.orderRepo.update(payment.orderId, {
            paymentStatus: PaymentStatus.REFUNDED,
          });
          this.logger.log(`Webhook: refund.processed for order ${payment.orderId}`);
        }
        break;
      }
      default:
        this.logger.log(`Webhook event ${event} not handled`);
    }
  }

  async initiateRefund(dto: RefundDto): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: dto.paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Only captured payments can be refunded');
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('No Razorpay payment ID found');
    }

    const refundAmount = dto.amount
      ? Math.round(dto.amount * 100)
      : Math.round(Number(payment.amount) * 100);

    let refund: { id: string };
    try {
      refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundAmount,
        notes: { reason: dto.reason, paymentId: payment.id },
      });
    } catch (error) {
      this.logger.error('Razorpay refund failed', error);
      throw new InternalServerErrorException('Refund processing failed');
    }

    payment.refundId = refund.id;
    payment.refundAmount = refundAmount / 100;
    payment.refundReason = dto.reason;
    payment.status = PaymentStatus.REFUNDED;

    await this.paymentRepo.save(payment);

    await this.orderRepo.update(payment.orderId, {
      paymentStatus: PaymentStatus.REFUNDED,
    });

    this.logger.log(`Refund ${refund.id} initiated for payment ${payment.id}`);

    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }
    return payment;
  }

  async getPaymentHistory(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Payment>> {
    const [items, total] = await this.paymentRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }
}
