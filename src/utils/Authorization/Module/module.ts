import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../Strategy/strategy';
import { RolesGuard } from '../Guard/role';
import { Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [PassportModule, JwtModule.register({
    signOptions: { expiresIn: '60s', algorithm: 'HS512' },
    secret: Buffer.from(process.env.JWT_SECRET, 'base64')
  })],
  providers: [JwtStrategy, RolesGuard, Reflector],
  exports: [PassportModule, JwtModule],
})

export class AuthModule {}