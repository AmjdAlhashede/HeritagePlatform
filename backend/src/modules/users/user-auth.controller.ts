import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { AuthProvider } from './users.entity';

@Controller('user-auth')
export class UserAuthController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post('google')
  async googleAuth(@Body() body: { token: string; email: string; name: string; avatar: string }) {
    // في الإنتاج، يجب التحقق من token مع Google
    // هنا نفترض أن الـ token صحيح
    
    const user = await this.usersService.createOrUpdate({
      email: body.email,
      name: body.name,
      avatar: body.avatar,
      provider: AuthProvider.GOOGLE,
      providerId: body.email, // استخدام email كـ providerId
    });

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  @Post('guest')
  async guestAuth(@Body() body: { deviceId: string }) {
    // تسجيل دخول كضيف
    const user = await this.usersService.createOrUpdate({
      name: 'ضيف',
      provider: AuthProvider.EMAIL,
      providerId: `guest_${body.deviceId}`,
    });

    const payload = { sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        isGuest: true,
      },
    };
  }
}
