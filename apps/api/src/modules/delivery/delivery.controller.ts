import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto, EstimateDeliveryDto } from './dto/delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@cipherfoods/shared';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create delivery task for an order' })
  @ApiResponse({ status: 201, description: 'Delivery task created' })
  createDelivery(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.deliveryService.createDeliveryTask(dto, user.sub);
  }

  @Get('vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'List deliveries for current vendor' })
  getVendorDeliveries(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.deliveryService.getVendorDeliveries(user.sub, pagination);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get delivery tracking for an order' })
  getDeliveryByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getDeliveryByOrderId(orderId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Delivery partner webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() body: Record<string, unknown>) {
    await this.deliveryService.handleWebhook(body);
    return { status: 'ok' };
  }

  @Post('estimate')
  @ApiOperation({ summary: 'Estimate delivery cost and time' })
  @ApiResponse({ status: 200, description: 'Delivery estimate' })
  estimateDelivery(@Body() dto: EstimateDeliveryDto) {
    return this.deliveryService.estimateDelivery(dto);
  }
}
