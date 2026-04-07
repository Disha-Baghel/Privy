import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: Request & { user: JwtPayload }) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Get()
  list(@Req() req: Request & { user: JwtPayload }) {
    return this.usersService.listUsers(req.user.sub);
  }
}
