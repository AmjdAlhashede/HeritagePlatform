import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private likesService: LikesService) {}

  @Post(':contentId')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('contentId') contentId: string, @Request() req) {
    const userId = req.user.sub || req.user.id;
    return this.likesService.toggleLike(userId, contentId);
  }

  @Get('content/:contentId')
  async getLikesCount(@Param('contentId') contentId: string) {
    const count = await this.likesService.getLikesCount(contentId);
    return { count };
  }

  @Get('user/check/:contentId')
  @UseGuards(JwtAuthGuard)
  async checkLike(@Param('contentId') contentId: string, @Request() req) {
    const userId = req.user.sub || req.user.id;
    const liked = await this.likesService.isLiked(userId, contentId);
    return { liked };
  }

  @Get('user/all')
  @UseGuards(JwtAuthGuard)
  async getUserLikes(@Request() req) {
    const userId = req.user.sub || req.user.id;
    const contentIds = await this.likesService.getUserLikes(userId);
    return { contentIds };
  }
}
