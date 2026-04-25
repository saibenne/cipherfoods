import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { UpdateStockDto, ReserveStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@cipherfoods/shared';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'List all inventory items for current vendor' })
  findAllByVendor(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventoryService.findAllByVendor(user.sub, pagination);
  }

  @Get(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get stock levels for a product' })
  getStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryService.getStock(productId, variantId);
  }

  @Put(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'Update stock for a product (vendor only)' })
  updateStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateStockDto,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryService.updateStock(productId, user.sub, dto, variantId, user.sub);
  }

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Reserve stock for an order' })
  reserveStock(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReserveStockDto,
  ) {
    return this.inventoryService.reserveStock(dto, user.sub);
  }

  @Get('low-stock/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'List low-stock items for current vendor' })
  getLowStockItems(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventoryService.getLowStockItems(user.sub, pagination);
  }

  @Get('expiring/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.VENDOR, UserRole.VENDOR_VERIFIED)
  @ApiOperation({ summary: 'List items expiring soon' })
  @ApiQuery({ name: 'days', required: false, description: 'Days ahead to check (default: 7)' })
  getExpiringItems(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: number,
  ) {
    return this.inventoryService.getExpiringItems(user.sub, days);
  }

  @Get(':productId/movements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get stock movement history for a product' })
  getStockMovements(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventoryService.getStockMovements(productId, pagination);
  }
}
