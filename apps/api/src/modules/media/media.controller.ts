import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { MediaType } from './entities/media.entity';
import { SignUploadDto, ConfirmUploadDto } from './dto/media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('keycloak')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @ApiOperation({ summary: 'Generate Cloudinary signed upload parameters' })
  @ApiResponse({ status: 200, description: 'Signed upload parameters' })
  signUpload(@CurrentUser() user: JwtPayload, @Body() dto: SignUploadDto) {
    return this.mediaService.generateSignedUploadParams(user.sub, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm upload and store media metadata' })
  @ApiResponse({ status: 201, description: 'Media record created' })
  confirmUpload(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmUploadDto) {
    return this.mediaService.confirmUpload(user.sub, dto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a media asset' })
  deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('publicId') publicId: string,
  ) {
    return this.mediaService.deleteMedia(user.sub, decodeURIComponent(publicId));
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all media for current user' })
  getMyMedia(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: MediaType,
  ) {
    return this.mediaService.getMediaByOwner(user.sub, type);
  }

  @Get('transform/:publicId')
  @ApiOperation({ summary: 'Get transformed image URL' })
  getTransformation(
    @Param('publicId') publicId: string,
    @Query('preset') preset: string,
  ) {
    return {
      url: this.mediaService.getTransformationUrl(
        decodeURIComponent(publicId),
        preset,
      ),
    };
  }
}
