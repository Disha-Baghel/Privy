import { Injectable } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService
    ) {}

    async findAllUsers() {
        return this.prisma.user.findMany({where: { role: Roles.user }})
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id , role: Roles.user}
        })
    }
}
