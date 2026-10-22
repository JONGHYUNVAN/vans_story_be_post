/**
 * 애플리케이션 루트 모듈
 * 
 * 애플리케이션의 모든 모듈을 조합하고 환경 설정을 초기화하는 루트 모듈입니다.
 * 
 * @module app.module
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PostsModule } from './modules/post/Module/module';
import { CategoryModule } from './modules/category/module/category.module';
import { AuthModule } from './utils/Authorization/Module/module';

/**
 * 애플리케이션 루트 모듈 클래스
 *
 * MongoDB 연결, HTTP 통신, 게시글 및 인증 모듈 등을 통합합니다.
 * `ConfigModule`이 `.env`를 읽어 전역 `ConfigService`로 제공합니다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    HttpModule,
    PostsModule,
    CategoryModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
