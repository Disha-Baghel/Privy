import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SignalingModule } from './signaling/signaling.module';
import { UsersModule } from './users/users.module';
import { WebrtcModule } from './webrtc/webrtc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN_SECONDS: Joi.number().default(86400),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        STUN_URL: Joi.string().required(),
        TURN_URL: Joi.string().required(),
        TURN_USERNAME: Joi.string().required(),
        TURN_CREDENTIAL: Joi.string().required(),
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    SignalingModule,
    WebrtcModule,
  ],
})
export class AppModule {}
