import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_preferences', { schema: 'notification' })
@Index('idx_notif_prefs_user', ['userId'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  smsEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ default: true })
  orderUpdates: boolean;

  @Column({ default: true })
  paymentUpdates: boolean;

  @Column({ default: true })
  promotionalEmails: boolean;

  @Column({ default: true })
  vendorAlerts: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
