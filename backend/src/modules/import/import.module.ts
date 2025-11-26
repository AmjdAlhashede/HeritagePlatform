import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { AutoDownloadService } from './auto-download.service';
import { Content } from '../content/content.entity';
import { Performer } from '../performers/performers.entity';
import { UploadModule } from '../upload/upload.module';
import { TwitterSource } from './sources/twitter.source';
import { AparatSource } from './sources/aparat.source';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Performer]),
    UploadModule,
  ],
  controllers: [ImportController],
  providers: [
    ImportService, 
    AutoDownloadService,
    TwitterSource,
    AparatSource,
  ],
  exports: [ImportService, AutoDownloadService],
})
export class ImportModule {}
