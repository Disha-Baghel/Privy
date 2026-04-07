import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebrtcService } from './webrtc.service';

@Controller('webrtc')
@UseGuards(JwtAuthGuard)
export class WebrtcController {
  constructor(private readonly webrtcService: WebrtcService) {}

  @Get('ice-config')
  getIceConfig() {
    return this.webrtcService.getIceConfiguration();
  }
}
