import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name — split into firstName/lastName if not provided separately' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsPhoneNumber('IN')
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alias for phoneNumber' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'customer', description: 'Role to assign: customer or vendor', enum: ['customer', 'vendor'] })
  @IsOptional()
  @IsString()
  @IsIn(['customer', 'vendor'])
  role?: 'customer' | 'vendor';
}
