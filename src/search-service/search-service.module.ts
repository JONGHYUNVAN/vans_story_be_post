import { Module } from '@nestjs/common';
import { SearchServiceClient } from './search-service.client';

/**
 * Django 검색 서비스 연동 모듈
 */
@Module({
  providers: [SearchServiceClient],
  exports: [SearchServiceClient],
})
export class SearchServiceModule {}
