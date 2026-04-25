import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@cipherfoods/shared';
import { UpdateConfigDto, ChangeRoleDto, BroadcastNotificationDto } from './dto/admin.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard metrics' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('orders')
  @ApiOperation({ summary: 'All platform orders' })
  @ApiQuery({ name: 'status', required: false })
  listOrders(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.adminService.listOrders(pagination, status);
  }

  @Get('config')
  @ApiOperation({ summary: 'Platform configuration' })
  getConfig() {
    return this.adminService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  updateConfig(
    @Body() dto: UpdateConfigDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateConfig(dto, adminId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Admin audit logs' })
  getAuditLogs(@Query() pagination: PaginationDto) {
    return this.adminService.getAuditLogs(pagination);
  }

  // --- User Management ---

  @Get('users')
  @ApiOperation({ summary: 'List users from Keycloak' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  listUsers(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers(pagination, search, role, status);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail from Keycloak' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/ban')
  @ApiOperation({ summary: 'Ban (disable) a user in Keycloak' })
  banUser(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.banUser(id, adminId);
  }

  @Put('users/:id/unban')
  @ApiOperation({ summary: 'Unban (enable) a user in Keycloak' })
  unbanUser(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.unbanUser(id, adminId);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Change user role in Keycloak' })
  changeUserRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.changeUserRole(id, dto.role, adminId);
  }

  // --- Notifications ---

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to users' })
  broadcastNotification(
    @Body() dto: BroadcastNotificationDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.broadcastNotification(dto, adminId);
  }
}
