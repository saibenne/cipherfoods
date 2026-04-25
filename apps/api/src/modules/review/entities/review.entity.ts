import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('reviews', { schema: 'review' })
@Index('idx_reviews_product', ['productId'])
@Index('idx_reviews_user', ['userId'])
@Index('idx_reviews_vendor', ['vendorId'])
@Index('idx_reviews_user_product', ['userId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', nullable: true })
  images: { url: string; publicId: string }[];

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ type: 'text', nullable: true })
  vendorReply: string;

  @Column({ type: 'timestamp', nullable: true })
  vendorReplyAt: Date;

  @Column({ default: 0 })
  helpfulCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
