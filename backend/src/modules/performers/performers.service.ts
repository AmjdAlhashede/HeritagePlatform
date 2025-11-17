import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Performer } from './performers.entity';
import { CreatePerformerDto, UpdatePerformerDto } from './dto';

@Injectable()
export class PerformersService {
  constructor(
    @InjectRepository(Performer)
    private performersRepository: Repository<Performer>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [performers, total] = await this.performersRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: performers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const performer = await this.performersRepository.findOne({
      where: { id },
      relations: ['content'],
    });

    if (!performer) {
      throw new NotFoundException(`Performer with ID ${id} not found`);
    }

    return performer;
  }

  async create(createPerformerDto: CreatePerformerDto) {
    const performer = this.performersRepository.create(createPerformerDto);
    return this.performersRepository.save(performer);
  }

  async update(id: string, updatePerformerDto: UpdatePerformerDto) {
    const performer = await this.findOne(id);
    Object.assign(performer, updatePerformerDto);
    return this.performersRepository.save(performer);
  }

  async remove(id: string) {
    const performer = await this.findOne(id);
    performer.isActive = false;
    return this.performersRepository.save(performer);
  }
}
