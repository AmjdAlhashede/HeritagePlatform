import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PerformersService } from './performers.service';
import { CreatePerformerDto, UpdatePerformerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('performers')
export class PerformersController {
  constructor(private readonly performersService: PerformersService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.performersService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.performersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPerformerDto: CreatePerformerDto) {
    return this.performersService.create(createPerformerDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updatePerformerDto: UpdatePerformerDto) {
    return this.performersService.update(id, updatePerformerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.performersService.remove(id);
  }
}
