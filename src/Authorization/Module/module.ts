import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../Strategy/strategy';
import { RolesGuard } from '../Guard/role';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, RolesGuard, Reflector],
  exports: [PassportModule],
})
export class AuthModule {}