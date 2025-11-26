import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * جلب كل الإعدادات
   */
  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return {
      success: true,
      ...settings,
    };
  }

  /**
   * حفظ إعدادات Neon
   */
  @Post('neon')
  async saveNeonSettings(@Body() body: { databaseUrl: string }) {
    await this.settingsService.saveNeonSettings(body.databaseUrl);
    return {
      success: true,
      message: 'تم حفظ إعدادات Neon بنجاح',
    };
  }

  /**
   * حفظ إعدادات R2
   */
  @Post('r2')
  async saveR2Settings(
    @Body()
    body: {
      endpoint: string;
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucketName: string;
      publicUrl?: string;
    },
  ) {
    await this.settingsService.saveR2Settings(body);
    return {
      success: true,
      message: 'تم حفظ إعدادات R2 بنجاح',
    };
  }

  /**
   * اختبار الاتصال بـ Neon
   */
  @Post('test-neon')
  async testNeonConnection() {
    const result = await this.settingsService.testNeonConnection();
    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * اختبار الاتصال بـ R2
   */
  @Post('test-r2')
  async testR2Connection() {
    const result = await this.settingsService.testR2Connection();
    return {
      success: result.success,
      message: result.message,
    };
  }
}
