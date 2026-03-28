import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
    constructor(
        private userService: UsersService,
    ) {}

    @Get()
    @ApiBearerAuth()
    async getUsers() {
        return this.userService.findAllUsers();
    }

    @Get(':id')
    @ApiBearerAuth()
    async getUserbyId(@Param('id') id: string) {
        return this.userService.findById(id);
    }
}
