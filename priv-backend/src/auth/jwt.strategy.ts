import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport";
import { Roles } from "@prisma/client";
import { ExtractJwt, Strategy } from 'passport-jwt'

export type JwtPayload = {
    role: Roles,
    userId: string,
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    validate(payload: JwtPayload): JwtPayload {
        return payload
    }
}