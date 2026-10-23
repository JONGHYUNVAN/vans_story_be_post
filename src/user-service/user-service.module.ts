import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UserServiceClient } from './user-service.client';

/**
 * Spring 사용자 서비스 연동 모듈
 */
@Module({
  imports: [HttpModule],
  providers: [UserServiceClient],
  exports: [UserServiceClient],
})
export class UserServiceModule {}
