import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '@prisma/client';
import { RequiredRoles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(
        private userService: UsersService,
    ) {}

    @Get('all')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequiredRoles(Roles.admin)
    async getUsers(@Req() req) {
        const userId = req.user.userId;

        console.log("admin : ", userId)
        return this.userService.findAllUsers();
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @RequiredRoles(Roles.user)
    async getUserbyId(@Param('id') id: string) {
        return this.userService.findById(id);
    }
}
