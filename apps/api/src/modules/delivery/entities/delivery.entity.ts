import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum DeliveryProvider {
  DUNZO = 'dunzo',
  PORTER = 'porter',
  SELF = 'self',
}

@Entity('deliveries', { schema: 'delivery' })
@Index('idx_deliveries_order', ['orderId'], { unique: true })
@Index('idx_deliveries_status', ['status'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  orderId: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ type: 'enum', enum: DeliveryProvider })
  provider: DeliveryProvider;

  @Column({ nullable: true })
  externalTaskId: string;

  @Column({ nullable: true })
  trackingUrl: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Column({ type: 'jsonb' })
  pickupAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
    contactName: string;
    contactPhone: string;
  };

  @Column({ type: 'jsonb' })
  dropAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
    contactName: string;
    contactPhone: string;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDistance: number;

  @Column({ nullable: true })
  estimatedDuration: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  driverPhone: string;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
