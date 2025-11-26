import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from '../content/content.entity';
import { Performer } from '../performers/performers.entity';
import { MetadataService } from '../upload/metadata.service';

interface ExternalVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  publishedAt: string;
  channelName: string;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Performer)
    private performerRepository: Repository<Performer>,
    private metadataService: MetadataService,
  ) {}

  /**
   * استيراد فيديو واحد من رابط خارجي
   */
  async importFromUrl(
    url: string,
    performerId: string,
    categoryIds?: string[],
  ): Promise<Content> {
    this.logger.log(`🔗 استيراد من: ${url}`);

    try {
      // تحديد المصدر
      const source = this.detectSource(url);
      
      let videoData: ExternalVideo;

      if (source !== 'aparat') {
        throw new Error('فقط روابط Aparat مدعومة حالياً');
      }

      videoData = await this.fetchFromAparat(url);

      // إنشاء المحتوى في قاعدة البيانات
      const content = this.contentRepository.create({
        title: videoData.title,
        description: videoData.description,
        type: ContentType.VIDEO,
        performerId,
        thumbnailUrl: videoData.thumbnailUrl,
        hlsUrl: videoData.videoUrl, // رابط الفيديو الخارجي
        audioUrl: videoData.videoUrl,
        duration: videoData.duration,
        originalDate: new Date(videoData.publishedAt),
        isProcessed: true, // جاهز للعرض مباشرة
        externalSource: source,
        externalId: videoData.id,
        externalUrl: url,
      });

      const saved = await this.contentRepository.save(content);

      // حفظ metadata في R2
      const performer = await this.performerRepository.findOne({
        where: { id: performerId },
      });

      if (performer) {
        const performerHash = this.metadataService.generatePerformerHash(performer.name);
        const contentHash = this.metadataService.generateContentHash(
          videoData.title,
          performerHash,
        );

        await this.metadataService.saveContentMetadata({
          id: saved.id,
          hash: contentHash,
          title: videoData.title,
          description: videoData.description,
          performerHash,
          performerName: performer.name,
          type: 'video',
          duration: videoData.duration,
          fileSize: 0, // خارجي
          originalDate: videoData.publishedAt,
          categories: categoryIds || [],
          thumbnailUrl: videoData.thumbnailUrl,
          hlsUrl: videoData.videoUrl,
          audioUrl: videoData.videoUrl,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        });
      }

      this.logger.log(`✅ تم استيراد: ${videoData.title}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ فشل الاستيراد: ${error.message}`);
      throw error;
    }
  }

  /**
   * استيراد قائمة تشغيل كاملة
   */
  async importPlaylist(
    playlistUrl: string,
    performerId: string,
    categoryIds?: string[],
  ): Promise<{ imported: number; failed: number; videos: Content[] }> {
    this.logger.log(`📋 استيراد قائمة تشغيل: ${playlistUrl}`);

    try {
      const source = this.detectSource(playlistUrl);
      let videos: ExternalVideo[] = [];

      if (source !== 'aparat') {
        throw new Error('فقط قوائم Aparat مدعومة حالياً');
      }

      videos = await this.fetchAparatPlaylist(playlistUrl);

      const imported: Content[] = [];
      let failed = 0;

      for (const video of videos) {
        try {
          const content = await this.importFromUrl(
            video.videoUrl,
            performerId,
            categoryIds,
          );
          imported.push(content);
        } catch (error) {
          this.logger.error(`فشل استيراد: ${video.title}`);
          failed++;
        }
      }

      this.logger.log(`✅ تم استيراد ${imported.length} فيديو، فشل ${failed}`);

      return {
        imported: imported.length,
        failed,
        videos: imported,
      };
    } catch (error) {
      this.logger.error(`❌ فشل استيراد القائمة: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحديد مصدر الرابط
   */
  private detectSource(url: string): 'aparat' | 'unknown' {
    if (url.includes('aparat.com')) {
      return 'aparat';
    }
    return 'unknown';
  }

  /**
   * جلب بيانات فيديو من Aparat
   */
  private async fetchFromAparat(url: string): Promise<ExternalVideo> {
    try {
      // استخراج video ID من الرابط
      const videoId = this.extractAparatId(url);
      
      // استدعاء Aparat API
      const response = await fetch(`https://www.aparat.com/api/fa/v1/video/video/show/videohash/${videoId}`);
      const data = await response.json();

      if (!data.data) {
        throw new Error('فيديو غير موجود');
      }

      const video = data.data;

      return {
        id: video.id,
        title: video.title,
        description: video.description || '',
        thumbnailUrl: video.big_poster,
        videoUrl: video.file_link_all[0]?.urls[0] || url, // أفضل جودة
        duration: parseInt(video.duration),
        publishedAt: video.create_date,
        channelName: video.username,
      };
    } catch (error) {
      this.logger.error(`فشل جلب بيانات Aparat: ${error.message}`);
      throw error;
    }
  }

  /**
   * جلب قائمة تشغيل من Aparat
   */
  private async fetchAparatPlaylist(url: string): Promise<ExternalVideo[]> {
    try {
      // استخراج playlist ID من الرابط
      const playlistId = this.extractAparatPlaylistId(url);
      
      // استدعاء Aparat API للقائمة
      const response = await fetch(`https://www.aparat.com/api/fa/v1/video/video/list/playlist/${playlistId}`);
      const data = await response.json();

      if (!data.data || !data.data.length) {
        throw new Error('قائمة فارغة أو غير موجودة');
      }

      // تحويل البيانات
      const videos: ExternalVideo[] = data.data.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        thumbnailUrl: video.big_poster,
        videoUrl: `https://www.aparat.com/v/${video.uid}`,
        duration: parseInt(video.duration),
        publishedAt: video.create_date,
        channelName: video.username,
      }));

      this.logger.log(`✅ تم جلب ${videos.length} فيديو من القائمة`);
      return videos;
    } catch (error) {
      this.logger.error(`فشل جلب قائمة Aparat: ${error.message}`);
      throw error;
    }
  }

  /**
   * استخراج playlist ID من رابط Aparat
   */
  private extractAparatPlaylistId(url: string): string {
    const match = url.match(/aparat\.com\/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }

  /**
   * استخراج video ID من رابط Aparat
   */
  private extractAparatId(url: string): string {
    const match = url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }

  /**
   * تحميل ورفع قائمة تشغيل كاملة (بدون إعلانات!)
   */
  async downloadAndUploadPlaylist(
    playlistUrl: string,
    performerId: string,
    options: {
      categoryIds?: string[];
      maxDuration?: number;
      skipExisting?: boolean;
    } = {},
  ): Promise<{ downloaded: number; skipped: number; failed: number; videos: Content[] }> {
    this.logger.log(`📥 تحميل ورفع قائمة تشغيل: ${playlistUrl}`);

    const { categoryIds, maxDuration = 10, skipExisting = true } = options;

    try {
      const source = this.detectSource(playlistUrl);
      
      if (source !== 'aparat') {
        throw new Error('فقط قوائم Aparat مدعومة حالياً');
      }

      const videos = await this.fetchAparatPlaylist(playlistUrl);
      
      const downloaded: Content[] = [];
      let skipped = 0;
      let failed = 0;

      for (const video of videos) {
        try {
          // تصفية حسب المدة
          if (video.duration > maxDuration * 60) {
            this.logger.log(`⏭️ تخطي (طويل): ${video.title} (${Math.round(video.duration / 60)} دقيقة)`);
            skipped++;
            continue;
          }

          // التحقق من التكرار
          if (skipExisting) {
            const performer = await this.performerRepository.findOne({
              where: { id: performerId },
            });

            if (performer) {
              const performerHash = this.metadataService.generatePerformerHash(performer.name);
              const contentHash = this.metadataService.generateContentHash(
                video.title,
                performerHash,
              );

              const exists = await this.contentRepository.findOne({
                where: { title: video.title, performerId },
              });

              if (exists) {
                this.logger.log(`⏭️ تخطي (موجود): ${video.title}`);
                skipped++;
                continue;
              }
            }
          }

          // استيراد الفيديو
          const content = await this.importFromUrl(
            video.videoUrl,
            performerId,
            categoryIds,
          );
          
          downloaded.push(content);
          this.logger.log(`✅ تم تحميل: ${video.title}`);
        } catch (error) {
          this.logger.error(`❌ فشل تحميل: ${video.title} - ${error.message}`);
          failed++;
        }
      }

      this.logger.log(`✅ اكتمل: ${downloaded.length} تحميل، ${skipped} تخطي، ${failed} فشل`);

      return {
        downloaded: downloaded.length,
        skipped,
        failed,
        videos: downloaded,
      };
    } catch (error) {
      this.logger.error(`❌ فشل تحميل القائمة: ${error.message}`);
      throw error;
    }
  }
}
