import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole, OrderStatus } from '@cipherfoods/shared';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('keycloak')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart (auto-splits for multi-vendor)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.orderService.createFromCart(user.sub, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  getMyOrders(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.orderService.findByUser(user.sub, pagination);
  }

  @Get('vendor')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'Get orders for current vendor' })
  getVendorOrders(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.orderService.findByVendor(user.sub, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findById(id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  getByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findByOrderNumber(orderNumber);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update order status (vendor/admin)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: OrderStatus; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.updateStatus(id, body.status, user.sub, body.note);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.cancelOrder(id, user.sub, body.reason);
  }
}
