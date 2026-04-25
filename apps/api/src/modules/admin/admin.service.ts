import {
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfig } from './entities/platform-config.entity';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { Order } from '../order/entities/order.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Notification, NotificationType, NotificationChannel } from '../notification/entities/notification.entity';
import { UpdateConfigDto, BroadcastNotificationDto } from './dto/admin.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  createdTimestamp: number;
  attributes?: Record<string, string[]>;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'banned';
  createdAt: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly keycloakBaseUrl: string;
  private readonly realm: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PlatformConfig)
    private readonly configRepo: Repository<PlatformConfig>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {
    this.keycloakBaseUrl = this.configService.getOrThrow<string>('KEYCLOAK_BASE_URL');
    this.realm = this.configService.getOrThrow<string>('KEYCLOAK_REALM');
  }

  private get adminUrl(): string {
    return `${this.keycloakBaseUrl}/admin/realms/${this.realm}`;
  }

  private async getAdminToken(): Promise<string> {
    const adminUser = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_USER');
    const adminPassword = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_PASSWORD');

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: adminUser,
      password: adminPassword,
    });

    const response = await fetch(
      `${this.keycloakBaseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      throw new HttpException('Failed to obtain admin token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async getDashboard(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalVendors: number;
    pendingVendors: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, totalVendors, pendingVendors, todayOrders] = await Promise.all([
      this.orderRepo.count({ where: { parentOrderId: undefined as any } }),
      this.vendorRepo.count(),
      this.vendorRepo.count({ where: { status: 'pending' as any } }),
      this.orderRepo
        .createQueryBuilder('o')
        .where('o.createdAt >= :today', { today })
        .andWhere('o.parentOrderId IS NULL')
        .getCount(),
    ]);

    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: 'captured' })
      .getRawOne();

    const todayRevenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: 'captured' })
      .andWhere('p.createdAt >= :today', { today })
      .getRawOne();

    return {
      totalOrders,
      totalRevenue: Number(revenueResult?.total || 0),
      totalVendors,
      pendingVendors,
      todayOrders,
      todayRevenue: Number(todayRevenueResult?.total || 0),
    };
  }

  async listOrders(
    pagination: PaginationDto,
    status?: string,
  ): Promise<PaginatedResult<Order>> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.parentOrderId IS NULL');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy('order.createdAt', 'DESC');

    const [items, total] = await qb
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getConfig(): Promise<PlatformConfig[]> {
    return this.configRepo.find({ order: { key: 'ASC' } });
  }

  async updateConfig(
    dto: UpdateConfigDto,
    adminId: string,
  ): Promise<PlatformConfig> {
    let config = await this.configRepo.findOne({ where: { key: dto.key } });

    if (!config) {
      config = this.configRepo.create({
        key: dto.key,
        value: dto.value,
        description: dto.description,
        updatedBy: adminId,
      });
    } else {
      config.value = dto.value;
      if (dto.description) config.description = dto.description;
      config.updatedBy = adminId;
    }

    const saved = await this.configRepo.save(config);

    await this.logAudit(adminId, AuditAction.CONFIG_UPDATED, config.id, 'platform_config', {
      key: dto.key,
      value: dto.value,
    });

    return saved;
  }

  async getAuditLogs(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const [items, total] = await this.auditRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async logAudit(
    adminId: string,
    action: AuditAction,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    const log = this.auditRepo.create({
      adminId,
      action,
      targetId,
      targetType,
      metadata,
    });
    return this.auditRepo.save(log);
  }

  // --- User Management (Keycloak) ---

  private mapKeycloakUser(kcUser: KeycloakUser, roles: string[]): ManagedUser {
    const appRoles = roles.filter((r) => ['admin', 'vendor', 'customer'].includes(r));
    const role = appRoles[0] || 'customer';
    const name = [kcUser.firstName, kcUser.lastName].filter(Boolean).join(' ') || kcUser.username;

    return {
      id: kcUser.id,
      name,
      email: kcUser.email,
      role,
      status: kcUser.enabled ? 'active' : 'banned',
      createdAt: new Date(kcUser.createdTimestamp).toISOString(),
    };
  }

  async listUsers(
    pagination: PaginationDto,
    search?: string,
    role?: string,
    status?: string,
  ): Promise<{ items: ManagedUser[]; total: number }> {
    try {
      const token = await this.getAdminToken();
      const params = new URLSearchParams({
        first: String(pagination.skip),
        max: String(pagination.limit),
      });
      if (search) params.set('search', search);

      const [usersRes, countRes] = await Promise.all([
        fetch(`${this.adminUrl}/users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${this.adminUrl}/users/count${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok) {
        throw new HttpException('Failed to fetch users from Keycloak', HttpStatus.BAD_GATEWAY);
      }

      const kcUsers = (await usersRes.json()) as KeycloakUser[];
      const total: number = countRes.ok ? ((await countRes.json()) as number) : kcUsers.length;

      // Fetch roles for each user
      const items: ManagedUser[] = await Promise.all(
        kcUsers.map(async (kcUser) => {
          const rolesRes = await fetch(
            `${this.adminUrl}/users/${encodeURIComponent(kcUser.id)}/role-mappings/realm`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const roles: string[] = rolesRes.ok
            ? ((await rolesRes.json()) as { name: string }[]).map((r) => r.name)
            : [];
          return this.mapKeycloakUser(kcUser, roles);
        }),
      );

      // Client-side filters for role/status (Keycloak doesn't natively filter by role)
      let filtered = items;
      if (role) filtered = filtered.filter((u) => u.role === role);
      if (status) filtered = filtered.filter((u) => u.status === status);

      return { items: filtered, total };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('listUsers failed', err);
      throw new HttpException('Failed to list users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserById(id: string): Promise<ManagedUser> {
    try {
      const token = await this.getAdminToken();

      const [userRes, rolesRes] = await Promise.all([
        fetch(`${this.adminUrl}/users/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${this.adminUrl}/users/${encodeURIComponent(id)}/role-mappings/realm`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!userRes.ok) {
        throw new NotFoundException('User not found');
      }

      const kcUser = (await userRes.json()) as KeycloakUser;
      const roles: string[] = rolesRes.ok
        ? ((await rolesRes.json()) as { name: string }[]).map((r) => r.name)
        : [];

      return this.mapKeycloakUser(kcUser, roles);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('getUserById failed', err);
      throw new HttpException('Failed to fetch user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async banUser(id: string, adminId: string): Promise<{ message: string }> {
    try {
      const token = await this.getAdminToken();

      const res = await fetch(`${this.adminUrl}/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: false }),
      });

      if (!res.ok) {
        throw new HttpException('Failed to ban user', HttpStatus.BAD_GATEWAY);
      }

      await this.logAudit(adminId, AuditAction.USER_SUSPENDED, id, 'user', { action: 'ban' });
      return { message: 'User banned successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('banUser failed', err);
      throw new HttpException('Failed to ban user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async unbanUser(id: string, adminId: string): Promise<{ message: string }> {
    try {
      const token = await this.getAdminToken();

      const res = await fetch(`${this.adminUrl}/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: true }),
      });

      if (!res.ok) {
        throw new HttpException('Failed to unban user', HttpStatus.BAD_GATEWAY);
      }

      await this.logAudit(adminId, AuditAction.USER_REINSTATED, id, 'user', { action: 'unban' });
      return { message: 'User unbanned successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('unbanUser failed', err);
      throw new HttpException('Failed to unban user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async changeUserRole(
    id: string,
    newRole: string,
    adminId: string,
  ): Promise<{ message: string }> {
    try {
      const token = await this.getAdminToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Get current realm role mappings
      const currentMappingsRes = await fetch(
        `${this.adminUrl}/users/${encodeURIComponent(id)}/role-mappings/realm`,
        { headers },
      );
      const currentRoles = currentMappingsRes.ok
        ? ((await currentMappingsRes.json()) as { id: string; name: string }[])
        : [];

      // 2. Remove existing app roles
      const appRoleNames = ['admin', 'vendor', 'customer'];
      const rolesToRemove = currentRoles.filter((r) => appRoleNames.includes(r.name));
      if (rolesToRemove.length > 0) {
        await fetch(
          `${this.adminUrl}/users/${encodeURIComponent(id)}/role-mappings/realm`,
          {
            method: 'DELETE',
            headers,
            body: JSON.stringify(rolesToRemove),
          },
        );
      }

      // 3. Fetch the new role definition
      const roleDefRes = await fetch(`${this.adminUrl}/roles/${encodeURIComponent(newRole)}`, {
        headers,
      });
      if (!roleDefRes.ok) {
        throw new HttpException(`Role '${newRole}' not found in Keycloak`, HttpStatus.BAD_REQUEST);
      }
      const roleDef = await roleDefRes.json();

      // 4. Assign new role
      await fetch(
        `${this.adminUrl}/users/${encodeURIComponent(id)}/role-mappings/realm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify([roleDef]),
        },
      );

      await this.logAudit(adminId, AuditAction.ROLE_CHANGED, id, 'user', { newRole });
      return { message: `Role changed to ${newRole}` };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('changeUserRole failed', err);
      throw new HttpException('Failed to change user role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- Broadcast Notification ---

  async broadcastNotification(
    dto: BroadcastNotificationDto,
    adminId: string,
  ): Promise<{ message: string; count: number }> {
    try {
      const token = await this.getAdminToken();

      // Determine target users
      let targetRole: string | undefined;
      if (dto.target === 'customers') targetRole = 'customer';
      else if (dto.target === 'vendors') targetRole = 'vendor';

      // Fetch users from Keycloak (limited batch)
      const usersRes = await fetch(
        `${this.adminUrl}/users?max=500`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!usersRes.ok) {
        throw new HttpException('Failed to fetch users for broadcast', HttpStatus.BAD_GATEWAY);
      }

      let kcUsers = (await usersRes.json()) as KeycloakUser[];

      // Filter by role if needed
      if (targetRole) {
        const filteredUsers: KeycloakUser[] = [];
        for (const u of kcUsers) {
          const rolesRes = await fetch(
            `${this.adminUrl}/users/${encodeURIComponent(u.id)}/role-mappings/realm`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (rolesRes.ok) {
            const roles = (await rolesRes.json()) as { name: string }[];
            if (roles.some((r) => r.name === targetRole)) {
              filteredUsers.push(u);
            }
          }
        }
        kcUsers = filteredUsers;
      }

      // Create in-app notifications
      const notifications = kcUsers.map((u) =>
        this.notificationRepo.create({
          userId: u.id,
          type: NotificationType.GENERAL,
          title: dto.title,
          body: dto.message,
          channel: NotificationChannel.IN_APP,
        }),
      );

      await this.notificationRepo.save(notifications);

      await this.logAudit(adminId, AuditAction.CONFIG_UPDATED, undefined, 'notification', {
        action: 'broadcast',
        target: dto.target,
        count: notifications.length,
      });

      return { message: 'Broadcast sent', count: notifications.length };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('broadcastNotification failed', err);
      throw new HttpException('Failed to broadcast notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
