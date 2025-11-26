import { Controller, Post, Body, UseGuards, Sse, MessageEvent, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { AutoDownloadService } from './auto-download.service';
import { Observable, Subject } from 'rxjs';

@Controller('import')
export class ImportController {
  private progressSubjects = new Map<string, Subject<any>>();

  constructor(
    private importService: ImportService,
    private autoDownloadService: AutoDownloadService,
  ) {}

  /**
   * استيراد فيديو واحد من رابط خارجي
   */
  @Post('video')
  @UseGuards(JwtAuthGuard)
  async importVideo(
    @Body() body: { url: string; performerId: string; categoryIds?: string[] },
  ) {
    const content = await this.importService.importFromUrl(
      body.url,
      body.performerId,
      body.categoryIds,
    );

    return {
      success: true,
      content,
      message: 'تم استيراد الفيديو بنجاح',
    };
  }

  /**
   * استيراد قائمة تشغيل كاملة
   */
  @Post('playlist')
  @UseGuards(JwtAuthGuard)
  async importPlaylist(
    @Body() body: { url: string; performerId: string; categoryIds?: string[] },
  ) {
    const result = await this.importService.importPlaylist(
      body.url,
      body.performerId,
      body.categoryIds,
    );

    return {
      success: true,
      ...result,
      message: `تم استيراد ${result.imported} فيديو بنجاح`,
    };
  }

  /**
   * تحميل ورفع قائمة تشغيل كاملة (بدون إعلانات!)
   * يدعم Aparat و Twitter/X
   */
  @Post('auto-download')
  @UseGuards(JwtAuthGuard)
  async autoDownload(
    @Body() body: { 
      playlistUrl: string; 
      performerId: string; 
      categoryIds?: string[];
      maxDuration?: number;
      skipExisting?: boolean;
      sessionId?: string; // معرف الجلسة للتقدم
    },
  ) {
    const sessionId = body.sessionId || Date.now().toString();
    
    // إنشاء Subject قبل بدء التحميل
    const progressSubject = new Subject<any>();
    this.progressSubjects.set(sessionId, progressSubject);
    
    console.log(`✅ Created progress subject for session: ${sessionId}`);

    // إرسال رسالة بداية فوراً
    progressSubject.next({
      status: 'starting',
      message: 'جاري بدء التحميل...',
    });

    // تشغيل التحميل في الخلفية بعد تأخير صغير
    setTimeout(() => {
      this.autoDownloadService.downloadAndUploadPlaylist(
        body.playlistUrl,
        body.performerId,
        {
          categoryIds: body.categoryIds,
          maxDuration: body.maxDuration || 10,
          skipExisting: body.skipExisting !== false,
          onProgress: (progress) => {
            // إرسال التحديث للعميل
            console.log(`📤 Sending progress:`, progress);
            progressSubject.next(progress);
          },
        },
      ).then((result) => {
        // إرسال النتيجة النهائية
        console.log(`✅ Download completed:`, result);
        progressSubject.next({
          status: 'done',
          ...result,
        });
        
        // تأخير قبل إغلاق الاتصال
        setTimeout(() => {
          progressSubject.complete();
          this.progressSubjects.delete(sessionId);
        }, 1000);
      }).catch((error) => {
        // إرسال الخطأ
        console.error(`❌ Download failed:`, error);
        progressSubject.next({
          status: 'error',
          error: error.message,
        });
        
        setTimeout(() => {
          progressSubject.complete();
          this.progressSubjects.delete(sessionId);
        }, 1000);
      });
    }, 100);

    return {
      success: true,
      sessionId,
      message: 'بدأ التحميل - استخدم /import/progress/:sessionId للمتابعة',
    };
  }

  /**
   * الاستماع لتقدم التحميل (Server-Sent Events)
   * ملاحظة: بدون @UseGuards لأن EventSource لا يدعم headers
   */
  @Sse('progress/:sessionId')
  progress(@Param('sessionId') sessionId: string): Observable<MessageEvent> {
    console.log(`🔌 SSE connection opened for session: ${sessionId}`);
    
    return new Observable<MessageEvent>((observer) => {
      // الانتظار حتى يتم إنشاء الـ Subject
      const checkInterval = setInterval(() => {
        const subject = this.progressSubjects.get(sessionId);
        
        if (subject) {
          clearInterval(checkInterval);
          console.log(`✅ Found subject for session: ${sessionId}`);
          
          // الاشتراك في التحديثات
          const subscription = subject.subscribe({
            next: (data) => {
              console.log(`📤 Sending to client:`, data);
              observer.next({ data } as MessageEvent);
            },
            error: (err) => {
              console.error(`❌ SSE error:`, err);
              observer.error(err);
            },
            complete: () => {
              console.log(`✅ SSE completed for session: ${sessionId}`);
              observer.complete();
            },
          });

          // تنظيف عند قطع الاتصال
          return () => {
            console.log(`🔌 SSE connection closed for session: ${sessionId}`);
            subscription.unsubscribe();
          };
        }
      }, 100);

      // timeout بعد 5 ثواني إذا لم يتم إيجاد الـ Subject
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.progressSubjects.has(sessionId)) {
          console.error(`❌ Session not found after timeout: ${sessionId}`);
          observer.next({
            data: {
              status: 'error',
              error: 'جلسة غير موجودة - حاول مرة أخرى',
            },
          } as MessageEvent);
          observer.complete();
        }
      }, 5000);
    });
  }
}
