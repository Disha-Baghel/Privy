import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebrtcService {
  constructor(private readonly configService: ConfigService) {}

  getIceConfiguration() {
    return {
      iceServers: [
        { urls: [this.configService.getOrThrow<string>('STUN_URL')] },
        {
          urls: [this.configService.getOrThrow<string>('TURN_URL')],
          username: this.configService.getOrThrow<string>('TURN_USERNAME'),
          credential: this.configService.getOrThrow<string>('TURN_CREDENTIAL'),
        },
      ],
      iceTransportPolicy: 'all',
    };
  }
}
