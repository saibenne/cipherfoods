import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, VendorReplyDto } from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@cipherfoods/shared';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Create a product review (verified purchasers)' })
  @ApiResponse({ status: 201, description: 'Review created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(user.sub, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewService.getProductReviews(productId, pagination);
  }

  @Get('vendor/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'Get reviews for current vendor' })
  getMyVendorReviews(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewService.getVendorReviews(user.sub, pagination);
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get reviews for a vendor' })
  getVendorReviews(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewService.getVendorReviews(vendorId, pagination);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Update own review' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Delete own review' })
  delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.delete(user.sub, id);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'Vendor reply to a review' })
  addVendorReply(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VendorReplyDto,
  ) {
    return this.reviewService.addVendorReply(user.sub, id, dto);
  }

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Flag a review for moderation' })
  flagReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.flagReview(id);
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Mark review as helpful' })
  markHelpful(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.markHelpful(id);
  }

  @Get('moderation/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending moderation reviews (admin)' })
  getPendingModeration(@Query() pagination: PaginationDto) {
    return this.reviewService.getPendingModeration(pagination);
  }

  @Put(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Moderate a review (admin)' })
  moderateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('visible') visible: boolean,
  ) {
    return this.reviewService.moderateReview(id, visible);
  }
}
