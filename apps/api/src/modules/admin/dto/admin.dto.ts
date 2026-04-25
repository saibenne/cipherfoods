import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  key: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class SuspendUserDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class ChangeRoleDto {
  @ApiProperty()
  @IsString()
  role: string;
}

export class BroadcastNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  target: string; // 'all' | 'customers' | 'vendors'
}
