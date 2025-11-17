import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll() {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Category>) {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async update(id: string, data: Partial<Category>) {
    await this.categoryRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.categoryRepository.delete(id);
    return { message: 'تم الحذف بنجاح' };
  }

  async getCategoryContent(categoryId: string, page = 1, limit = 20) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['content', 'content.performer'],
    });

    if (!category) {
      throw new Error('القسم غير موجود');
    }

    const skip = (page - 1) * limit;
    const content = category.content.slice(skip, skip + limit);

    return {
      data: content,
      meta: {
        total: category.content.length,
        page,
        limit,
        totalPages: Math.ceil(category.content.length / limit),
      },
    };
  }
}
