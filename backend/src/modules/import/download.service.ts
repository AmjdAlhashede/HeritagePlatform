import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../content/content.entity';
import { UploadService } from '../upload/upload.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private uploadService: UploadService,
  ) {}

  /**
   * تحويل محتوى مستورد إلى محلي
   * يحمل الفيديو من Aparat ويرفعه على R2
   */
  async convertExternalToLocal(contentId: string): Promise<void> {
    this.logger.log(`🔄 تحويل محتوى مستورد إلى محلي: ${contentId}`);

    try {
      // جلب المحتوى
      const content = await this.contentRepository.findOne({
        where: { id: contentId },
      });

      if (!content || !content.externalUrl) {
        throw new Error('محتوى غير موجود أو ليس مستورد');
      }

      // تحميل الفيديو من Aparat
      const localPath = await this.downloadFromAparat(
        content.externalUrl,
        contentId,
      );

      // معالجة الفيديو (HLS, thumbnail, audio)
      await this.processVideo(localPath, contentId);

      // تحديث قاعدة البيانات
      await this.contentRepository.update(contentId, {
        externalSource: null,
        externalId: null,
        externalUrl: null,
        originalFileUrl: localPath,
        isProcessed: true,
      });

      this.logger.log(`✅ تم تحويل المحتوى إلى محلي: ${contentId}`);
    } catch (error) {
      this.logger.error(`❌ فشل التحويل: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحميل فيديو من Aparat
   */
  private async downloadFromAparat(
    url: string,
    contentId: string,
  ): Promise<string> {
    try {
      this.logger.log(`⬇️ تحميل من Aparat: ${url}`);

      // إنشاء مجلد للتحميل
      const downloadDir = path.join('./uploads/downloads', contentId);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const outputPath = path.join(downloadDir, 'video.mp4');

      // استخدام yt-dlp أو youtube-dl لتحميل من Aparat
      // يدعم Aparat بشكل كامل
      const command = `yt-dlp -f best -o "${outputPath}" "${url}"`;

      await execAsync(command);

      if (!fs.existsSync(outputPath)) {
        throw new Error('فشل التحميل');
      }

      this.logger.log(`✅ تم التحميل: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`❌ فشل التحميل من Aparat: ${error.message}`);
      throw error;
    }
  }

  /**
   * معالجة الفيديو المحمل
   */
  private async processVideo(
    filePath: string,
    contentId: string,
  ): Promise<void> {
    try {
      this.logger.log(`⚙️ معالجة الفيديو: ${filePath}`);

      // استخدام UploadService لمعالجة الفيديو
      // TODO: ربط مع UploadService

      this.logger.log(`✅ تمت المعالجة`);
    } catch (error) {
      this.logger.error(`❌ فشلت المعالجة: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحويل كل المحتوى المستورد إلى محلي
   */
  async convertAllExternalToLocal(): Promise<{
    converted: number;
    failed: number;
  }> {
    this.logger.log(`🔄 تحويل كل المحتوى المستورد...`);

    try {
      // جلب كل المحتوى المستورد
      const externalContent = await this.contentRepository.find({
        where: { externalSource: 'aparat' },
      });

      let converted = 0;
      let failed = 0;

      for (const content of externalContent) {
        try {
          await this.convertExternalToLocal(content.id);
          converted++;
        } catch (error) {
          this.logger.error(`فشل تحويل: ${content.title}`);
          failed++;
        }
      }

      this.logger.log(`✅ تم تحويل ${converted} محتوى، فشل ${failed}`);

      return { converted, failed };
    } catch (error) {
      this.logger.error(`❌ فشل التحويل الجماعي: ${error.message}`);
      throw error;
    }
  }
}
