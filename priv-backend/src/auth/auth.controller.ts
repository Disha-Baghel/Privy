import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './auth.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @ApiBody({type: RegisterUserDto})
    async register(@Body() body: RegisterUserDto) {
        return this.authService.register(body);
    }

    @Post('login')
    @ApiBody({ type: LoginUserDto})
    async login(@Body() body: LoginUserDto) {
        return this.authService.login(body);
    }
}
