import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/original',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          'audio/mpeg',
          'audio/wav',
          'audio/aac',
          'audio/mp4',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع الملف غير مدعوم'), false);
        }
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; description: string; performerId: string },
  ) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    // بدء المعالجة في الخلفية
    const result = await this.uploadService.processUpload(file, body);

    return {
      message: 'تم رفع الملف بنجاح وجاري المعالجة',
      contentId: result.id,
      status: 'processing',
    };
  }

  @Post('queue')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/original',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    }),
  )
  async addToQueue(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const result = await this.uploadService.addToQueue(file);
    return result;
  }

  @Get('queue')
  async getQueue() {
    return this.uploadService.getQueue();
  }

  @Put('queue/:id')
  async updateQueueItem(
    @Param('id') id: string,
    @Body() data: { title: string; description: string; performerId: string },
  ) {
    return this.uploadService.updateQueueItem(id, data);
  }

  @Post('publish/:id')
  async publishContent(@Param('id') id: string) {
    return this.uploadService.publishContent(id);
  }

  @Delete('queue/:id')
  async deleteQueueItem(@Param('id') id: string) {
    return this.uploadService.deleteQueueItem(id);
  }

  @Post('check-status/:id')
  async checkStatus(@Body('id') id: string) {
    return this.uploadService.getProcessingStatus(id);
  }
}
