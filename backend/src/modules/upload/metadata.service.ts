import { Injectable, Logger } from '@nestjs/common';
import { CloudStorageService } from './cloud-storage.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface PerformerMetadata {
  id: string;
  hash: string;
  name: string;
  bio?: string;
  location?: string;
  birthDate?: string;
  deathDate?: string;
  joinedAnsarallahDate?: string;
  isDeceased: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentMetadata {
  id: string;
  hash: string;
  title: string;
  description?: string;
  performerHash: string;
  performerName: string;
  type: 'video' | 'audio';
  duration: number;
  fileSize: number;
  originalDate?: string;
  categories: string[];
  thumbnailUrl: string;
  hlsUrl: string;
  audioUrl: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private cloudStorageService: CloudStorageService) {}

  /**
   * توليد hash فريد من اسم الملف أو المحتوى
   */
  generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  /**
   * توليد hash للمؤدي من اسمه
   */
  generatePerformerHash(name: string): string {
    return this.generateHash(`performer:${name.trim().toLowerCase()}`);
  }

  /**
   * توليد hash للمحتوى من اسم الملف
   */
  generateContentHash(filename: string, performerHash: string): string {
    return this.generateHash(`content:${filename}:${performerHash}`);
  }

  /**
   * حفظ metadata المؤدي في R2
   */
  async savePerformerMetadata(performer: PerformerMetadata): Promise<void> {
    if (!this.cloudStorageService.isEnabled()) {
      this.logger.warn('R2 not enabled, skipping metadata save');
      return;
    }

    try {
      const metadataPath = `performers/${performer.hash}/metadata.json`;
      const tempFile = path.join('./uploads/temp', `${performer.hash}-metadata.json`);

      // إنشاء مجلد temp إذا لم يكن موجود
      if (!fs.existsSync('./uploads/temp')) {
        fs.mkdirSync('./uploads/temp', { recursive: true });
      }

      // كتابة الملف محلياً
      fs.writeFileSync(tempFile, JSON.stringify(performer, null, 2));

      // رفع لـ R2
      await this.cloudStorageService.uploadFile(tempFile, metadataPath, 'application/json');

      // حذف الملف المؤقت
      fs.unlinkSync(tempFile);

      this.logger.log(`✅ Performer metadata saved: ${performer.name} (${performer.hash})`);
    } catch (error) {
      this.logger.error(`Failed to save performer metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * حفظ metadata المحتوى في R2
   */
  async saveContentMetadata(content: ContentMetadata): Promise<void> {
    if (!this.cloudStorageService.isEnabled()) {
      this.logger.warn('R2 not enabled, skipping metadata save');
      return;
    }

    try {
      // استخدام ID بدلاً من hash لنفس المجلد
      const metadataPath = `content/${content.id}/metadata.json`;
      const tempFile = path.join('./uploads/temp', `${content.id}-metadata.json`);

      // إنشاء مجلد temp إذا لم يكن موجود
      if (!fs.existsSync('./uploads/temp')) {
        fs.mkdirSync('./uploads/temp', { recursive: true });
      }

      // كتابة الملف محلياً
      fs.writeFileSync(tempFile, JSON.stringify(content, null, 2));

      // رفع لـ R2 في نفس مجلد الفيديو
      await this.cloudStorageService.uploadFile(tempFile, metadataPath, 'application/json');

      // حذف الملف المؤقت
      fs.unlinkSync(tempFile);

      this.logger.log(`✅ Content metadata saved: ${content.title} (${content.id})`);
    } catch (error) {
      this.logger.error(`Failed to save content metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * قراءة metadata المؤدي من R2
   */
  async getPerformerMetadata(hash: string): Promise<PerformerMetadata | null> {
    if (!this.cloudStorageService.isEnabled()) {
      return null;
    }

    try {
      const metadataPath = `performers/${hash}/metadata.json`;
      
      // تحميل الملف من R2
      const publicUrl = this.cloudStorageService.getPublicUrl(metadataPath);
      const response = await fetch(publicUrl);
      
      if (!response.ok) {
        return null;
      }

      const metadata = await response.json();
      this.logger.log(`✅ قراءة metadata للمؤدي: ${metadata.name}`);
      
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to read performer metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * قراءة metadata المحتوى من R2
   */
  async getContentMetadata(hash: string): Promise<ContentMetadata | null> {
    if (!this.cloudStorageService.isEnabled()) {
      return null;
    }

    try {
      const metadataPath = `content/${hash}/metadata.json`;
      
      // تحميل الملف من R2
      const publicUrl = this.cloudStorageService.getPublicUrl(metadataPath);
      const response = await fetch(publicUrl);
      
      if (!response.ok) {
        return null;
      }

      const metadata = await response.json();
      this.logger.log(`✅ قراءة metadata للمحتوى: ${metadata.title}`);
      
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to read content metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * قراءة قائمة كل المجلدات في R2
   */
  async listR2Folders(prefix: string): Promise<string[]> {
    if (!this.cloudStorageService.isEnabled()) {
      return [];
    }

    try {
      // استخدام AWS SDK لقراءة المجلدات
      const folders = await this.cloudStorageService.listFolders(prefix);
      return folders;
    } catch (error) {
      this.logger.error(`Failed to list R2 folders: ${error.message}`);
      return [];
    }
  }

  /**
   * مزامنة قاعدة البيانات من R2
   * يقرأ كل metadata من R2 ويحدث Neon
   */
  async syncFromR2(): Promise<{ performers: number; content: number }> {
    if (!this.cloudStorageService.isEnabled()) {
      throw new Error('R2 not enabled');
    }

    this.logger.log('🔄 بدء استرجاع كل البيانات من R2...');

    try {
      let performersCount = 0;
      let contentCount = 0;

      // 1. قراءة كل المؤدين من R2
      this.logger.log('📂 قراءة المؤدين من R2...');
      const performerFolders = await this.listR2Folders('performers/');
      
      for (const folder of performerFolders) {
        const hash = folder.replace('performers/', '').replace('/', '');
        const metadata = await this.getPerformerMetadata(hash);
        
        if (metadata) {
          // حفظ في قاعدة البيانات (سيتم في SyncService)
          performersCount++;
        }
      }

      // 2. قراءة كل المحتوى من R2
      this.logger.log('📂 قراءة المحتوى من R2...');
      const contentFolders = await this.listR2Folders('content/');
      
      for (const folder of contentFolders) {
        const hash = folder.replace('content/', '').replace('/', '');
        const metadata = await this.getContentMetadata(hash);
        
        if (metadata) {
          // حفظ في قاعدة البيانات (سيتم في SyncService)
          contentCount++;
        }
      }

      this.logger.log(`✅ تم قراءة ${performersCount} مؤدي و ${contentCount} محتوى من R2`);

      return { performers: performersCount, content: contentCount };
    } catch (error) {
      this.logger.error(`❌ فشل الاسترجاع: ${error.message}`);
      throw error;
    }
  }
}
