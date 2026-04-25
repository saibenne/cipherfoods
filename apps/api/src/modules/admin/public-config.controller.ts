import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';


// Trigger watcher
@ApiTags('Public Config')
@Controller('public-config')
export class PublicConfigController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get public platform configuration' })
  async getPublicConfig() {
    const config = await this.adminService.getConfig();
    const publicKeys = ['platformName', 'supportEmail', 'supportPhone', 'heroVideoUrl', 'homeSlideshow'];
    const publicConfig: Record<string, string> = {};
    for (const item of config) {
      if (publicKeys.includes(item.key)) {
        publicConfig[item.key] = item.value;
      }
    }
    return publicConfig;
  }
}
