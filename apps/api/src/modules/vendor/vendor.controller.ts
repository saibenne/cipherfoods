import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorStatus } from './entities/vendor.entity';
import { RegisterVendorDto, UpdateVendorDto, SubmitKycDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@cipherfoods/shared';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Register as a vendor/farmer' })
  @ApiResponse({ status: 201, description: 'Vendor registered successfully' })
  register(@CurrentUser() user: JwtPayload, @Body() dto: RegisterVendorDto) {
    return this.vendorService.register(user.sub, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get current vendor profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.vendorService.getProfile(user.sub);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Update vendor profile' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateVendorDto) {
    return this.vendorService.update(user.sub, dto);
  }

  @Post('me/kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Submit KYC documents' })
  submitKyc(@CurrentUser() user: JwtPayload, @Body() dto: SubmitKycDto) {
    return this.vendorService.submitKyc(user.sub, dto);
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get vendor earnings summary' })
  getEarnings(@CurrentUser() user: JwtPayload) {
    return this.vendorService.getEarningsSummary(user.sub);
  }

  @Get('me/customers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get unique customers for current vendor' })
  getCustomers(@CurrentUser() user: JwtPayload) {
    return this.vendorService.getVendorCustomers(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public vendor profile' })
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.getPublicProfile(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get vendor by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.vendorService.getBySlug(slug);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve vendor (admin only)' })
  approveVendor(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.approveVendor(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject vendor (admin only)' })
  rejectVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.vendorService.rejectVendor(id, reason);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all vendors (admin only)' })
  @ApiQuery({ name: 'status', enum: VendorStatus, required: false })
  listVendors(
    @Query() pagination: PaginationDto,
    @Query('status') status?: VendorStatus,
  ) {
    return this.vendorService.listVendors(pagination, status);
  }
}
