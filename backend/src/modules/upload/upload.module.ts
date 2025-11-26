import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Content } from '../content/content.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudStorageService } from './cloud-storage.service';
import { MetadataService } from './metadata.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content]),
    MulterModule.register({
      dest: './uploads/original',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudStorageService, MetadataService],
  exports: [UploadService, CloudStorageService, MetadataService],
})
export class UploadModule {}
