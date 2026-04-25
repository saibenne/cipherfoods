import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsEmail,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VendorAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  village?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pincode: string;
}

export class BankDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;
}

export class RegisterVendorDto {
  @ApiProperty({ description: 'Business/farm name' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ description: 'Business description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Business email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: VendorAddressDto })
  @ValidateNested()
  @Type(() => VendorAddressDto)
  address: VendorAddressDto;
}

export class UpdateVendorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: VendorAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorAddressDto)
  address?: VendorAddressDto;

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  businessHours?: Record<string, { open: string; close: string }>;
}

export class SubmitKycDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aadhaarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fssaiUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankPassbookUrl?: string;
}
