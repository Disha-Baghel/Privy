import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

type AuthSocket = Socket & { data: { userId?: string } };
type SessionDescriptionPayload = {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp: string;
};

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/signaling',
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SignalingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: AuthSocket): Promise<void> {
    try {
      const token = client.handshake.auth.token as string | undefined;
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      client.data.userId = payload.sub;
      await this.redisService.setUserOnline(payload.sub);
      await this.redisService.setSocketForUser(payload.sub, client.id);
      this.logger.log(`Socket connected ${client.id} user=${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthSocket): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;
    await this.redisService.deleteSocketForUser(userId);
    await this.redisService.setUserOffline(userId);
    this.logger.log(`Socket disconnected ${client.id} user=${userId}`);
  }

  /**
   * Deliver to peer socket via Redis mapping. Retries briefly: the client may receive `connect`
   * before our async handleConnection finishes registering the socket id.
   */
  private async emitToUser(targetUserId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const socketId = await this.redisService.getSocketForUser(targetUserId);
      if (socketId) {
        this.server.to(socketId).emit(event, payload);
        return;
      }
      await delay(100);
    }
    this.logger.warn(`emit ${event}: no socket for user ${targetUserId} after retries`);
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() body: { roomId: string }): Promise<void> {
    await client.join(body.roomId);
    this.server.to(body.roomId).emit('presence', { userId: client.data.userId, online: true });
  }

  @SubscribeMessage('leave')
  async onLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() body: { roomId: string }): Promise<void> {
    await client.leave(body.roomId);
  }

  @SubscribeMessage('offer')
  async onOffer(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string; sdp: SessionDescriptionPayload },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'offer', payload as Record<string, unknown>);
  }

  @SubscribeMessage('answer')
  async onAnswer(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string; sdp: SessionDescriptionPayload },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'answer', payload as Record<string, unknown>);
  }

  @SubscribeMessage('ice-candidate')
  async onIceCandidate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    body: {
      roomId: string;
      targetUserId: string;
      candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };
    },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'ice-candidate', payload as Record<string, unknown>);
  }

  @SubscribeMessage('public-key')
  async onPublicKey(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string; key: Record<string, unknown> },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'public-key', payload as Record<string, unknown>);
  }

  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string; isTyping: boolean },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'typing', payload as Record<string, unknown>);
  }

  @SubscribeMessage('read-receipt')
  async onReadReceipt(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string; messageId: string },
  ): Promise<void> {
    const payload = { ...body, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'read-receipt', payload as Record<string, unknown>);
  }

  @SubscribeMessage('session-end')
  async onSessionEnd(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; targetUserId: string },
  ): Promise<void> {
    const payload = { roomId: body.roomId, targetUserId: body.targetUserId, fromUserId: client.data.userId };
    await this.emitToUser(body.targetUserId, 'session-end', payload as Record<string, unknown>);
  }
}
