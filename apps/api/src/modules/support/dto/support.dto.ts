import { IsString, IsOptional, IsEnum, IsUUID, Length, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @Length(5, 200)
  subject: string;

  @ApiProperty({ enum: TicketCategory })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty()
  @IsString()
  @Length(10, 2000)
  message: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class ReplyTicketDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2000)
  message: string;
}

export class CreateFaqDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @Length(5, 300)
  question: string;

  @ApiProperty()
  @IsString()
  @Length(10, 5000)
  answer: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(2, 100)
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @Length(5, 300)
  question?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
