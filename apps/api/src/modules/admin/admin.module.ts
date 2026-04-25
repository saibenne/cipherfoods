import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { PublicConfigController } from './public-config.controller';
import { AdminService } from './admin.service';
import { PlatformConfig } from './entities/platform-config.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Order } from '../order/entities/order.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Notification } from '../notification/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConfig, AuditLog, Order, Vendor, Payment, Notification]),
  ],
  controllers: [AdminController, PublicConfigController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
