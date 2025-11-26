import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../content/content.entity';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class StreamingService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async getHLSPlaylist(contentId: string): Promise<string> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content || !content.hlsUrl) {
      throw new NotFoundException('HLS playlist not found');
    }

    const playlistPath = join(process.cwd(), content.hlsUrl);
    
    if (!existsSync(playlistPath)) {
      throw new NotFoundException('HLS playlist file not found');
    }

    const fs = require('fs');
    return fs.readFileSync(playlistPath, 'utf-8');
  }

  async getHLSSegment(contentId: string, segmentName: string): Promise<StreamableFile> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content || !content.hlsUrl) {
      throw new NotFoundException('Content not found');
    }

    const segmentPath = join(
      process.cwd(),
      content.hlsUrl.replace('playlist.m3u8', segmentName),
    );

    if (!existsSync(segmentPath)) {
      throw new NotFoundException('Segment not found');
    }

    const file = createReadStream(segmentPath);
    return new StreamableFile(file);
  }

  async getAudio(contentId: string): Promise<StreamableFile> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content || !content.audioUrl) {
      throw new NotFoundException('Audio not found');
    }

    const audioPath = join(process.cwd(), content.audioUrl);

    if (!existsSync(audioPath)) {
      throw new NotFoundException('Audio file not found');
    }

    const file = createReadStream(audioPath);
    return new StreamableFile(file);
  }

  async getDownloadFile(contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const filePath = join(process.cwd(), content.originalFileUrl);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stream = createReadStream(filePath);
    const filename = `${content.title}.${content.type === 'video' ? 'mp4' : 'mp3'}`;
    const mimeType = content.type === 'video' ? 'video/mp4' : 'audio/mpeg';

    return { stream, filename, mimeType };
  }
}
