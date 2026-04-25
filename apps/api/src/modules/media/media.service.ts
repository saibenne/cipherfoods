import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { Media, MediaType } from './entities/media.entity';
import { SignUploadDto, ConfirmUploadDto } from './dto/media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async generateSignedUploadParams(
    ownerId: string,
    dto: SignUploadDto,
  ): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    uploadPreset?: string;
  }> {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = dto.folder || this.getFolderForType(dto.type);
    const isPrivate = dto.type === MediaType.KYC_DOCUMENT;

    const params: Record<string, unknown> = {
      timestamp,
      folder,
      ...(isPrivate ? { type: 'private' } : {}),
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      this.configService.get<string>('CLOUDINARY_API_SECRET', ''),
    );

    return {
      signature,
      timestamp,
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME', ''),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY', ''),
      folder,
    };
  }

  async confirmUpload(ownerId: string, dto: ConfirmUploadDto): Promise<Media> {
    const isPrivate = dto.type === MediaType.KYC_DOCUMENT;

    const media = this.mediaRepo.create({
      ownerId,
      publicId: dto.publicId,
      url: dto.url,
      secureUrl: dto.secureUrl,
      type: dto.type,
      format: dto.format,
      width: dto.width,
      height: dto.height,
      bytes: dto.bytes,
      alt: dto.alt,
      isPrivate,
    });

    const saved = await this.mediaRepo.save(media);
    this.logger.log(`Media confirmed: ${dto.publicId} for owner ${ownerId}`);
    return saved;
  }

  async deleteMedia(ownerId: string, publicId: string): Promise<void> {
    const media = await this.mediaRepo.findOne({
      where: { publicId, ownerId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    try {
      await cloudinary.uploader.destroy(publicId, {
        type: media.isPrivate ? 'private' : 'upload',
      });
    } catch (error) {
      this.logger.error(`Failed to delete from Cloudinary: ${publicId}`, error);
      throw new InternalServerErrorException('Failed to delete media');
    }

    await this.mediaRepo.remove(media);
    this.logger.log(`Media deleted: ${publicId}`);
  }

  async getMediaByOwner(ownerId: string, type?: MediaType): Promise<Media[]> {
    const where: Record<string, unknown> = { ownerId };
    if (type) where.type = type;

    return this.mediaRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  getTransformationUrl(publicId: string, preset: string): string {
    const presets: Record<string, Record<string, unknown>> = {
      product_thumbnail: { width: 300, height: 300, crop: 'fill', quality: 'auto', format: 'webp' },
      product_detail: { width: 800, height: 800, crop: 'limit', quality: 'auto', format: 'webp' },
      vendor_avatar: { width: 200, height: 200, crop: 'fill', quality: 'auto', format: 'webp' },
      category_banner: { width: 1200, height: 400, crop: 'fill', quality: 'auto', format: 'webp' },
    };

    const transformation = presets[preset];
    if (!transformation) {
      return cloudinary.url(publicId, { secure: true });
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [transformation],
    });
  }

  private getFolderForType(type: MediaType): string {
    const folders: Record<string, string> = {
      [MediaType.PRODUCT_IMAGE]: 'cipherfoods/products',
      [MediaType.CATEGORY_BANNER]: 'cipherfoods/categories',
      [MediaType.VENDOR_AVATAR]: 'cipherfoods/vendors/avatars',
      [MediaType.VENDOR_BANNER]: 'cipherfoods/vendors/banners',
      [MediaType.REVIEW_IMAGE]: 'cipherfoods/reviews',
      [MediaType.KYC_DOCUMENT]: 'cipherfoods/kyc',
    };
    return folders[type] || 'cipherfoods/misc';
  }
}
