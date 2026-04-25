import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly prefRepo: Repository<NotificationPreference>,
  ) {}

  async send(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    actionUrl?: string,
  ): Promise<Notification> {
    // Check user preferences
    const prefs = await this.getOrCreatePreferences(userId);

    // In-app notification always gets created
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      body,
      data,
      channel: NotificationChannel.IN_APP,
      actionUrl,
    });

    const saved = await this.notificationRepo.save(notification);

    // Dispatch to other channels based on preferences
    if (prefs.emailEnabled && this.isEmailEligible(type, prefs)) {
      this.dispatchEmail(userId, title, body).catch((err) =>
        this.logger.error(`Email dispatch failed for user ${userId}`, err),
      );
    }

    if (prefs.smsEnabled && this.isSmsEligible(type, prefs)) {
      this.dispatchSms(userId, title).catch((err) =>
        this.logger.error(`SMS dispatch failed for user ${userId}`, err),
      );
    }

    if (prefs.pushEnabled) {
      this.dispatchPush(userId, title, body, data).catch((err) =>
        this.logger.error(`Push dispatch failed for user ${userId}`, err),
      );
    }

    this.logger.log(`Notification sent to ${userId}: ${type}`);
    return saved;
  }

  async sendOrderNotification(
    userId: string,
    type: NotificationType,
    orderId: string,
    orderNumber: string,
  ): Promise<Notification> {
    const templates: Record<string, { title: string; body: string }> = {
      [NotificationType.ORDER_PLACED]: {
        title: 'Order Placed!',
        body: `Your order ${orderNumber} has been placed successfully.`,
      },
      [NotificationType.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        body: `Your order ${orderNumber} has been confirmed by the vendor.`,
      },
      [NotificationType.ORDER_PREPARING]: {
        title: 'Preparing Your Order',
        body: `Your order ${orderNumber} is being prepared.`,
      },
      [NotificationType.ORDER_READY]: {
        title: 'Order Ready',
        body: `Your order ${orderNumber} is ready for pickup.`,
      },
      [NotificationType.ORDER_PICKED_UP]: {
        title: 'Order Picked Up',
        body: `Your order ${orderNumber} has been picked up for delivery.`,
      },
      [NotificationType.ORDER_DELIVERED]: {
        title: 'Order Delivered!',
        body: `Your order ${orderNumber} has been delivered. Enjoy!`,
      },
      [NotificationType.ORDER_CANCELLED]: {
        title: 'Order Cancelled',
        body: `Your order ${orderNumber} has been cancelled.`,
      },
    };

    const template = templates[type] || { title: 'Order Update', body: `Order ${orderNumber} updated.` };

    return this.send(userId, type, template.title, template.body, {
      orderId,
      orderNumber,
    }, `/orders/${orderId}`);
  }

  async getUserNotifications(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Notification>> {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { updated: result.affected || 0 };
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    return this.getOrCreatePreferences(userId);
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    const existing = await this.getOrCreatePreferences(userId);

    if (prefs.emailEnabled !== undefined) existing.emailEnabled = prefs.emailEnabled;
    if (prefs.smsEnabled !== undefined) existing.smsEnabled = prefs.smsEnabled;
    if (prefs.pushEnabled !== undefined) existing.pushEnabled = prefs.pushEnabled;
    if (prefs.orderUpdates !== undefined) existing.orderUpdates = prefs.orderUpdates;
    if (prefs.paymentUpdates !== undefined) existing.paymentUpdates = prefs.paymentUpdates;
    if (prefs.promotionalEmails !== undefined) existing.promotionalEmails = prefs.promotionalEmails;
    if (prefs.vendorAlerts !== undefined) existing.vendorAlerts = prefs.vendorAlerts;

    return this.prefRepo.save(existing);
  }

  private async getOrCreatePreferences(userId: string): Promise<NotificationPreference> {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefRepo.create({ userId });
      prefs = await this.prefRepo.save(prefs);
    }
    return prefs;
  }

  private isEmailEligible(type: NotificationType, prefs: NotificationPreference): boolean {
    if (type.startsWith('order_') && !prefs.orderUpdates) return false;
    if (type.startsWith('payment_') && !prefs.paymentUpdates) return false;
    if (type === NotificationType.PROMOTION && !prefs.promotionalEmails) return false;
    return true;
  }

  private isSmsEligible(type: NotificationType, prefs: NotificationPreference): boolean {
    // Only order and payment critical notifications via SMS
    const smsTypes = [
      NotificationType.ORDER_PLACED,
      NotificationType.ORDER_DELIVERED,
      NotificationType.ORDER_CANCELLED,
      NotificationType.PAYMENT_SUCCESS,
      NotificationType.PAYMENT_FAILED,
    ];
    return smsTypes.includes(type) && prefs.orderUpdates;
  }

  private async dispatchEmail(userId: string, subject: string, body: string): Promise<void> {
    // TODO: Integrate with AWS SES or alternative email provider
    this.logger.log(`[Email] To: ${userId}, Subject: ${subject}`);
  }

  private async dispatchSms(userId: string, message: string): Promise<void> {
    // TODO: Integrate with AWS SNS or alternative SMS provider
    this.logger.log(`[SMS] To: ${userId}, Message: ${message}`);
  }

  private async dispatchPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Integrate with Firebase Cloud Messaging (FCM)
    this.logger.log(`[Push] To: ${userId}, Title: ${title}`);
  }
}
