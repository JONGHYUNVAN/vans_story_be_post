/**
 * 애플리케이션 루트 모듈
 * 
 * 애플리케이션의 모든 모듈을 조합하고 환경 설정을 초기화하는 루트 모듈입니다.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PostsModule } from 'src/posts/posts.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { AuthModule } from 'src/auth/auth.module';
import { validateEnv } from 'src/config/env.validation';

/**
 * 애플리케이션 루트 모듈 클래스
 *
 * MongoDB 연결, HTTP 통신, 게시글 및 인증 모듈 등을 통합합니다.
 * `ConfigModule`이 `.env`를 읽어 `validateEnv`로 검증한 뒤 전역 `ConfigService`로 제공합니다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    HttpModule,
    PostsModule,
    CategoriesModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
