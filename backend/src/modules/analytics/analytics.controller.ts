import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trending')
  getTrending(@Query('limit') limit = 10) {
    return this.analyticsService.getTrending(+limit);
  }

  @Get('popular')
  getPopular(@Query('limit') limit = 10) {
    return this.analyticsService.getPopular(+limit);
  }
}
