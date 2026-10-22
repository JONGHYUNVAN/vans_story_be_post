/**
 * 인증 모듈
 * 
 * JWT 기반 인증을 위한 모듈 설정 및 관련 컴포넌트를 제공합니다.
 * 
 * @module utils/Authorization/Module/module
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../Strategy/strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * 인증 기능 모듈
 * 
 * JWT 인증, 역할 기반 접근 제어 등 인증 관련 기능을 제공합니다.
 * Passport와 JWT 모듈을 통합하고 관련 전략 및 가드를 설정합니다.
 */
@Module({
  imports: [PassportModule, JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      signOptions: { expiresIn: '60s', algorithm: 'HS512' },
      secret: Buffer.from(config.getOrThrow<string>('JWT_SECRET'), 'base64')
    })
  })],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})

export class AuthModule {}