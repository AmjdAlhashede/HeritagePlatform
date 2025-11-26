import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudStorageService {
  private readonly logger = new Logger(CloudStorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;
  private storageProvider: string;

  constructor(private configService: ConfigService) {
    // محاولة R2 أولاً
    const r2Endpoint = this.configService.get<string>('R2_ENDPOINT');
    const r2AccessKey = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const r2SecretKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const r2Bucket = this.configService.get<string>('R2_BUCKET_NAME');
    const r2PublicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (r2Endpoint && r2AccessKey && r2SecretKey && r2Bucket) {
      // استخدام Cloudflare R2
      this.s3Client = new S3Client({
        endpoint: r2Endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
        },
        forcePathStyle: true, // مهم لـ R2
      });
      this.bucketName = r2Bucket;
      this.publicUrl = r2PublicUrl || r2Endpoint;
      this.storageProvider = 'Cloudflare R2';
      this.logger.log(`✅ Cloudflare R2 Storage initialized`);
      this.logger.log(`📦 Bucket: ${this.bucketName}`);
      this.logger.log(`🌐 Public URL: ${this.publicUrl}`);
      return;
    }

    // لا يوجد تخزين سحابي
    this.logger.warn('⚠️ Cloud storage not configured (R2)');
    this.logger.warn('💡 Files will be stored locally only');
  }

  /**
   * التحقق من تفعيل التخزين السحابي
   */
  isEnabled(): boolean {
    return !!this.s3Client;
  }

  /**
   * رفع ملف واحد إلى السحابة
   */
  async uploadFile(
    localFilePath: string,
    s3Key: string,
    contentType?: string,
  ): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('Cloud storage is not configured');
    }

    try {
      const fileStream = fs.createReadStream(localFilePath);
      const stats = fs.statSync(localFilePath);

      // استخدام Upload للملفات الكبيرة (multipart upload)
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: contentType || this.getContentType(localFilePath),
          // R2 لا يدعم ACL - الـ bucket نفسه يجب أن يكون public
        },
      });

      // تتبع التقدم
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        this.logger.debug(`Uploading ${s3Key}: ${percentage}%`);
      });

      await upload.done();

      const publicUrl = `${this.publicUrl}/${s3Key}`;
      this.logger.log(`✅ Uploaded: ${s3Key}`);
      
      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ Upload failed for ${s3Key}:`, error.message);
      throw error;
    }
  }

  /**
   * رفع مجلد كامل (مثل مجلد HLS)
   */
  async uploadDirectory(
    localDirPath: string,
    s3Prefix: string,
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    try {
      const files = this.getAllFiles(localDirPath);
      
      this.logger.log(`📦 Uploading ${files.length} files from ${localDirPath}`);

      for (const file of files) {
        const relativePath = path.relative(localDirPath, file);
        const s3Key = `${s3Prefix}/${relativePath}`.replace(/\\/g, '/'); // Windows compatibility
        
        const url = await this.uploadFile(file, s3Key);
        uploadedUrls.push(url);
      }

      this.logger.log(`✅ Uploaded ${files.length} files to ${s3Prefix}`);
      return uploadedUrls;
    } catch (error) {
      this.logger.error(`❌ Directory upload failed:`, error.message);
      throw error;
    }
  }

  /**
   * حذف ملف من السحابة
   */
  async deleteFile(s3Key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      this.logger.log(`🗑️ Deleted: ${s3Key}`);
    } catch (error) {
      this.logger.error(`❌ Delete failed for ${s3Key}:`, error.message);
      throw error;
    }
  }

  /**
   * التحقق من وجود ملف
   */
  async fileExists(s3Key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * رفع محتوى كامل (فيديو + صوت + thumbnail + HLS)
   */
  async uploadContentToCloud(
    contentId: string,
    localBasePath: string,
  ): Promise<{
    cloudVideoUrl: string;
    cloudAudioUrl: string;
    cloudThumbnailUrl: string;
    cloudHlsUrl: string;
  }> {
    const s3Prefix = `content/${contentId}`;

    try {
      this.logger.log(`🚀 Starting cloud upload for content: ${contentId}`);

      // 1. رفع Thumbnail
      const thumbnailPath = path.join(localBasePath, 'thumbnail.jpg');
      let cloudThumbnailUrl = null;
      if (fs.existsSync(thumbnailPath)) {
        cloudThumbnailUrl = await this.uploadFile(
          thumbnailPath,
          `${s3Prefix}/thumbnail.jpg`,
          'image/jpeg',
        );
      }

      // 2. رفع مجلد HLS كامل
      const hlsDir = path.join(localBasePath, 'hls');
      let cloudHlsUrl = null;
      if (fs.existsSync(hlsDir)) {
        await this.uploadDirectory(hlsDir, `${s3Prefix}/hls`);
        cloudHlsUrl = `${this.publicUrl}/${s3Prefix}/hls/master.m3u8`;
      }

      // 3. رفع الصوت
      const audioDir = path.join(localBasePath, 'hls', 'audio');
      let cloudAudioUrl = null;
      if (fs.existsSync(audioDir)) {
        cloudAudioUrl = `${this.publicUrl}/${s3Prefix}/hls/audio/audio.m3u8`;
      }

      // 4. الفيديو الأصلي (اختياري - يمكن الاعتماد على HLS فقط)
      let cloudVideoUrl = cloudHlsUrl; // نستخدم HLS كفيديو رئيسي

      this.logger.log(`✅ Cloud upload completed for content: ${contentId}`);

      return {
        cloudVideoUrl,
        cloudAudioUrl,
        cloudThumbnailUrl,
        cloudHlsUrl,
      };
    } catch (error) {
      this.logger.error(`❌ Cloud upload failed for ${contentId}:`, error.message);
      throw error;
    }
  }

  /**
   * حذف محتوى كامل من السحابة
   */
  async deleteContentFromCloud(contentId: string): Promise<void> {
    const s3Prefix = `content/${contentId}`;
    
    try {
      // حذف جميع الملفات بالـ prefix
      // ملاحظة: S3 لا يدعم حذف مجلد مباشرة، يجب حذف كل ملف
      // يمكن تحسين هذا لاحقاً بـ listObjects + deleteObjects
      this.logger.log(`🗑️ Deleting content from cloud: ${contentId}`);
      
      // TODO: تنفيذ حذف جماعي للملفات
      
    } catch (error) {
      this.logger.error(`❌ Cloud deletion failed:`, error.message);
      throw error;
    }
  }

  /**
   * الحصول على جميع الملفات في مجلد (recursive)
   */
  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * تحديد نوع المحتوى بناءً على الامتداد
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.m3u8': 'application/vnd.apple.mpegurl',
      '.ts': 'video/mp2t',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.mp3': 'audio/mpeg',
      '.aac': 'audio/aac',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * الحصول على رابط عام لملف
   */
  getPublicUrl(s3Key: string): string {
    return `${this.publicUrl}/${s3Key}`;
  }

  /**
   * قائمة المجلدات في prefix معين
   */
  async listFolders(prefix: string): Promise<string[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        Delimiter: '/',
      });

      const response = await this.s3Client.send(command);
      
      // استخراج أسماء المجلدات من CommonPrefixes
      const folders = (response.CommonPrefixes || [])
        .map(p => p.Prefix)
        .filter(p => p !== undefined) as string[];

      return folders;
    } catch (error) {
      this.logger.error(`❌ Failed to list folders: ${error.message}`);
      return [];
    }
  }
}
