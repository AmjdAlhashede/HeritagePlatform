import { Controller, Get, Param, Query, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('performerId') performerId?: string,
  ) {
    return this.contentService.findAll(+page, +limit, performerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() contentData: any) {
    return this.contentService.create(contentData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() contentData: any) {
    return this.contentService.update(id, contentData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string) {
    return this.contentService.incrementViewCount(id);
  }

  @Post(':id/download')
  incrementDownload(@Param('id') id: string) {
    return this.contentService.incrementDownloadCount(id);
  }
}
