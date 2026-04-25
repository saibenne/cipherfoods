import { IsInt, IsOptional, IsString, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({ description: 'New stock quantity' })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Low stock alert threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Reason for stock update' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReserveStockDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant ID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ description: 'Quantity to reserve' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order ID for the reservation' })
  @IsUUID()
  orderId: string;
}
