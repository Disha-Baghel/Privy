import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequiredRoles } from 'src/auth/decorators/roles.decorator';
import { Roles } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@Controller('chat')
export class ChatController {
    constructor (
        private chatService: ChatService
    ) {}

    @Post('send')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequiredRoles(Roles.user)
    @ApiBody({ type: SendMessageDto })
    async sendMessage(@Req() req, @Body() dto: SendMessageDto) {
        return this.chatService.saveMessage(req.user.id, dto.receiverId, dto.content)
    }

    @Get('history')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequiredRoles(Roles.user)
    async getHistory( 
        @Req() req, 
        @Query('receiverId') receiverId: string,
    ) {
        const senderId = req.user.id;
        return this.chatService.getMessages(senderId, receiverId);
    }
}
