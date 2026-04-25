import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorStatus, KycStatus } from './entities/vendor.entity';
import { Order } from '../order/entities/order.entity';
import { RegisterVendorDto, UpdateVendorDto, SubmitKycDto } from './dto/vendor.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async register(userId: string, dto: RegisterVendorDto): Promise<Vendor> {
    const existing = await this.vendorRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Vendor profile already exists for this user');
    }

    const slug = this.generateSlug(dto.businessName);

    const vendor = this.vendorRepo.create({
      userId,
      businessName: dto.businessName,
      slug,
      description: dto.description,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      address: dto.address,
      status: VendorStatus.PENDING,
      kycStatus: KycStatus.NOT_SUBMITTED,
    });

    const saved = await this.vendorRepo.save(vendor);
    this.logger.log(`Vendor registered: ${saved.id} for user ${userId}`);
    return saved;
  }

  async getProfile(userId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }
    return vendor;
  }

  async getPublicProfile(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { id, status: VendorStatus.APPROVED, isActive: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async getBySlug(slug: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { slug, status: VendorStatus.APPROVED, isActive: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async update(userId: string, dto: UpdateVendorDto): Promise<Vendor> {
    let vendor = await this.vendorRepo.findOne({ where: { userId } });

    if (!vendor) {
      // Auto-create vendor profile (upsert)
      const businessName = dto.businessName || 'My Store';
      vendor = this.vendorRepo.create({
        userId,
        businessName,
        slug: this.generateSlug(businessName),
        phoneNumber: dto.phoneNumber || '',
        status: VendorStatus.PENDING,
        kycStatus: KycStatus.NOT_SUBMITTED,
      });
    }

    if (dto.businessName) {
      vendor.businessName = dto.businessName;
      vendor.slug = this.generateSlug(dto.businessName);
    }
    if (dto.description !== undefined) vendor.description = dto.description;
    if (dto.phoneNumber) vendor.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) vendor.email = dto.email;
    if (dto.address) vendor.address = dto.address;
    if (dto.bankDetails) vendor.bankDetails = dto.bankDetails;
    if (dto.businessHours) vendor.businessHours = dto.businessHours;

    return this.vendorRepo.save(vendor);
  }

  async submitKyc(userId: string, dto: SubmitKycDto): Promise<Vendor> {
    const vendor = await this.getProfile(userId);

    vendor.kycDocuments = {
      ...vendor.kycDocuments,
      ...dto,
    };
    vendor.kycStatus = KycStatus.SUBMITTED;

    const saved = await this.vendorRepo.save(vendor);
    this.logger.log(`KYC submitted for vendor ${vendor.id}`);
    return saved;
  }

  async approveVendor(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.status = VendorStatus.APPROVED;
    vendor.kycStatus = KycStatus.VERIFIED;

    const saved = await this.vendorRepo.save(vendor);
    this.logger.log(`Vendor ${vendorId} approved`);
    return saved;
  }

  async rejectVendor(vendorId: string, reason: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.status = VendorStatus.REJECTED;
    vendor.kycStatus = KycStatus.REJECTED;
    vendor.rejectionReason = reason;

    const saved = await this.vendorRepo.save(vendor);
    this.logger.log(`Vendor ${vendorId} rejected: ${reason}`);
    return saved;
  }

  async listVendors(
    pagination: PaginationDto,
    status?: VendorStatus,
  ): Promise<PaginatedResult<Vendor>> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [items, total] = await this.vendorRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getEarningsSummary(userId: string): Promise<{
    totalEarnings: number;
    totalOrders: number;
    averageRating: number;
    commissionRate: number;
  }> {
    const vendor = await this.getProfile(userId);
    return {
      totalEarnings: Number(vendor.totalEarnings),
      totalOrders: vendor.totalOrders,
      averageRating: Number(vendor.averageRating),
      commissionRate: Number(vendor.commissionRate),
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
  }

  async getVendorCustomers(userId: string): Promise<{
    userId: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
  }[]> {
    const vendor = await this.getProfile(userId);

    const customers = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.userId', 'userId')
      .addSelect("MAX((o.deliveryAddress->>'fullName')::text)", 'name')
      .addSelect('COUNT(o.id)::int', 'totalOrders')
      .addSelect('SUM(o.totalAmount)::numeric', 'totalSpent')
      .addSelect('MAX(o.createdAt)', 'lastOrderDate')
      .where('o.vendorId = :vendorId', { vendorId: vendor.id })
      .groupBy('o.userId')
      .orderBy('MAX(o.createdAt)', 'DESC')
      .getRawMany();

    return customers.map((c) => ({
      userId: c.userId,
      name: c.name || 'Unknown',
      email: '',
      totalOrders: Number(c.totalOrders),
      totalSpent: Number(c.totalSpent),
      lastOrderDate: c.lastOrderDate,
    }));
  }
}
