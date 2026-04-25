import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
  FREE_DELIVERY = 'free_delivery',
}

export enum CouponScope {
  GLOBAL = 'global',
  CATEGORY = 'category',
  PRODUCT = 'product',
  VENDOR = 'vendor',
  FIRST_ORDER = 'first_order',
}

@Entity('coupons', { schema: 'promotion' })
@Index('idx_coupons_code', ['code'], { unique: true })
@Index('idx_coupons_active', ['isActive', 'validFrom', 'validUntil'])
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'enum', enum: CouponScope, default: CouponScope.GLOBAL })
  scope: CouponScope;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // percentage or flat amount

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount: number; // cap for percentage coupons

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @Column({ type: 'uuid', nullable: true })
  scopeId: string; // categoryId, productId, or vendorId depending on scope

  @Column({ type: 'int', nullable: true })
  maxUsages: number; // null = unlimited

  @Column({ type: 'int', default: 0 })
  currentUsages: number;

  @Column({ type: 'int', default: 1 })
  maxUsagesPerUser: number;

  @Column({ type: 'timestamp' })
  validFrom: Date;

  @Column({ type: 'timestamp' })
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
