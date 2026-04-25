import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  RESERVED = 'reserved',
  RELEASED = 'released',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
}

@Entity('stock_movements', { schema: 'inventory' })
@Index('idx_stock_movements_product', ['productId'])
@Index('idx_stock_movements_vendor', ['vendorId'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryItemId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  newStock: number;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  changedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
