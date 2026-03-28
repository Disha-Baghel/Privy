import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() body: RegisterUserDto) {
        return this.authService.register(body);
    }

    @Post('login')
    async login(@Body() body: LoginUserDto) {
        return this.authService.login(body);
    }
}
