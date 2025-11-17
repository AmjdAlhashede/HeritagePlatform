import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByProviderId(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { provider, providerId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createOrUpdate(data: {
    email?: string;
    name?: string;
    avatar?: string;
    provider: AuthProvider;
    providerId: string;
  }): Promise<User> {
    let user = await this.findByProviderId(data.provider, data.providerId);

    if (user) {
      // Update existing user
      user.email = data.email || user.email;
      user.name = data.name || user.name;
      user.avatar = data.avatar || user.avatar;
      return this.usersRepository.save(user);
    }

    // Create new user
    user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }
}
