import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../entities/media.entity';

export class SignUploadDto {
  @ApiProperty({ enum: MediaType, description: 'Type of media being uploaded' })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ description: 'Custom folder within Cloudinary' })
  @IsOptional()
  @IsString()
  folder?: string;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'Cloudinary public ID' })
  @IsString()
  publicId: string;

  @ApiProperty({ description: 'Cloudinary URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Cloudinary secure URL' })
  @IsString()
  secureUrl: string;

  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  bytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt?: string;
}
