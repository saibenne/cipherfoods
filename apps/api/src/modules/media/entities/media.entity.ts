import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MediaType {
  PRODUCT_IMAGE = 'product_image',
  CATEGORY_BANNER = 'category_banner',
  VENDOR_AVATAR = 'vendor_avatar',
  VENDOR_BANNER = 'vendor_banner',
  REVIEW_IMAGE = 'review_image',
  KYC_DOCUMENT = 'kyc_document',
}

@Entity('media', { schema: 'media' })
@Index('idx_media_owner', ['ownerId'])
@Index('idx_media_public_id', ['publicId'], { unique: true })
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ unique: true })
  publicId: string;

  @Column()
  url: string;

  @Column()
  secureUrl: string;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @Column({ nullable: true })
  format: string;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'int', nullable: true })
  bytes: number;

  @Column({ nullable: true })
  alt: string;

  @Column({ default: false })
  isPrivate: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
