import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType, CouponScope } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiPropertyOptional({ enum: CouponScope, default: CouponScope.GLOBAL })
  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @ApiProperty({ description: 'Discount value (percentage or flat INR amount)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Maximum discount cap for percentage coupons' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount to apply coupon' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Scope target ID (category/product/vendor)' })
  @IsOptional()
  @IsUUID()
  scopeId?: string;

  @ApiPropertyOptional({ description: 'Max total usages (null = unlimited)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsages?: number;

  @ApiPropertyOptional({ description: 'Max usages per user', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsagesPerUser?: number;

  @ApiProperty({ description: 'Valid from date (ISO 8601)' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid until date (ISO 8601)' })
  @IsDateString()
  validUntil: string;
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Order subtotal to validate against' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  orderAmount: number;

  @ApiPropertyOptional({ description: 'Category ID for scope validation' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Vendor ID for scope validation' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
