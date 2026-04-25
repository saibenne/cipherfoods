import { IsUUID, IsOptional, IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundDto {
  @ApiProperty({ description: 'Payment ID to refund', format: 'uuid' })
  @IsUUID()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Partial refund amount. Omit for full refund.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount?: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
