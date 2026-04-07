import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SignalingGateway } from './signaling.gateway';

@Module({
  imports: [JwtModule],
  providers: [SignalingGateway],
})
export class SignalingModule {}
