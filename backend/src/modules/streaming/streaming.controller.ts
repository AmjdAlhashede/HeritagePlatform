import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { StreamingService } from './streaming.service';

@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get('video/:contentId/playlist.m3u8')
  async getHLSPlaylist(
    @Param('contentId') contentId: string,
    @Res() res: Response,
  ) {
    const playlist = await this.streamingService.getHLSPlaylist(contentId);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(playlist);
  }

  @Get('video/:contentId/segment/:segmentName')
  async getHLSSegment(
    @Param('contentId') contentId: string,
    @Param('segmentName') segmentName: string,
  ): Promise<StreamableFile> {
    return this.streamingService.getHLSSegment(contentId, segmentName);
  }

  @Get('audio/:contentId')
  async getAudio(
    @Param('contentId') contentId: string,
  ): Promise<StreamableFile> {
    return this.streamingService.getAudio(contentId);
  }

  @Get('download/:contentId')
  async downloadContent(
    @Param('contentId') contentId: string,
    @Res() res: Response,
  ) {
    const file = await this.streamingService.getDownloadFile(contentId);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimeType);
    return new StreamableFile(file.stream);
  }
}
