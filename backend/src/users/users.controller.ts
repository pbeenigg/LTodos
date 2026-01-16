import { Controller, Get, Query, UseGuards, Patch, Body, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(@Request() req, @Body() body: any) {
      // Allow updating name and notificationPreferences
      const { name, notificationPreferences } = body;
      return this.usersService.update(req.user.id, { name, notificationPreferences });
  }

  @Get('search')
  async search(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
        // Don't return password
        const { password, ...result } = user;
        return [result];
    }
    return [];
  }
}
