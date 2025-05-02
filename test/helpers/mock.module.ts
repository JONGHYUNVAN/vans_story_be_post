import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { TestAuthGuard } from './test-auth.guard';
import { JwtAuthGuard } from '../../src/utils/Authorization/Guard/auth';
import { InternalApiClient } from '../../src/utils/Api/api';
import { MockInternalApiClient } from './mock-api.client';

@Module({
  imports: [
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    {
      provide: JwtAuthGuard,
      useClass: TestAuthGuard,
    },
    {
      provide: InternalApiClient,
      useClass: MockInternalApiClient,
    }
  ],
  exports: [JwtModule],
})
export class MockAuthModule {} 