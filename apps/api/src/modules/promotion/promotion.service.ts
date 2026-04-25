import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Coupon, CouponType, CouponScope } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto, ValidateCouponDto } from './dto/promotion.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly usageRepo: Repository<CouponUsage>,
  ) {}

  async createCoupon(dto: CreateCouponDto, createdBy: string): Promise<Coupon> {
    const existing = await this.couponRepo.findOne({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Coupon code ${dto.code} already exists`);
    }

    const coupon = this.couponRepo.create({
      ...dto,
      code: dto.code.toUpperCase(),
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      createdBy,
    });

    const saved = await this.couponRepo.save(coupon);
    this.logger.log(`Coupon created: ${saved.code}`);
    return saved;
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async listCoupons(
    pagination: PaginationDto,
    activeOnly: boolean = false,
  ): Promise<PaginatedResult<Coupon>> {
    const qb = this.couponRepo.createQueryBuilder('coupon');

    if (activeOnly) {
      const now = new Date();
      qb.where('coupon.isActive = true')
        .andWhere('coupon.validFrom <= :now', { now })
        .andWhere('coupon.validUntil >= :now', { now });
    }

    qb.orderBy('coupon.createdAt', 'DESC');

    const [items, total] = await qb
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async validateCoupon(
    userId: string,
    dto: ValidateCouponDto,
  ): Promise<{ valid: boolean; discount: number; message?: string }> {
    const coupon = await this.couponRepo.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'Coupon is no longer active' };
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { valid: false, discount: 0, message: 'Coupon has expired or not yet valid' };
    }

    if (coupon.maxUsages && coupon.currentUsages >= coupon.maxUsages) {
      return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
    }

    // Check per-user limit
    const userUsageCount = await this.usageRepo.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsageCount >= coupon.maxUsagesPerUser) {
      return { valid: false, discount: 0, message: 'You have already used this coupon' };
    }

    if (dto.orderAmount < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
      };
    }

    // Check scope
    if (coupon.scope === CouponScope.CATEGORY && coupon.scopeId && dto.categoryId !== coupon.scopeId) {
      return { valid: false, discount: 0, message: 'Coupon not valid for this category' };
    }
    if (coupon.scope === CouponScope.VENDOR && coupon.scopeId && dto.vendorId !== coupon.scopeId) {
      return { valid: false, discount: 0, message: 'Coupon not valid for this vendor' };
    }

    // Calculate discount
    let discount = 0;
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = (dto.orderAmount * Number(coupon.value)) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, Number(coupon.maxDiscount));
        }
        break;
      case CouponType.FLAT:
        discount = Number(coupon.value);
        break;
      case CouponType.FREE_DELIVERY:
        discount = 0; // delivery charge handled separately
        break;
    }

    discount = Math.min(discount, dto.orderAmount); // can't exceed order amount

    return { valid: true, discount: Math.round(discount * 100) / 100 };
  }

  async applyCoupon(
    couponCode: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<CouponUsage> {
    const coupon = await this.getCouponByCode(couponCode);

    coupon.currentUsages += 1;
    await this.couponRepo.save(coupon);

    const usage = this.usageRepo.create({
      couponId: coupon.id,
      userId,
      orderId,
      discountApplied,
    });

    return this.usageRepo.save(usage);
  }

  async deactivateCoupon(couponId: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    coupon.isActive = false;
    return this.couponRepo.save(coupon);
  }

  async getActivePromotions(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponRepo.find({
      where: {
        isActive: true,
        validFrom: LessThanOrEqual(now),
        validUntil: MoreThanOrEqual(now),
        scope: CouponScope.GLOBAL,
      },
      order: { validUntil: 'ASC' },
      take: 10,
    });
  }
}
