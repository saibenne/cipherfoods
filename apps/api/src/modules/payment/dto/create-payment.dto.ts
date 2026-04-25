import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@cipherfoods/shared';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to create payment for', format: 'uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
