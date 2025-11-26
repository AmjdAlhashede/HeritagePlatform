import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  /**
   * استرجاع كل البيانات من R2 وإعادة بناء قاعدة البيانات
   */
  @Post('from-r2')
  async syncFromR2() {
    const result = await this.syncService.syncFromR2();
    return {
      success: true,
      ...result,
      message: 'تم استرجاع البيانات من R2 بنجاح',
    };
  }

  /**
   * التحقق من حالة المزامنة
   */
  @Get('status')
  async getSyncStatus() {
    const status = await this.syncService.getSyncStatus();
    return {
      success: true,
      ...status,
    };
  }

  /**
   * إعادة بناء metadata لكل المحتوى
   */
  @Post('rebuild-metadata')
  async rebuildMetadata() {
    const result = await this.syncService.rebuildMetadata();
    return {
      success: true,
      ...result,
      message: 'تم إعادة بناء metadata بنجاح',
    };
  }
}
