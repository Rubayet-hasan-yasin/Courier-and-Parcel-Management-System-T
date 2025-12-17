import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtAuthStrategy } from './strategies/jwt.strategy';
import { EnvConfig } from '../helper/config/env.config';

/**
 * Auth Module
 * Handles authentication and authorization
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: EnvConfig.JWT_SECRET,
      signOptions: {
        expiresIn: '7d' as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthStrategy],
  exports: [AuthService],
})
export class AuthModule { }
