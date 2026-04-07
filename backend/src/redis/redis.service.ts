import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.redis.sadd('online_users', userId);
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.redis.srem('online_users', userId);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember('online_users', userId)) === 1;
  }

  async setSocketForUser(userId: string, socketId: string): Promise<void> {
    await this.redis.hset('user_sockets', userId, socketId);
  }

  async deleteSocketForUser(userId: string): Promise<void> {
    await this.redis.hdel('user_sockets', userId);
  }

  async getSocketForUser(userId: string): Promise<string | null> {
    return this.redis.hget('user_sockets', userId);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
