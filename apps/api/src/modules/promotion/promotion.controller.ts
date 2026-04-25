import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@cipherfoods/shared';
import { CreateCouponDto, ValidateCouponDto } from './dto/promotion.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create coupon (admin)' })
  createCoupon(
    @Body() dto: CreateCouponDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.promotionService.createCoupon(dto, userId);
  }

  @Get('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons (admin)' })
  listCoupons(@Query() pagination: PaginationDto) {
    return this.promotionService.listCoupons(pagination);
  }

  @Post('coupons/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon at checkout' })
  validateCoupon(
    @Body() dto: ValidateCouponDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.promotionService.validateCoupon(userId, dto);
  }

  @Put('coupons/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate coupon (admin)' })
  deactivateCoupon(@Param('id') id: string) {
    return this.promotionService.deactivateCoupon(id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Active promotions for storefront' })
  getActivePromotions() {
    return this.promotionService.getActivePromotions();
  }
}
