import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Performer } from './performers.entity';
import { PerformersController } from './performers.controller';
import { PerformersService } from './performers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Performer])],
  controllers: [PerformersController],
  providers: [PerformersService],
  exports: [PerformersService],
})
export class PerformersModule {}
