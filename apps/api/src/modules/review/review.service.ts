import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto, UpdateReviewDto, VendorReplyDto } from './dto/review.dto';
import { Order } from '../order/entities/order.entity';
import { Product } from '../catalog/entities/product.entity';
import { OrderStatus } from '@cipherfoods/shared';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check if user already reviewed this product
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Verify purchase
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    const isVerified = !!order?.items?.some(
      (item) => item.productId === dto.productId,
    );

    if (!order) {
      throw new BadRequestException('You can only review products from delivered orders');
    }

    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = this.reviewRepo.create({
      userId,
      productId: dto.productId,
      vendorId: product.vendorId,
      orderId: dto.orderId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      images: dto.images,
      isVerifiedPurchase: isVerified,
    });

    const saved = await this.reviewRepo.save(review);

    // Update product average rating
    await this.updateProductRating(dto.productId);

    this.logger.log(`Review created by ${userId} for product ${dto.productId}`);
    return saved;
  }

  async getProductReviews(
    productId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Review>> {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { productId, isVisible: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getVendorReviews(
    vendorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Review>> {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { vendorId, isVisible: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId, userId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.images !== undefined) review.images = dto.images;

    const saved = await this.reviewRepo.save(review);

    if (dto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return saved;
  }

  async delete(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId, userId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const productId = review.productId;
    await this.reviewRepo.remove(review);
    await this.updateProductRating(productId);
  }

  async addVendorReply(
    vendorId: string,
    reviewId: string,
    dto: VendorReplyDto,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, vendorId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.vendorReply = dto.reply;
    review.vendorReplyAt = new Date();

    return this.reviewRepo.save(review);
  }

  async flagReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isFlagged = true;
    return this.reviewRepo.save(review);
  }

  async getPendingModeration(pagination: PaginationDto): Promise<PaginatedResult<Review>> {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { isFlagged: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async moderateReview(reviewId: string, visible: boolean): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = visible;
    review.isFlagged = false;
    const saved = await this.reviewRepo.save(review);

    await this.updateProductRating(review.productId);
    return saved;
  }

  async markHelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.helpfulCount += 1;
    return this.reviewRepo.save(review);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId })
      .andWhere('review.isVisible = true')
      .getRawOne();

    await this.productRepo.update(productId, {
      averageRating: result?.avg ? parseFloat(result.avg) : 0,
      reviewCount: parseInt(result?.count || '0', 10),
    });
  }
}
