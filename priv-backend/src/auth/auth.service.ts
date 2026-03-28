import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { LoginUserDto, RegisterUserDto } from './auth.dto';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register (dto: RegisterUserDto) {
        const exists = await this.prisma.user.findUnique({ where: {email: dto.email}})
        if (exists) throw new ConflictException("Email already registed")
        const hashed = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email, 
                password: hashed
            }
        });

        return this.signToken(user)
    }

    async login ( dto: LoginUserDto ) {
        const user = await this.prisma.user.findUnique({ where: {email: dto.email}})

        if (!user) {
            return {
                success: false, 
                message: "user not found",
            }
        }

        const isMatched = await bcrypt.compare(dto.password, user.password);
        if (!isMatched) {
            return {
                success: false, 
                message: "Incorrect password",
            }
        }

        return this.signToken(user)
    }

    private async signToken(user: User): Promise<{ accessToken: string }> {
        const accessToken = await this.jwtService.signAsync({
            role: user.role,
            userId: user.id,
            email: user.email,
        });

        return { accessToken }
    }
}
