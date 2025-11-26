import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('content/:contentId')
  findByContent(
    @Param('contentId') contentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commentsService.findByContent(contentId, +page, +limit);
  }

  @Post()
  create(@Body() data: { contentId: string; userName: string; text: string }) {
    return this.commentsService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }

  @Post(':id/like')
  likeComment(@Param('id') id: string) {
    return this.commentsService.likeComment(id);
  }
}
