import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from '../content/content.entity';
import { Performer } from '../performers/performers.entity';
import { MetadataService } from '../upload/metadata.service';
import { CloudStorageService } from '../upload/cloud-storage.service';
import { TwitterSource } from './sources/twitter.source';
import { AparatSource } from './sources/aparat.source';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as ffmpeg from 'fluent-ffmpeg';

const execAsync = promisify(exec);

interface ChannelVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  publishedAt: string;
}

@Injectable()
export class AutoDownloadService {
  private readonly logger = new Logger(AutoDownloadService.name);

  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Performer)
    private performerRepository: Repository<Performer>,
    private metadataService: MetadataService,
    private cloudStorageService: CloudStorageService,
    private twitterSource: TwitterSource,
    private aparatSource: AparatSource,
  ) {}

  /**
   * تحميل ورفع قائمة تشغيل أو قناة
   * النظام الجديد: جلب معلومات فيديو → معالجة كاملة → التالي
   */
  async downloadAndUploadPlaylist(
    playlistUrl: string,
    performerId: string,
    options?: {
      categoryIds?: string[];
      maxDuration?: number; // بالدقائق
      maxVideos?: number; // حد أقصى لعدد الفيديوهات
      skipExisting?: boolean;
      cancelledVideos?: Set<string>; // قائمة الفيديوهات الملغاة
      onProgress?: (progress: any) => void; // callback للتحديثات
    },
  ): Promise<{ 
    downloaded: number; 
    skipped: number;
    failed: number; 
    videos: Content[];
    details: any[];
  }> {
    this.logger.log(`📺 بدء تحميل قائمة: ${playlistUrl}`);

    const maxDuration = options?.maxDuration || 10; // افتراضي 10 دقائق
    const maxVideos = options?.maxVideos || 999999; // بدون حد (جلب الكل)
    const skipExisting = options?.skipExisting !== false; // افتراضي true
    const cancelledVideos = options?.cancelledVideos || new Set<string>();

    try {
      // المرحلة 1: جلب كل IDs الفيديوهات (سريع جداً)
      this.logger.log(`📋 المرحلة 1: جلب قائمة كل الفيديوهات...`);
      const videoIds = await this.fetchPlaylistVideoIdsOnly(playlistUrl, maxVideos);
      
      this.logger.log(`✅ تم العثور على ${videoIds.length} فيديو`);
      
      // إرسال تحديث: تم جلب القائمة
      if (options?.onProgress) {
        options.onProgress({
          status: 'ids-fetched',
          total: videoIds.length,
          message: `تم جلب ${videoIds.length} فيديو`,
        });
      }

      const downloaded: Content[] = [];
      const details: any[] = [];
      let skipped = 0;
      let failed = 0;
      
      // قائمة الانتظار للفيديوهات الجاهزة للتحميل
      const downloadQueue: any[] = [];
      let fetchingComplete = false;
      let downloadingComplete = false;

      // المرحلة 2: Thread 1 - جلب المعلومات وإضافة للقائمة
      this.logger.log(`📋 بدء Thread 1: جلب المعلومات...`);
      
      const fetcherPromise = (async () => {
        for (let i = 0; i < videoIds.length; i++) {
          const videoId = videoIds[i].trim(); // تنظيف من المسافات
          
          try {
            // جلب معلومات هذا الفيديو
            this.logger.log(`📥 Thread 1 [${i + 1}/${videoIds.length}] جلب معلومات: ${videoId}`);
            
            if (options?.onProgress) {
              options.onProgress({
                status: 'fetching-info',
                current: i + 1,
                total: videoIds.length,
                message: `جلب معلومات ${i + 1}/${videoIds.length}`,
              });
            }
            
            const video = await this.fetchSingleVideoInfo(videoId, playlistUrl);
            
            if (!video) {
              this.logger.warn(`⚠️ فشل جلب معلومات ${videoId}`);
              failed++;
              continue;
            }
            
            // إضافة للقائمة في الواجهة
            if (options?.onProgress) {
              options.onProgress({
                status: 'video-added',
                video: {
                  id: video.id,
                  title: video.title,
                  duration: Math.floor(video.duration / 60),
                  status: 'pending',
                  index: i,
                  artwork: video.thumbnailUrl, // إضافة الصورة المصغرة
                },
                current: i + 1,
                total: videoIds.length,
                message: `تمت إضافة: ${video.title}`,
              });
            }
            
            // إضافة لقائمة الانتظار
            downloadQueue.push({ video, index: i });
            this.logger.log(`➕ تمت إضافة ${video.title} لقائمة الانتظار (${downloadQueue.length} في الانتظار)`);
            
          } catch (error) {
            this.logger.warn(`⚠️ فشل جلب معلومات ${videoId}: ${error.message}`);
            failed++;
          }
        }
        
        fetchingComplete = true;
        this.logger.log(`✅ Thread 1 اكتمل: تم جلب ${downloadQueue.length} فيديو`);
      })();
      
      // المرحلة 3: Thread 2 - التحميل والمعالجة
      this.logger.log(`📥 بدء Thread 2: التحميل والمعالجة...`);
      
      const downloaderPromise = (async () => {
        let processedCount = 0;
        
        while (!downloadingComplete) {
          // انتظار حتى يكون هناك فيديو في القائمة
          if (downloadQueue.length === 0) {
            // إذا انتهى الجلب ولا يوجد شيء في القائمة، نوقف
            if (fetchingComplete) {
              downloadingComplete = true;
              break;
            }
            // انتظار 500ms قبل المحاولة مرة أخرى
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          // أخذ أول فيديو من القائمة
          const item = downloadQueue.shift();
          const { video, index } = item;
          processedCount++;
          
          this.logger.log(`🔄 Thread 2 [${processedCount}] بدء معالجة: ${video.title} (${downloadQueue.length} في الانتظار)`);
          
          try {
            // التحقق من الإلغاء
            if (cancelledVideos.has(video.id)) {
              this.logger.log(`⏭️ تخطي (ملغى): ${video.title}`);
            skipped++;
            
            if (options?.onProgress) {
              options.onProgress({
                status: 'skipped',
                video: video.title,
                videoId: video.id,
                videoIndex: processedCount - 1,
                reason: 'ملغى من المستخدم',
                current: processedCount,
                total: videoIds.length,
                percentage: Math.round((processedCount / videoIds.length) * 100),
              });
            }
            continue;
          }
          
          const progress = {
            current: processedCount,
            total: videoIds.length,
            video: video.title,
            videoId: video.id,
            videoIndex: index,
            status: 'checking',
          };

          // تصفية: المدة
          if (video.duration > maxDuration * 60) {
            this.logger.log(`⏭️ تخطي (طويل): ${video.title} (${Math.floor(video.duration / 60)} دقيقة)`);
            skipped++;
            details.push({
              title: video.title,
              status: 'skipped',
              reason: 'طويل',
              duration: Math.floor(video.duration / 60),
            });
            
            // إرسال تحديث: تخطي
            if (options?.onProgress) {
              options.onProgress({
                ...progress,
                status: 'skipped',
                reason: 'طويل - أكثر من 10 دقائق',
                percentage: Math.round((processedCount / videoIds.length) * 100),
              });
            }
            
            continue;
          }

          // تصفية: التكرار
          if (skipExisting) {
            const hash = this.metadataService.generateContentHash(
              video.title,
              await this.getPerformerHash(performerId),
            );
            
            const exists = await this.checkIfExists(hash);
            if (exists) {
              this.logger.log(`⏭️ تخطي (موجود): ${video.title}`);
              skipped++;
              details.push({
                title: video.title,
                status: 'skipped',
                reason: 'موجود',
                duration: Math.floor(video.duration / 60),
              });
              
              // إرسال تحديث: تخطي
              if (options?.onProgress) {
                options.onProgress({
                  ...progress,
                  status: 'skipped',
                  reason: 'موجود مسبقاً',
                  percentage: Math.round((processedCount / videoIds.length) * 100),
                });
              }
              
              continue;
            }
          }

          this.logger.log(`⬇️ Thread 2 [${processedCount}/${videoIds.length}] معالجة: ${video.title} (${Math.floor(video.duration / 60)} دقيقة)`);
          
          // إرسال تحديث: بدء التحميل
          if (options?.onProgress) {
            options.onProgress({
              ...progress,
              status: 'downloading',
              percentage: Math.round((processedCount / videoIds.length) * 100),
            });
          }
          
          const content = await this.downloadAndUploadVideo(
            video,
            performerId,
            options?.categoryIds,
            (stage) => {
              // إرسال تحديث لكل مرحلة
              if (options?.onProgress) {
                options.onProgress({
                  current: processedCount,
                  total: videoIds.length,
                  video: video.title,
                  videoIndex: index,
                  status: 'processing',
                  stage: stage,
                  percentage: Math.round((processedCount / videoIds.length) * 100),
                });
              }
            },
          );
          
          downloaded.push(content);
          details.push({
            title: video.title,
            status: 'success',
            duration: Math.floor(video.duration / 60),
            id: content.id,
          });
          
          this.logger.log(`✅ Thread 2 [${processedCount}/${videoIds.length}] تم: ${video.title}`);
          
          // إرسال تحديث: اكتمل
          if (options?.onProgress) {
            options.onProgress({
              ...progress,
              status: 'completed',
              percentage: Math.round((processedCount / videoIds.length) * 100),
            });
          }
          
          // تأخير بين كل فيديو والثاني (5-10 ثواني عشوائي)
          if (processedCount < videoIds.length) {
            const delay = 5000 + Math.random() * 5000; // 5-10 ثواني
            this.logger.log(`⏳ انتظار ${Math.round(delay / 1000)} ثانية قبل الفيديو التالي...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          this.logger.error(`❌ Thread 2 [${processedCount}/${videoIds.length}] فشل: ${video.title} - ${error.message}`);
          failed++;
          details.push({
            title: video.title,
            status: 'failed',
            error: error.message,
            duration: 0,
          });
          
          // إرسال تحديث: فشل
          if (options?.onProgress) {
            options.onProgress({
              current: processedCount,
              total: videoIds.length,
              video: video.title,
              videoId: video.id,
              videoIndex: index,
              status: 'failed',
              error: error.message,
            });
          }
          
          // تأخير حتى في حالة الفشل
          const delay = 3000 + Math.random() * 2000; // 3-5 ثواني
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } 
      
      this.logger.log(`✅ Thread 2 اكتمل: تم ${downloaded.length} فيديو`);
    })();
    
    // انتظار اكتمال الاثنين
    await Promise.all([fetcherPromise, downloaderPromise]);

    this.logger.log(`🎉 اكتمل! تم ${downloaded.length} فيديو، تخطي ${skipped}, فشل ${failed}`);

    return {
      downloaded: downloaded.length,
      skipped,
      failed,
      videos: downloaded,
      details, // تفاصيل كل فيديو
    };
    } catch (error) {
      this.logger.error(`❌ فشل تحميل القائمة: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحميل ورفع فيديو واحد
   */
  async downloadAndUploadVideo(
    video: ChannelVideo,
    performerId: string,
    categoryIds?: string[],
    onProgress?: (stage: string) => void,
  ): Promise<Content> {
    // تنظيف video.id من المسافات والأحرف الخاصة
    const cleanVideoId = video.id.trim().replace(/[\r\n\t]/g, '');
    const tempDir = path.join('./uploads/temp', cleanVideoId);
    
    try {
      // 1. إنشاء مجلد مؤقت
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 2. تحميل الفيديو
      if (onProgress) onProgress('⬇️ تحميل الفيديو من Twitter/X');
      const videoPath = await this.downloadVideo(video.videoUrl, tempDir);

      // 3. تحميل الصورة المصغرة
      if (onProgress) onProgress('🖼️ تحميل الصورة المصغرة');
      const thumbnailPath = await this.downloadThumbnail(
        video.thumbnailUrl,
        tempDir,
      );

      // 4. معالجة الفيديو (HLS, audio)
      if (onProgress) onProgress('🔄 معالجة الفيديو (HLS + Audio)');
      await this.processVideo(videoPath, tempDir);

      // 5. حفظ في قاعدة البيانات أولاً للحصول على ID فريد
      if (onProgress) onProgress('💾 حفظ في Neon Database');
      const tempContent = await this.contentRepository.create({
        title: video.title,
        description: video.description,
        type: ContentType.VIDEO,
        performerId,
        duration: Math.floor(video.duration),
        originalDate: new Date(video.publishedAt),
        isProcessed: false,
        externalSource: 'twitter',
        externalId: video.id,
        externalUrl: `https://twitter.com/i/status/${video.id}`,
      });
      const savedTemp = await this.contentRepository.save(tempContent);

      // 6. رفع كل شيء إلى R2 باستخدام ID من قاعدة البيانات
      if (onProgress) onProgress('☁️ رفع إلى Cloudflare R2');
      const r2Urls = await this.uploadToR2(tempDir, savedTemp.id);

      // 7. تحديث السجل بالروابط
      const content = await this.saveToDatabase(
        video,
        performerId,
        r2Urls,
        categoryIds,
        savedTemp.id, // تمرير ID الموجود
      );

      // 7. حذف الملفات المؤقتة
      if (onProgress) onProgress('🧹 تنظيف الملفات المؤقتة');
      this.cleanupTemp(tempDir);

      return content;
    } catch (error) {
      // حذف الملفات المؤقتة في حالة الفشل
      this.cleanupTemp(tempDir);
      throw error;
    }
  }

  /**
   * جلب IDs الفيديوهات فقط (سريع)
   * كل مصدر مستقل تماماً - لا تداخل
   */
  private async fetchPlaylistVideoIdsOnly(url: string, maxVideos: number): Promise<string[]> {
    const source = this.detectSource(url);

    try {
      switch (source) {
        case 'twitter':
          return await this.twitterSource.fetchVideoIds(url, maxVideos);
        
        case 'aparat':
          return await this.aparatSource.fetchVideoIds(url, maxVideos);
        
        default:
          throw new Error('مصدر غير مدعوم');
      }
    } catch (error) {
      this.logger.error(`❌ فشل جلب IDs من ${source}: ${error.message}`);
      throw error;
    }
  }

  /**
   * جلب قائمة فيديوهات (Aparat أو Twitter/X)
   */
  private async fetchPlaylistVideos(url: string, onProgress?: (progress: any) => void): Promise<ChannelVideo[]> {
    const source = this.detectSource(url);

    switch (source) {
      case 'aparat':
        return this.fetchAparatPlaylist(url, onProgress);
      case 'twitter':
        return this.fetchTwitterPlaylist(url, onProgress);
      default:
        throw new Error('مصدر غير مدعوم');
    }
  }

  /**
   * جلب IDs فيديوهات Aparat فقط
   * استخدام scraping من صفحة القائمة
   */
  private async fetchAparatVideoIds(url: string, maxVideos: number): Promise<string[]> {
    const playlistId = this.extractAparatPlaylistId(url);
    this.logger.log(`🔍 جلب IDs من Aparat playlist: ${playlistId}`);
    
    try {
      const playlistUrl = `https://www.aparat.com/playlist/${playlistId}`;
      
      this.logger.log(`📡 جلب الصفحة: ${playlistUrl}`);
      
      const response = await fetch(playlistUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      this.logger.log(`📄 حجم HTML: ${html.length} حرف`);
      
      const videoIds = new Set<string>();
      
      // البحث عن روابط الفيديوهات: /v/xxxxx
      const linkMatches = html.matchAll(/\/v\/([a-zA-Z0-9]+)/g);
      for (const match of linkMatches) {
        videoIds.add(match[1]);
      }
      
      this.logger.log(`✅ تم العثور على ${videoIds.size} فيديو`);
      
      if (videoIds.size === 0) {
        // حفظ HTML للتحليل
        fs.writeFileSync('aparat-debug.html', html);
        this.logger.error(`❌ لم يتم العثور على فيديوهات. تم حفظ HTML في aparat-debug.html`);
        throw new Error('لم يتم العثور على فيديوهات في القائمة');
      }
      
      return Array.from(videoIds).slice(0, maxVideos);
      
    } catch (error) {
      this.logger.error(`❌ فشل جلب Aparat playlist: ${error.message}`);
      throw new Error(`فشل جلب قائمة Aparat: ${error.message}`);
    }
  }

  /**
   * جلب IDs فيديوهات Twitter فقط
   */
  private async fetchTwitterVideoIds(url: string, maxVideos: number): Promise<string[]> {
    let targetUrl = url;
    if (!url.includes('http') && !url.includes('/')) {
      targetUrl = `https://twitter.com/${url.replace('@', '')}`;
    }

    const cookiesPath = path.join(process.cwd(), 'cookies.txt');
    let command = `gallery-dl --print "{tweet_id}"`;
    
    if (fs.existsSync(cookiesPath)) {
      command += ` --cookies "${cookiesPath}"`;
    }
    
    command += ` "${targetUrl}"`;

    const { stdout } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
    });

    const tweetIds = stdout
      .split('\n')
      .map(id => id.trim())
      .filter(id => id && /^\d+$/.test(id))
      .slice(0, maxVideos);

    return tweetIds;
  }

  /**
   * جلب قائمة من Aparat
   * استخدام API الداخلي لـ Aparat
   */
  private async fetchAparatPlaylist(url: string, onProgress?: (progress: any) => void): Promise<ChannelVideo[]> {
    try {
      // استخراج playlist ID
      const playlistId = this.extractAparatPlaylistId(url);
      
      this.logger.log(`🔍 جلب قائمة Aparat: ${playlistId}`);
      
      if (onProgress) {
        onProgress({
          status: 'fetching',
          video: 'جلب قائمة الفيديوهات من Aparat...',
          current: 0,
          total: 0,
          percentage: 0,
        });
      }
      
      // محاولة 1: استخدام API الداخلي
      try {
        const apiUrl = `https://www.aparat.com/api/fa/v1/video/playlist/videohash/list/playlist/${playlistId}?pr=1&mf=1`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': `https://www.aparat.com/playlist/${playlistId}`,
          },
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          
          const data = await response.json();
          
          if (data && data.data && Array.isArray(data.data)) {
            this.logger.log(`✅ تم جلب ${data.data.length} فيديو من API`);
            
            const videos: ChannelVideo[] = [];
            const totalVideos = data.data.length;
            
            for (let i = 0; i < data.data.length; i++) {
              const item = data.data[i];
              
              if (onProgress) {
                onProgress({
                  status: 'fetching',
                  video: `جلب معلومات الفيديو ${i + 1}/${totalVideos}`,
                  current: i + 1,
                  total: totalVideos,
                  percentage: Math.round(((i + 1) / totalVideos) * 100),
                });
              }
              
              try {
                const videoUrl = `https://www.aparat.com/v/${item}`;
                const command = `yt-dlp --dump-json "${videoUrl}"`;
                const { stdout } = await execAsync(command, { 
                  maxBuffer: 10 * 1024 * 1024,
                  timeout: 30000,
                });
                
                const videoData = JSON.parse(stdout);
                
                videos.push({
                  id: item,
                  title: this.extractBestTitle(videoData),
                  description: this.cleanDescription(videoData.description || ''),
                  thumbnailUrl: this.getBestThumbnail(videoData),
                  videoUrl: videoUrl,
                  duration: videoData.duration || 0,
                  publishedAt: videoData.upload_date ? this.parseAparatDate(videoData.upload_date) : new Date().toISOString(),
                });
                
                this.logger.debug(`✅ جلب: ${videoData.title}`);
              } catch (error) {
                this.logger.warn(`⚠️ فشل جلب ${item}: ${error.message}`);
              }
            }
            
            if (videos.length > 0) {
              return videos;
            }
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ فشل API، سأحاول طريقة بديلة: ${error.message}`);
      }

      // محاولة 2: جلب الصفحة واستخراج البيانات من JSON المضمن
      this.logger.log(`🔄 محاولة استخراج البيانات من الصفحة...`);
      
      const pageResponse = await fetch(
        `https://www.aparat.com/playlist/${playlistId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      );
      const html = await pageResponse.text();

      // البحث عن البيانات المضمنة في الصفحة
      // Aparat يضع البيانات في script tags
      const scriptMatches = html.matchAll(/<script[^>]*>(.*?)<\/script>/gs);
      const videoIds = new Set<string>();
      
      for (const match of scriptMatches) {
        const scriptContent = match[1];
        // البحث عن UIDs في الـ JSON
        const uidMatches = scriptContent.matchAll(/"uid":"([a-zA-Z0-9]+)"/g);
        for (const uidMatch of uidMatches) {
          videoIds.add(uidMatch[1]);
        }
      }

      if (videoIds.size === 0) {
        this.logger.error('❌ لم يتم العثور على فيديوهات');
        throw new Error('قائمة فارغة أو غير موجودة. جرب استخدام روابط الفيديوهات مباشرة بدلاً من القائمة.');
      }

      this.logger.log(`✅ تم العثور على ${videoIds.size} فيديو`);

      // جلب معلومات كل فيديو
      const videos: ChannelVideo[] = [];
      let successCount = 0;
      
      for (const videoId of Array.from(videoIds)) {
        try {
          const videoUrl = `https://www.aparat.com/v/${videoId}`;
          const command = `yt-dlp --dump-json "${videoUrl}"`;
          const { stdout } = await execAsync(command, { 
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30000,
          });
          
          const data = JSON.parse(stdout);
          
          videos.push({
            id: videoId,
            title: this.extractBestTitle(data),
            description: this.cleanDescription(data.description || ''),
            thumbnailUrl: this.getBestThumbnail(data),
            videoUrl: videoUrl,
            duration: data.duration || 0,
            publishedAt: data.upload_date ? this.parseAparatDate(data.upload_date) : new Date().toISOString(),
          });
          
          successCount++;
          this.logger.log(`✅ [${successCount}/${videoIds.size}] ${data.title}`);
        } catch (error) {
          this.logger.warn(`⚠️ فشل جلب ${videoId}: ${error.message}`);
        }
      }

      if (videos.length === 0) {
        throw new Error('فشل جلب معلومات الفيديوهات');
      }

      this.logger.log(`✅ نجح ${successCount} من ${videoIds.size} فيديو`);
      return videos;
    } catch (error) {
      this.logger.error(`فشل جلب قائمة Aparat: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحويل تاريخ Aparat من صيغة YYYYMMDD إلى ISO
   */
  private parseAparatDate(dateStr: string): string {
    try {
      // صيغة: 20240115
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * جلب قائمة من Twitter/X
   * يدعم: اسم المستخدم، رابط الحساب، أو رابط تغريدة واحدة
   * يستخدم gallery-dl بدلاً من yt-dlp (أفضل لـ Twitter/X)
   */
  private async fetchTwitterPlaylist(url: string, onProgress?: (progress: any) => void): Promise<ChannelVideo[]> {
    try {
      this.logger.log(`🐦 جلب فيديوهات Twitter/X من: ${url}`);
      
      // تحديد نوع الرابط
      let targetUrl = url;
      
      // إذا كان اسم مستخدم فقط (بدون رابط)
      if (!url.includes('http') && !url.includes('/')) {
        targetUrl = `https://twitter.com/${url.replace('@', '')}`;
        this.logger.log(`📝 تحويل اسم المستخدم إلى رابط: ${targetUrl}`);
      }
      
      // استخدام gallery-dl لجلب IDs الفيديوهات
      // ثم yt-dlp لجلب المعلومات التفصيلية
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      let command = `gallery-dl --print "{tweet_id}"`;
      
      if (fs.existsSync(cookiesPath)) {
        command += ` --cookies "${cookiesPath}"`;
        this.logger.log(`🍪 استخدام ملف cookies`);
      } else {
        this.logger.warn(`⚠️ ملف cookies.txt غير موجود`);
      }
      
      command += ` "${targetUrl}"`;
      
      this.logger.log(`⏳ جاري جلب قائمة الفيديوهات...`);
      
      const { stdout } = await execAsync(command, { 
        maxBuffer: 100 * 1024 * 1024,
        timeout: 300000,
      });

      // gallery-dl --print "{tweet_id}" يعطي IDs الفيديوهات
      const tweetIds = stdout.trim().split('\n').filter(line => 
        line.trim() && /^\d+$/.test(line.trim())
      );
      
      this.logger.log(`📋 تم العثور على ${tweetIds.length} فيديو`);
      
      if (tweetIds.length === 0) {
        throw new Error('لم يتم العثور على فيديوهات. تأكد من أن الحساب يحتوي على فيديوهات.');
      }
      
      const videos: ChannelVideo[] = [];

      // جلب معلومات كل فيديو باستخدام yt-dlp
      for (let i = 0; i < tweetIds.length; i++) {
        const tweetId = tweetIds[i];
        try {
          const videoUrl = `https://twitter.com/i/status/${tweetId}`;
          this.logger.log(`📥 [${i + 1}/${tweetIds.length}] جلب معلومات: ${tweetId}`);
          
          // إرسال تحديث: جلب المعلومات
          if (onProgress) {
            onProgress({
              status: 'fetching',
              current: i + 1,
              total: tweetIds.length,
              video: `جلب معلومات الفيديو ${i + 1}/${tweetIds.length}`,
              percentage: Math.round(((i + 1) / tweetIds.length) * 100),
            });
          }
          
          const ytCommand = `yt-dlp --dump-json --cookies "${cookiesPath}" "${videoUrl}"`;
          const { stdout: videoData } = await execAsync(ytCommand, {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30000,
          });
          
          const data = JSON.parse(videoData);
          
          const title = this.extractBestTitle(data);
          const description = this.cleanDescription(data.description || '');
          const duration = Math.floor(data.duration || 0);
          
          // التاريخ
          let publishedAt = new Date().toISOString();
          if (data.upload_date) {
            const year = data.upload_date.substring(0, 4);
            const month = data.upload_date.substring(4, 6);
            const day = data.upload_date.substring(6, 8);
            publishedAt = new Date(`${year}-${month}-${day}`).toISOString();
          } else if (data.timestamp) {
            publishedAt = new Date(data.timestamp * 1000).toISOString();
          }
          
          videos.push({
            id: tweetId,
            title,
            description,
            thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
            videoUrl: data.webpage_url || videoUrl,
            duration,
            publishedAt,
          });
          
          const durationStr = duration > 0 ? ` (${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')})` : '';
          this.logger.log(`✅ [${videos.length}/${tweetIds.length}] ${title.substring(0, 50)}...${durationStr}`);
        } catch (e) {
          this.logger.warn(`⚠️ فشل جلب معلومات ${tweetId}: ${e.message}`);
        }
        
        // تأخير صغير بين كل طلب (0.5 ثانية)
        if (i < tweetIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (videos.length === 0) {
        throw new Error('لم يتم العثور على فيديوهات. تأكد من أن الحساب يحتوي على فيديوهات.');
      }

      this.logger.log(`✅ تم جلب ${videos.length} فيديو من Twitter/X`);
      return videos;
    } catch (error) {
      this.logger.error(`❌ فشل جلب قائمة Twitter: ${error.message}`);
      throw error;
    }
  }

  /**
   * استخراج أفضل عنوان من بيانات الفيديو
   * يستخرج اسم الزامل فقط من النص الكامل
   */
  private extractBestTitle(videoData: any): string {
    let fullText = '';
    
    // الحصول على النص الكامل
    if (videoData.description) {
      fullText = videoData.description.split('\n')[0].trim();
    } else if (videoData.title) {
      fullText = videoData.title;
    }
    
    // إزالة الروابط
    fullText = fullText.replace(/https?:\/\/\S+$/g, '').trim();
    
    this.logger.debug(`📝 النص الكامل: ${fullText}`);
    
    // نمط 1: "العنوان اسم_المؤدي كلمات/..."
    // مثال: "عطاء الشهداء عيسى الليث كلمات/ أبو رواسي"
    const beforePerformerMatch = fullText.match(/^(.+?)\s+(?:عيسى الليث|أبو رواسي|[^\s]+\s+[^\s]+)\s+(?:كلمات|ألحان|أداء)/);
    if (beforePerformerMatch && beforePerformerMatch[1]) {
      const title = beforePerformerMatch[1].trim();
      if (title.length > 3 && title.length < 100) {
        this.logger.debug(`✅ استخراج (نمط 1): ${title}`);
        return this.cleanTitle(title);
      }
    }
    
    // نمط 2: "العنوان اسم_المؤدي" (بدون كلمات)
    // مثال: "تجار الأبد عيسى الليث"
    const beforePerformerSimple = fullText.match(/^(.+?)\s+(?:عيسى الليث|أبو رواسي|[^\s]+\s+[^\s]+)$/);
    if (beforePerformerSimple && beforePerformerSimple[1]) {
      const title = beforePerformerSimple[1].trim();
      if (title.length > 3 && title.length < 100) {
        this.logger.debug(`✅ استخراج (نمط 2): ${title}`);
        return this.cleanTitle(title);
      }
    }
    
    // نمط 3: "اسم المؤدي - نوع | العنوان - باقي النص"
    // مثال: "عيسى الليث - زامل | تجار الأبد - ذكرى الشهيد..."
    const pipeMatch = fullText.match(/\|\s*([^-]+?)\s*-/);
    if (pipeMatch && pipeMatch[1]) {
      const title = pipeMatch[1].trim();
      if (title.length > 3 && title.length < 100) {
        this.logger.debug(`✅ استخراج (نمط 3): ${title}`);
        return this.cleanTitle(title);
      }
    }
    
    // نمط 4: "- زامل | العنوان"
    const zamelMatch = fullText.match(/(?:زامل|قصيدة|أنشودة)\s*\|\s*([^-]+)/);
    if (zamelMatch && zamelMatch[1]) {
      const title = zamelMatch[1].trim();
      if (title.length > 3 && title.length < 100) {
        this.logger.debug(`✅ استخراج (نمط 4): ${title}`);
        return this.cleanTitle(title);
      }
    }
    
    // نمط 5: استخدام الجزء الأول قبل أي كلمات مفتاحية
    const keywords = ['كلمات', 'ألحان', 'أداء', 'إخراج', 'ذكرى', 'اليوم', 'الشعب'];
    for (const keyword of keywords) {
      const index = fullText.indexOf(keyword);
      if (index > 5) {
        const title = fullText.substring(0, index).trim();
        // إزالة اسم المؤدي إذا كان في النهاية
        const cleanedTitle = title.replace(/\s+(?:عيسى الليث|أبو رواسي|[^\s]+\s+[^\s]+)$/g, '').trim();
        if (cleanedTitle.length > 3 && cleanedTitle.length < 100) {
          this.logger.debug(`✅ استخراج (نمط 5): ${cleanedTitle}`);
          return this.cleanTitle(cleanedTitle);
        }
      }
    }
    
    // نمط 6: استخدام الجزء بعد "-" قبل كلمات مفتاحية
    const parts = fullText.split('-').map(p => p.trim());
    if (parts.length > 2) {
      for (let i = 1; i < Math.min(parts.length, 3); i++) {
        const part = parts[i];
        if (part.length > 3 && part.length < 100 && 
            !keywords.some(k => part.includes(k))) {
          this.logger.debug(`✅ استخراج (نمط 6): ${part}`);
          return this.cleanTitle(part);
        }
      }
    }
    
    // كخيار أخير، استخدم أول 50 حرف
    const fallback = fullText.substring(0, 50);
    this.logger.debug(`⚠️ استخدام fallback: ${fallback}`);
    return this.cleanTitle(fallback);
  }

  /**
   * الحصول على أفضل صورة مصغرة
   */
  private getBestThumbnail(videoData: any): string {
    // محاولة الحصول على أكبر صورة متاحة
    if (videoData.thumbnails && videoData.thumbnails.length > 0) {
      // البحث عن صورة orig أولاً (الأفضل)
      const origThumb = videoData.thumbnails.find((t: any) => t.id === 'orig');
      if (origThumb) {
        return origThumb.url;
      }
      // ثم large
      const largeThumb = videoData.thumbnails.find((t: any) => t.id === 'large');
      if (largeThumb) {
        return largeThumb.url;
      }
      // استخدام آخر صورة (عادة الأكبر)
      return videoData.thumbnails[videoData.thumbnails.length - 1].url;
    }
    
    // استخدام thumbnail الافتراضي
    return videoData.thumbnail || '';
  }

  /**
   * تنظيف العنوان
   */
  private cleanTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  /**
   * تنظيف الوصف
   */
  private cleanDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }

  /**
   * استخراج العنوان من Twitter
   * يستخرج التاريخ من اسم الفيديو إذا كان موجوداً
   */
  private extractTitleFromTwitter(title: string, description: string): string {
    // محاولة استخراج عنوان من الوصف (السطر الأول)
    if (description) {
      const lines = description.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // إذا كان السطر الأول يحتوي على تاريخ، استخدمه
        if (this.containsDate(firstLine)) {
          return this.cleanTitle(firstLine);
        }
        // وإلا استخدم السطر الأول إذا كان قصير
        if (firstLine.length < 100 && firstLine.length > 5) {
          return this.cleanTitle(firstLine);
        }
      }
    }
    
    // إذا العنوان الأصلي يحتوي على تاريخ، استخدمه
    if (this.containsDate(title)) {
      return this.cleanTitle(title);
    }
    
    // وإلا استخدم العنوان الأصلي
    return this.cleanTitle(title);
  }

  /**
   * استخراج الوصف من Twitter
   * يحتفظ بالنص الكامل بدون الروابط
   */
  private extractDescriptionFromTwitter(description: string): string {
    if (!description) return '';
    
    // إزالة الروابط فقط، الاحتفاظ بالنص
    let cleaned = description
      .replace(/https?:\/\/[^\s]+/g, '') // إزالة الروابط
      .replace(/pic\.twitter\.com\/[^\s]+/g, '') // إزالة روابط الصور
      .trim();
    
    // إزالة السطر الأول إذا كان مستخدم كعنوان
    const lines = cleaned.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      // استخدم كل شيء ما عدا السطر الأول
      return lines.slice(1).join('\n').trim();
    }
    
    return cleaned;
  }

  /**
   * التحقق من وجود تاريخ في النص
   */
  private containsDate(text: string): boolean {
    // أنماط التاريخ الشائعة
    const datePatterns = [
      /\d{4}[-/]\d{1,2}[-/]\d{1,2}/, // 2024-01-15 أو 2024/01/15
      /\d{1,2}[-/]\d{1,2}[-/]\d{4}/, // 15-01-2024 أو 15/01/2024
      /\d{4}م/, // 2024م
      /\d{4}هـ/, // 1445هـ
      /(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{4}/, // يناير 2024
    ];
    
    return datePatterns.some(pattern => pattern.test(text));
  }

  /**
   * استخراج التاريخ من النص
   */
  private extractDateFromText(text: string): Date | null {
    try {
      // محاولة استخراج تاريخ بصيغة YYYY-MM-DD
      const match1 = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match1) {
        return new Date(`${match1[1]}-${match1[2].padStart(2, '0')}-${match1[3].padStart(2, '0')}`);
      }

      // محاولة استخراج تاريخ بصيغة DD-MM-YYYY
      const match2 = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (match2) {
        return new Date(`${match2[3]}-${match2[2].padStart(2, '0')}-${match2[1].padStart(2, '0')}`);
      }

      // محاولة استخراج سنة فقط
      const match3 = text.match(/(\d{4})[مهـ]/);
      if (match3) {
        return new Date(`${match3[1]}-01-01`);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * تحديد المصدر
   */
  private detectSource(url: string): 'aparat' | 'twitter' | 'unknown' {
    if (url.includes('aparat.com')) return 'aparat';
    if (url.includes('twitter.com') || url.includes('x.com') || url.includes('@')) return 'twitter';
    // إذا كان نص بدون رابط، نفترض أنه اسم مستخدم Twitter
    if (!url.includes('http') && !url.includes('.')) return 'twitter';
    return 'unknown';
  }

  /**
   * استخراج playlist ID من Aparat
   */
  private extractAparatPlaylistId(url: string): string {
    const match = url.match(/aparat\.com\/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }

  /**
   * الحصول على hash المؤدي
   */
  private async getPerformerHash(performerId: string): Promise<string> {
    const performer = await this.performerRepository.findOne({
      where: { id: performerId },
    });
    
    if (!performer) {
      throw new Error('مؤدي غير موجود');
    }

    return this.metadataService.generatePerformerHash(performer.name);
  }

  /**
   * التحقق من وجود المحتوى
   */
  private async checkIfExists(hash: string): Promise<boolean> {
    // التحقق من قاعدة البيانات
    const count = await this.contentRepository.count({
      where: { title: hash }, // TODO: إضافة حقل hash للمحتوى
    });

    return count > 0;
  }

  /**
   * تحميل فيديو باستخدام yt-dlp
   */
  private async downloadVideo(url: string, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, 'original.mp4');

    try {
      // استخدام yt-dlp لتحميل أفضل جودة
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      let command = `yt-dlp -f "best[ext=mp4]"`;
      
      // إضافة cookies إذا كان موجود
      if (fs.existsSync(cookiesPath)) {
        command += ` --cookies "${cookiesPath}"`;
      }
      
      command += ` -o "${outputPath}" "${url}"`;
      
      this.logger.log(`⬇️ تحميل: ${command}`);
      
      await execAsync(command, { 
        timeout: 600000, // 10 دقائق timeout
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      });

      if (!fs.existsSync(outputPath)) {
        throw new Error('فشل التحميل - الملف غير موجود');
      }

      this.logger.log(`✅ تم التحميل: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`❌ فشل تحميل الفيديو: ${error.message}`);
      throw new Error(`فشل تحميل الفيديو: ${error.message}`);
    }
  }

  /**
   * تحميل الصورة المصغرة
   */
  private async downloadThumbnail(
    url: string,
    outputDir: string,
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'thumbnail.jpg');

    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));

      return outputPath;
    } catch (error) {
      this.logger.warn(`فشل تحميل الصورة المصغرة: ${error.message}`);
      return null;
    }
  }

  /**
   * معالجة الفيديو (HLS + Audio)
   */
  private async processVideo(videoPath: string, outputDir: string): Promise<void> {
    try {
      const hlsDir = path.join(outputDir, 'hls');
      if (!fs.existsSync(hlsDir)) {
        fs.mkdirSync(hlsDir, { recursive: true });
      }

      // إنشاء HLS للفيديو
      await this.createHLS(videoPath, hlsDir);

      // استخراج الصوت كملف MP3 عادي في المجلد الرئيسي
      await this.extractAudio(videoPath, outputDir);
    } catch (error) {
      throw new Error(`فشلت المعالجة: ${error.message}`);
    }
  }

  /**
   * إنشاء HLS
   */
  private createHLS(videoPath: string, hlsDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(hlsDir, 'master.m3u8');
      const segmentPattern = path.join(hlsDir, 'segment_%03d.ts');

      this.logger.log(`🎬 إنشاء HLS: ${playlistPath}`);

      ffmpeg(videoPath)
        .output(playlistPath)
        .videoCodec('copy') // نسخ بدون إعادة تشفير
        .audioCodec('copy')
        .outputOptions([
          '-start_number 0',
          '-hls_time 6',
          '-hls_list_size 0',
          '-f hls',
          `-hls_segment_filename ${segmentPattern}`,
        ])
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(`HLS: ${Math.floor(progress.percent)}%`);
          }
        })
        .on('end', () => {
          this.logger.log(`✅ تم إنشاء HLS`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`❌ فشل إنشاء HLS: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  /**
   * استخراج الصوت كملف MP3 عادي
   */
  private extractAudio(videoPath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioPath = path.join(outputDir, 'audio.mp3');

      this.logger.log(`🎵 استخراج الصوت: ${audioPath}`);

      ffmpeg(videoPath)
        .output(audioPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .audioFrequency(44100)
        .audioChannels(2)
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(`Audio: ${Math.floor(progress.percent)}%`);
          }
        })
        .on('end', () => {
          this.logger.log(`✅ تم استخراج الصوت`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`❌ فشل استخراج الصوت: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  /**
   * رفع كل شيء إلى R2
   */
  private async uploadToR2(
    tempDir: string,
    videoId: string,
  ): Promise<{
    videoUrl: string;
    audioUrl: string;
    thumbnailUrl: string;
    hlsUrl: string;
  }> {
    if (!this.cloudStorageService.isEnabled()) {
      throw new Error('R2 غير مفعل');
    }

    try {
      const r2Prefix = `content/${videoId}`;
      const publicUrl = this.cloudStorageService['publicUrl'];

      // 1. رفع الفيديو الأصلي
      const originalVideoPath = path.join(tempDir, 'original.mp4');
      let originalVideoUrl = null;
      
      if (fs.existsSync(originalVideoPath)) {
        this.logger.log(`📤 رفع الفيديو الأصلي...`);
        const videoStats = fs.statSync(originalVideoPath);
        this.logger.log(`📦 حجم الفيديو: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`);
        
        await this.cloudStorageService.uploadFile(
          originalVideoPath,
          `${r2Prefix}/original.mp4`,
          'video/mp4',
        );
        originalVideoUrl = `${publicUrl}/${r2Prefix}/original.mp4`;
        this.logger.log(`✅ تم رفع الفيديو الأصلي`);
      } else {
        this.logger.warn(`⚠️ الفيديو الأصلي غير موجود: ${originalVideoPath}`);
      }

      // 2. رفع مجلد HLS (للتشغيل)
      const hlsDir = path.join(tempDir, 'hls');
      if (fs.existsSync(hlsDir)) {
        this.logger.log(`📤 رفع HLS...`);
        await this.cloudStorageService.uploadDirectory(hlsDir, `${r2Prefix}/hls`);
        this.logger.log(`✅ تم رفع HLS`);
      } else {
        throw new Error(`مجلد HLS غير موجود: ${hlsDir}`);
      }

      // 3. رفع ملف الصوت MP3
      const audioPath = path.join(tempDir, 'audio.mp3');
      let audioUrl = null;
      
      if (fs.existsSync(audioPath)) {
        this.logger.log(`📤 رفع ملف الصوت...`);
        const audioStats = fs.statSync(audioPath);
        this.logger.log(`📦 حجم الصوت: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);
        
        await this.cloudStorageService.uploadFile(
          audioPath,
          `${r2Prefix}/audio.mp3`,
          'audio/mpeg',
        );
        audioUrl = `${publicUrl}/${r2Prefix}/audio.mp3`;
        this.logger.log(`✅ تم رفع ملف الصوت`);
      } else {
        this.logger.warn(`⚠️ ملف الصوت غير موجود: ${audioPath}`);
      }

      // 4. رفع الصورة المصغرة
      const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
      let thumbnailUrl = null;
      
      if (fs.existsSync(thumbnailPath)) {
        this.logger.log(`📤 رفع الصورة المصغرة...`);
        await this.cloudStorageService.uploadFile(
          thumbnailPath,
          `${r2Prefix}/thumbnail.jpg`,
          'image/jpeg',
        );
        thumbnailUrl = `${publicUrl}/${r2Prefix}/thumbnail.jpg`;
        this.logger.log(`✅ تم رفع الصورة المصغرة`);
      } else {
        this.logger.warn(`⚠️ الصورة المصغرة غير موجودة: ${thumbnailPath}`);
      }

      // 5. التحقق من وجود الملفات في R2
      const hlsUrl = `${publicUrl}/${r2Prefix}/hls/master.m3u8`;
      
      this.logger.log(`🔍 التحقق من الرفع...`);
      this.logger.log(`  - HLS: ${hlsUrl}`);
      if (audioUrl) {
        this.logger.log(`  - Audio: ${audioUrl}`);
      }
      if (thumbnailUrl) {
        this.logger.log(`  - Thumbnail: ${thumbnailUrl}`);
      }
      if (originalVideoUrl) {
        this.logger.log(`  - Original: ${originalVideoUrl}`);
      }

      return {
        videoUrl: originalVideoUrl, // الفيديو الأصلي للتحميل
        audioUrl: audioUrl, // ملف MP3 للتحميل
        thumbnailUrl: thumbnailUrl, // الصورة المصغرة
        hlsUrl: hlsUrl, // HLS للتشغيل
      };
    } catch (error) {
      this.logger.error(`❌ فشل الرفع إلى R2: ${error.message}`);
      throw new Error(`فشل الرفع إلى R2: ${error.message}`);
    }
  }

  /**
   * حفظ في قاعدة البيانات
   */
  private async saveToDatabase(
    video: ChannelVideo,
    performerId: string,
    r2Urls: any,
    categoryIds?: string[],
    existingId?: string, // ID موجود مسبقاً
  ): Promise<Content> {
    // إذا كان هناك ID موجود، نحدث السجل بدلاً من إنشاء جديد
    if (existingId) {
      // استخدام الصورة من R2 أولاً، ثم Twitter كـ fallback
      const finalThumbnail = r2Urls.thumbnailUrl || video.thumbnailUrl;
      
      await this.contentRepository.update(existingId, {
        title: video.title,
        description: video.description,
        thumbnailUrl: finalThumbnail,
        hlsUrl: r2Urls.hlsUrl,
        audioUrl: r2Urls.audioUrl,
        originalFileUrl: r2Urls.videoUrl,
        isProcessed: true,
        isUploadedToCloud: true,
        cloudVideoUrl: r2Urls.videoUrl,
        cloudAudioUrl: r2Urls.audioUrl,
        cloudThumbnailUrl: finalThumbnail,
        cloudHlsUrl: r2Urls.hlsUrl,
      });
      
      const updated = await this.contentRepository.findOne({ where: { id: existingId }, relations: ['performer'] });
      
      // حفظ metadata
      const performer = updated.performer;
      const performerHash = this.metadataService.generatePerformerHash(performer.name);
      const contentHash = this.metadataService.generateContentHash(video.title, performerHash);
      
      await this.metadataService.saveContentMetadata({
        id: updated.id,
        hash: contentHash,
        title: video.title,
        description: video.description,
        performerHash,
        performerName: performer.name,
        type: 'video',
        duration: Math.floor(video.duration),
        fileSize: 0,
        originalDate: video.publishedAt,
        categories: categoryIds || [],
        thumbnailUrl: r2Urls.thumbnailUrl || video.thumbnailUrl,
        hlsUrl: r2Urls.hlsUrl,
        audioUrl: r2Urls.audioUrl,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
      
      return updated;
    }
    
    // إنشاء سجل جديد
    // استخدام الصورة من R2 أولاً، ثم Twitter كـ fallback
    const finalThumbnail = r2Urls.thumbnailUrl || video.thumbnailUrl;
    
    const content = this.contentRepository.create({
      title: video.title,
      description: video.description,
      type: ContentType.VIDEO,
      performerId,
      thumbnailUrl: finalThumbnail,
      hlsUrl: r2Urls.hlsUrl,
      audioUrl: r2Urls.audioUrl,
      originalFileUrl: r2Urls.videoUrl,
      duration: Math.floor(video.duration),
      originalDate: new Date(video.publishedAt),
      isProcessed: true,
      isUploadedToCloud: true,
      cloudVideoUrl: r2Urls.videoUrl,
      cloudAudioUrl: r2Urls.audioUrl,
      cloudThumbnailUrl: finalThumbnail,
      cloudHlsUrl: r2Urls.hlsUrl,
      externalSource: 'twitter',
      externalId: video.id,
      externalUrl: `https://twitter.com/i/status/${video.id}`,
    });

    const saved = await this.contentRepository.save(content);

    // حفظ metadata في R2
    const performer = await this.performerRepository.findOne({
      where: { id: performerId },
    });

    if (performer) {
      const performerHash = this.metadataService.generatePerformerHash(
        performer.name,
      );
      const contentHash = this.metadataService.generateContentHash(
        video.title,
        performerHash,
      );

      await this.metadataService.saveContentMetadata({
        id: saved.id,
        hash: contentHash,
        title: video.title,
        description: video.description,
        performerHash,
        performerName: performer.name,
        type: 'video',
        duration: Math.floor(video.duration),
        fileSize: 0,
        originalDate: video.publishedAt,
        categories: categoryIds || [],
        thumbnailUrl: video.thumbnailUrl || r2Urls.thumbnailUrl, // استخدام الصورة الأصلية من Twitter
        hlsUrl: r2Urls.hlsUrl,
        audioUrl: r2Urls.audioUrl,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      });
    }

    return saved;
  }

  /**
   * حذف الملفات المؤقتة
   */
  private cleanupTemp(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.warn(`فشل حذف الملفات المؤقتة: ${error.message}`);
    }
  }

  /**
   * استخراج username من رابط Aparat
   */
  private extractAparatUsername(url: string): string {
    const match = url.match(/aparat\.com\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }



  /**
   * جلب معلومات فيديو واحد
   */
  private async fetchSingleVideoInfo(videoId: string, sourceUrl: string): Promise<ChannelVideo | null> {
    const source = this.detectSource(sourceUrl);
    
    try {
      let videoUrl: string;
      
      if (source === 'twitter') {
        videoUrl = `https://twitter.com/i/status/${videoId}`;
      } else if (source === 'aparat') {
        videoUrl = `https://www.aparat.com/v/${videoId}`;
      } else {
        return null;
      }
      
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      let command = `yt-dlp --dump-json`;
      
      if (fs.existsSync(cookiesPath)) {
        command += ` --cookies "${cookiesPath}"`;
      }
      
      command += ` "${videoUrl}"`;
      
      const { stdout } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });
      
      const data = JSON.parse(stdout);
      
      return {
        id: videoId.trim(), // تنظيف من المسافات
        title: this.extractBestTitle(data),
        description: this.cleanDescription(data.description || ''),
        thumbnailUrl: this.getBestThumbnail(data),
        videoUrl: videoUrl,
        duration: data.duration || 0,
        publishedAt: this.extractPublishDate(data),
      };
    } catch (error) {
      this.logger.warn(`⚠️ فشل جلب معلومات ${videoId}: ${error.message}`);
      return null;
    }
  }

  /**
   * استخراج تاريخ النشر
   */
  private extractPublishDate(data: any): string {
    if (data.upload_date) {
      const year = data.upload_date.substring(0, 4);
      const month = data.upload_date.substring(4, 6);
      const day = data.upload_date.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toISOString();
    } else if (data.timestamp) {
      return new Date(data.timestamp * 1000).toISOString();
    }
    return new Date().toISOString();
  }
}
