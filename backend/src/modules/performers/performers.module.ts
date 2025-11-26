import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Performer } from './performers.entity';
import { PerformersController } from './performers.controller';
import { PerformersService } from './performers.service';
import { Content } from '../content/content.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Performer, Content]),
    UploadModule,
  ],
  controllers: [PerformersController],
  providers: [PerformersService],
  exports: [PerformersService],
})
export class PerformersModule {}
