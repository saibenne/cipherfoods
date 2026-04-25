import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  VENDOR_APPROVED = 'vendor_approved',
  VENDOR_REJECTED = 'vendor_rejected',
  VENDOR_SUSPENDED = 'vendor_suspended',
  USER_SUSPENDED = 'user_suspended',
  USER_REINSTATED = 'user_reinstated',
  ROLE_CHANGED = 'role_changed',
  CONFIG_UPDATED = 'config_updated',
  COUPON_CREATED = 'coupon_created',
  COUPON_DEACTIVATED = 'coupon_deactivated',
  ORDER_CANCELLED = 'order_cancelled',
  REFUND_INITIATED = 'refund_initiated',
}

@Entity('audit_logs', { schema: 'admin' })
@Index('idx_audit_admin', ['adminId'])
@Index('idx_audit_action', ['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'uuid', nullable: true })
  targetId: string;

  @Column({ length: 100, nullable: true })
  targetType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
