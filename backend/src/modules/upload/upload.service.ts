import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from '../content/content.entity';
import { CloudStorageService } from './cloud-storage.service';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private processingStatus = new Map<string, any>();

  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private cloudStorageService: CloudStorageService,
  ) {
    // تكوين FFmpeg path
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
    
    try {
      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);
      console.log('✅ FFmpeg configured successfully');
    } catch (error) {
      console.warn('⚠️ FFmpeg configuration warning:', error.message);
    }
  }

  async processUpload(
    file: Express.Multer.File,
    metadata: { title: string; description: string; performerId: string },
  ) {
    // إنشاء سجل المحتوى
    const content = this.contentRepository.create({
      title: metadata.title,
      description: metadata.description,
      performerId: metadata.performerId,
      type: file.mimetype.startsWith('video') ? ContentType.VIDEO : ContentType.AUDIO,
      originalFileUrl: `/uploads/original/${file.filename}`,
      fileSize: file.size,
      isProcessed: false,
    });

    const savedContent = await this.contentRepository.save(content);

    // بدء المعالجة في الخلفية
    this.processMediaFile(savedContent.id, file.path, file.mimetype);

    return savedContent;
  }

  private async processMediaFile(
    contentId: string,
    filePath: string,
    mimeType: string,
  ) {
    this.processingStatus.set(contentId, {
      status: 'processing',
      progress: 0,
      steps: [],
    });

    try {
      const outputDir = path.join('./uploads/processed', contentId);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 1. استخراج metadata
      await this.extractMetadata(filePath, contentId);
      this.updateProgress(contentId, 10, 'تم استخراج المعلومات');

      // 2. توليد thumbnail
      await this.generateThumbnail(filePath, outputDir, contentId);
      this.updateProgress(contentId, 20, 'تم إنشاء الصورة المصغرة');

      // 3. إنشاء HLS فيديو (للبث)
      if (mimeType.startsWith('video')) {
        await this.createSimpleHLS(filePath, outputDir, contentId);
        this.updateProgress(contentId, 50, 'تم إنشاء HLS فيديو');
      }

      // 4. استخراج صوت MP3 عادي (للتحميل)
      if (mimeType.startsWith('video')) {
        await this.extractAudioMP3(filePath, outputDir, contentId);
        this.updateProgress(contentId, 70, 'تم استخراج الصوت');
      } else {
        // إذا كان صوت أصلاً، نسخه كـ MP3
        await this.extractAudioMP3(filePath, outputDir, contentId);
        this.updateProgress(contentId, 70, 'تم استخراج الصوت');
      }

      // 5. رفع إلى R2
      await this.uploadToR2(contentId, outputDir, filePath);
      this.updateProgress(contentId, 90, 'تم الرفع إلى R2');

      // 6. تحديث قاعدة البيانات
      await this.updateContentAfterProcessing(contentId, outputDir);
      this.updateProgress(contentId, 100, 'اكتمل!');

      this.processingStatus.set(contentId, {
        status: 'completed',
        progress: 100,
      });
    } catch (error) {
      console.error('Processing error:', error);
      this.processingStatus.set(contentId, {
        status: 'failed',
        error: error.message,
      });
    }
  }

  private extractMetadata(filePath: string, contentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, async (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = metadata.format.duration || 0;
        
        await this.contentRepository.update(contentId, {
          duration: Math.floor(duration),
        });

        this.updateProgress(contentId, 20, 'تم استخراج المعلومات');
        resolve();
      });
    });
  }

  private generateThumbnail(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');

      ffmpeg(filePath)
        .screenshots({
          timestamps: ['10%'],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '1280x720',
        })
        .on('end', () => {
          this.updateProgress(contentId, 40, 'تم إنشاء الصورة المصغرة');
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * إنشاء HLS بسيط (نسخ بدون إعادة تشفير)
   */
  private createSimpleHLS(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const hlsDir = path.join(outputDir, 'hls');
      if (!fs.existsSync(hlsDir)) {
        fs.mkdirSync(hlsDir, { recursive: true });
      }

      const playlistPath = path.join(hlsDir, 'master.m3u8');
      const segmentPattern = path.join(hlsDir, 'segment_%03d.ts');

      ffmpeg(filePath)
        .output(playlistPath)
        .videoCodec('copy')
        .audioCodec('copy')
        .outputOptions([
          '-start_number 0',
          '-hls_time 6',
          '-hls_list_size 0',
          '-f hls',
          `-hls_segment_filename ${segmentPattern}`,
        ])
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  /**
   * استخراج صوت MP3 عادي
   */
  private extractAudioMP3(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioPath = path.join(outputDir, 'audio.mp3');

      ffmpeg(filePath)
        .output(audioPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .audioFrequency(44100)
        .audioChannels(2)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  /**
   * رفع كل شيء إلى R2
   */
  private async uploadToR2(
    contentId: string,
    outputDir: string,
    originalFilePath: string,
  ): Promise<void> {
    if (!this.cloudStorageService.isEnabled()) {
      this.logger.warn('R2 not enabled');
      return;
    }

    const r2Prefix = `content/${contentId}`;
    const publicUrl = this.cloudStorageService['publicUrl'];

    // 1. رفع الفيديو الأصلي
    if (fs.existsSync(originalFilePath)) {
      await this.cloudStorageService.uploadFile(
        originalFilePath,
        `${r2Prefix}/original.mp4`,
        'video/mp4',
      );
    }

    // 2. رفع HLS
    const hlsDir = path.join(outputDir, 'hls');
    if (fs.existsSync(hlsDir)) {
      await this.cloudStorageService.uploadDirectory(hlsDir, `${r2Prefix}/hls`);
    }

    // 3. رفع الصوت
    const audioPath = path.join(outputDir, 'audio.mp3');
    if (fs.existsSync(audioPath)) {
      await this.cloudStorageService.uploadFile(
        audioPath,
        `${r2Prefix}/audio.mp3`,
        'audio/mpeg',
      );
    }

    // 4. رفع الصورة المصغرة
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
    if (fs.existsSync(thumbnailPath)) {
      await this.cloudStorageService.uploadFile(
        thumbnailPath,
        `${r2Prefix}/thumbnail.jpg`,
        'image/jpeg',
      );
    }

    // 5. تحديث قاعدة البيانات بالروابط
    await this.contentRepository.update(contentId, {
      originalFileUrl: `${publicUrl}/${r2Prefix}/original.mp4`,
      hlsUrl: `${publicUrl}/${r2Prefix}/hls/master.m3u8`,
      audioUrl: `${publicUrl}/${r2Prefix}/audio.mp3`,
      thumbnailUrl: `${publicUrl}/${r2Prefix}/thumbnail.jpg`,
      isProcessed: true,
      isUploadedToCloud: true,
      cloudVideoUrl: `${publicUrl}/${r2Prefix}/original.mp4`,
      cloudAudioUrl: `${publicUrl}/${r2Prefix}/audio.mp3`,
      cloudThumbnailUrl: `${publicUrl}/${r2Prefix}/thumbnail.jpg`,
      cloudHlsUrl: `${publicUrl}/${r2Prefix}/hls/master.m3u8`,
    });
  }

  private createDownloadVersions(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const versions = [
          { name: '720p', height: 720, videoBitrate: '2500k', audioBitrate: '192k' },
          { name: '480p', height: 480, videoBitrate: '1000k', audioBitrate: '128k' },
          { name: '360p', height: 360, videoBitrate: '600k', audioBitrate: '96k' },
        ];

        for (const version of versions) {
          const outputPath = path.join(outputDir, `video-${version.name}.mp4`);
          
          await new Promise<void>((res, rej) => {
            ffmpeg(filePath)
              .output(outputPath)
              .videoCodec('libx264')
              .audioCodec('aac')
              .size(`?x${version.height}`) // الارتفاع ثابت، العرض يتناسب
              .videoBitrate(version.videoBitrate)
              .audioBitrate(version.audioBitrate)
              .outputOptions([
                '-preset fast',
                '-movflags +faststart', // للتشغيل السريع
              ])
              .on('end', () => res())
              .on('error', (err) => rej(err))
              .run();
          });
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // إنشاء HLS فيديو بدقات مختلفة (بدون إعادة تشفير - توفير مساحة)
  private async createVideoHLS(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    const hlsDir = path.join(outputDir, 'hls', 'video');
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }

    // الحصول على معلومات الفيديو الأصلي
    const metadata = await this.getVideoMetadata(filePath);
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // إنشاء دقات بناءً على الفيديو الأصلي
    const qualities = this.calculateQualities(originalWidth, originalHeight);

    // معالجة كل دقة
    for (const quality of qualities) {
      await this.createQualityHLS(filePath, hlsDir, quality, contentId);
    }

    // إنشاء master playlist
    const masterPlaylist = path.join(outputDir, 'hls', 'master.m3u8');
    this.createMasterPlaylist(masterPlaylist, qualities);
  }

  // حساب الدقات المناسبة بناءً على الفيديو الأصلي
  private calculateQualities(width: number, height: number) {
    const qualities = [];

    // إضافة كل الدقات (للتجربة - سيتم تحسينه لاحقاً)
    qualities.push({ name: '720p', width: 1280, height: 720 });
    qualities.push({ name: '480p', width: 854, height: 480 });
    qualities.push({ name: '360p', width: 640, height: 360 });

    return qualities;
  }

  // إنشاء HLS لدقة معينة (بأقل حجم ممكن)
  private createQualityHLS(
    filePath: string,
    hlsDir: string,
    quality: any,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(hlsDir, `${quality.name}.m3u8`);
      const segmentPattern = path.join(hlsDir, `${quality.name}_%03d.ts`);

      // إذا الدقة = الأصل، نستخدم copy (بدون إعادة تشفير)
      const isOriginalQuality = quality.name === 'original';

      const command = ffmpeg(filePath).output(playlistPath);

      if (isOriginalQuality) {
        // فقط تقطيع بدون تحويل (أسرع وأصغر حجم)
        command.outputOptions([
          '-c copy', // نسخ بدون تحويل
          '-hls_time 6',
          '-hls_list_size 0',
          '-hls_segment_filename', segmentPattern,
          '-hls_segment_type mpegts',
          '-hls_flags independent_segments',
        ]);
      } else {
        // تحويل للدقة المطلوبة
        command
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(`${quality.width}x${quality.height}`)
          .outputOptions([
            '-preset veryfast', // أسرع معالجة
            '-crf 28', // ضغط جيد
            '-profile:v main',
            '-level 4.0',
            '-pix_fmt yuv420p',
            '-b:a 96k',
            '-ar 44100',
            '-hls_time 6',
            '-hls_list_size 0',
            '-hls_segment_filename', segmentPattern,
            '-hls_segment_type mpegts',
            '-hls_flags independent_segments',
          ]);
      }

      command
        .on('progress', (progress) => {
          if (progress.percent) {
            this.updateProgress(
              contentId,
              20 + Math.floor(progress.percent * 0.1),
              `معالجة ${quality.name}: ${Math.floor(progress.percent)}%`,
            );
          }
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  // الحصول على معلومات الفيديو
  private getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        resolve({
          width: videoStream?.width || 1920,
          height: videoStream?.height || 1080,
          duration: metadata.format.duration || 0,
        });
      });
    });
  }

  // إنشاء HLS صوت فقط (للاستماع أو التحميل)
  private createAudioHLS(
    filePath: string,
    outputDir: string,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const hlsDir = path.join(outputDir, 'hls', 'audio');
      if (!fs.existsSync(hlsDir)) {
        fs.mkdirSync(hlsDir, { recursive: true });
      }

      const playlistPath = path.join(hlsDir, 'audio.m3u8');
      const segmentPattern = path.join(hlsDir, 'audio_%03d.ts');

      ffmpeg(filePath)
        .output(playlistPath)
        .noVideo() // بدون فيديو
        .audioCodec('aac')
        .audioBitrate('96k') // حجم أقل (96k كافي للصوت)
        .audioFrequency(44100)
        .audioChannels(2)
        .outputOptions([
          '-hls_time 6',
          '-hls_list_size 0',
          '-hls_segment_filename', segmentPattern,
          '-hls_segment_type mpegts',
        ])
        .on('progress', (progress) => {
          if (progress.percent) {
            const currentProgress = 50 + Math.floor(progress.percent * 0.2);
            this.updateProgress(contentId, currentProgress, `معالجة صوت: ${Math.floor(progress.percent)}%`);
          }
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  // إنشاء master playlist للدقات المختلفة
  private createMasterPlaylist(
    masterPath: string,
    qualities: Array<{ name: string; width: number; height: number }>,
  ): void {
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // حساب bandwidth تقريبي بناءً على الدقة
    qualities.forEach((quality) => {
      const pixels = quality.width * quality.height;
      const bandwidth = Math.floor(pixels * 0.1); // تقدير تقريبي
      
      content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
      content += `video/${quality.name}.m3u8\n\n`;
    });

    // إضافة الصوت فقط
    content += `#EXT-X-STREAM-INF:BANDWIDTH=96000,CODECS="mp4a.40.2"\n`;
    content += `audio/audio.m3u8\n`;

    fs.writeFileSync(masterPath, content);
  }

  private async updateContentAfterProcessing(
    contentId: string,
    outputDir: string,
  ) {
    const baseUrl = `/uploads/processed/${contentId}`;
    
    await this.contentRepository.update(contentId, {
      thumbnailUrl: `${baseUrl}/thumbnail.jpg`,
      audioUrl: `${baseUrl}/hls/audio/audio.m3u8`, // HLS صوت
      hlsUrl: `${baseUrl}/hls/master.m3u8`, // Master playlist
      isProcessed: true,
    });

    this.updateProgress(contentId, 100, 'اكتمل!');
  }

  private updateProgress(contentId: string, progress: number, step: string) {
    const current = this.processingStatus.get(contentId) || {};
    this.processingStatus.set(contentId, {
      ...current,
      progress,
      currentStep: step,
      steps: [...(current.steps || []), step],
    });
  }

  getProcessingStatus(contentId: string) {
    return this.processingStatus.get(contentId) || { status: 'not_found' };
  }

  async addToQueue(file: Express.Multer.File) {
    // جلب أول مؤدي كـ placeholder (سيتم تغييره لاحقاً)
    const performers = await this.contentRepository.manager.query(
      'SELECT id FROM performers LIMIT 1'
    );
    
    if (!performers || performers.length === 0) {
      throw new Error('يجب إضافة مؤدي واحد على الأقل قبل رفع المحتوى');
    }

    // إنشاء سجل في قاعدة البيانات - بدون معالجة
    const content = this.contentRepository.create({
      title: file.originalname,
      type: file.mimetype.startsWith('video') ? ContentType.VIDEO : ContentType.AUDIO,
      originalFileUrl: `/uploads/original/${file.filename}`,
      fileSize: file.size,
      isProcessed: false, // في الانتظار
      duration: 0,
      performerId: performers[0].id, // مؤدي مؤقت - سيتم تحديثه لاحقاً
    });

    const saved = await this.contentRepository.save(content);

    // لا نقوم بأي معالجة هنا - فقط رفع الملف

    return {
      id: saved.id,
      filename: file.originalname,
      fileUrl: saved.originalFileUrl,
      status: 'pending',
    };
  }

  async getQueue() {
    // جلب جميع المحتوى (منشور + في الانتظار)
    const content = await this.contentRepository.find({
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });

    return content.map((item) => ({
      id: item.id,
      filename: item.title, // الاسم الأصلي للملف
      fileUrl: item.originalFileUrl,
      thumbnailUrl: item.thumbnailUrl,
      duration: item.duration,
      status: item.isProcessed ? 'published' : 'pending',
      title: item.title, // العنوان (سيكون اسم الملف في البداية)
      description: item.description,
      performerId: item.performerId,
      originalDate: item.originalDate,
      type: item.type,
    }));
  }

  async updateQueueItem(
    id: string,
    data: { title: string; description: string; performerId: string; originalDate?: string },
  ) {
    // تحديث المعلومات فقط - بدون نشر
    await this.contentRepository.update(id, {
      title: data.title,
      description: data.description,
      performerId: data.performerId,
      originalDate: data.originalDate ? new Date(data.originalDate) : null,
    });

    return { message: 'تم التحديث بنجاح' };
  }

  async publishContent(id: string) {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new Error('المحتوى غير موجود');
    }

    // التحقق من وجود المعلومات المطلوبة
    if (!content.title || !content.performerId) {
      throw new Error('يجب إدخال العنوان واختيار المؤدي قبل النشر');
    }

    this.logger.log(`🚀 Publishing content: ${id}`);

    // تحديث الحالة إلى منشور مباشرة
    await this.contentRepository.update(id, {
      isProcessed: true,
    });

    // بدء المعالجة الكاملة في الخلفية (بدون انتظار)
    const filePath = content.originalFileUrl.replace('/uploads/original/', './uploads/original/');
    const mimeType = content.type === ContentType.VIDEO ? 'video/mp4' : 'audio/mp3';
    
    // معالجة في الخلفية + رفع للسحابة
    this.processAndUploadToCloud(id, filePath, mimeType).catch(error => {
      this.logger.error('Background processing error:', error);
    });

    return { 
      message: 'تم النشر بنجاح! جاري المعالجة والرفع للسحابة...',
      status: 'published'
    };
  }

  /**
   * معالجة المحتوى ورفعه للسحابة
   */
  private async processAndUploadToCloud(
    contentId: string,
    filePath: string,
    mimeType: string,
  ) {
    try {
      // 1. معالجة الملف محلياً (FFmpeg)
      this.logger.log(`⚙️ Processing media file: ${contentId}`);
      await this.processMediaFile(contentId, filePath, mimeType);

      // 2. رفع للسحابة (R2) - إذا كان مفعل
      const outputDir = path.join('./uploads/processed', contentId);
      
      if (this.cloudStorageService.isEnabled()) {
        this.logger.log(`☁️ Uploading to cloud: ${contentId}`);
        
        try {
          const cloudUrls = await this.cloudStorageService.uploadContentToCloud(contentId, outputDir);

          // 3. تحديث قاعدة البيانات بالروابط السحابية
          await this.contentRepository.update(contentId, {
            cloudVideoUrl: cloudUrls.cloudVideoUrl,
            cloudAudioUrl: cloudUrls.cloudAudioUrl,
            cloudThumbnailUrl: cloudUrls.cloudThumbnailUrl,
            cloudHlsUrl: cloudUrls.cloudHlsUrl,
            isUploadedToCloud: true,
          });

          this.logger.log(`✅ Content published to cloud: ${contentId}`);

          // 4. حذف الملفات المحلية (اختياري - لتوفير المساحة)
          await this.cleanupLocalFiles(contentId, outputDir);
        } catch (cloudError) {
          this.logger.warn(`⚠️ Cloud upload failed: ${cloudError.message}`);
          // نستمر بدون رفع للسحابة
        }
      }

    } catch (error) {
      this.logger.error(`❌ Process and upload failed for ${contentId}:`, error);
      
      // تحديث الحالة في حالة الفشل
      await this.contentRepository.update(contentId, {
        isProcessed: false,
      });
      
      throw error;
    }
  }

  /**
   * حذف الملفات المحلية بعد الرفع للسحابة
   */
  private async cleanupLocalFiles(contentId: string, processedDir: string) {
    try {
      this.logger.log(`🧹 Cleaning up local files: ${contentId}`);

      // حذف مجلد المعالجة
      if (fs.existsSync(processedDir)) {
        fs.rmSync(processedDir, { recursive: true, force: true });
        this.logger.log(`✅ Deleted processed directory: ${processedDir}`);
      }

      // حذف الملف الأصلي (اختياري)
      const content = await this.contentRepository.findOne({ where: { id: contentId } });
      if (content && content.originalFileUrl) {
        const originalPath = content.originalFileUrl.replace('/uploads/original/', './uploads/original/');
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
          this.logger.log(`✅ Deleted original file: ${originalPath}`);
        }
      }

    } catch (error) {
      this.logger.warn(`⚠️ Cleanup warning: ${error.message}`);
      // لا نرمي خطأ هنا - الحذف ليس حرجاً
    }
  }

  async deleteQueueItem(id: string) {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new Error('المحتوى غير موجود');
    }

    // حذف الملفات (اختياري)
    // TODO: حذف الملفات من uploads/

    await this.contentRepository.delete(id);
    return { message: 'تم الحذف بنجاح' };
  }


}
