import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TicketMessage } from './ticket-message.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  ORDER_ISSUE = 'order_issue',
  PAYMENT_ISSUE = 'payment_issue',
  DELIVERY_ISSUE = 'delivery_issue',
  PRODUCT_QUALITY = 'product_quality',
  REFUND_REQUEST = 'refund_request',
  ACCOUNT_ISSUE = 'account_issue',
  GENERAL_QUERY = 'general_query',
}

@Entity('tickets', { schema: 'support' })
@Index('idx_tickets_user', ['userId'])
@Index('idx_tickets_status', ['status'])
@Index('idx_tickets_assigned', ['assignedTo'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  ticketNumber: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 200 })
  subject: string;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @OneToMany(() => TicketMessage, (msg) => msg.ticket, { cascade: true })
  messages: TicketMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
