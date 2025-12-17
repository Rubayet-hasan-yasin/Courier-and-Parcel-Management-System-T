import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { EnvConfig } from '../../helper/config/env.config';

export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    const token = request?.cookies?.access_token;
                    return token || null;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: EnvConfig.JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
