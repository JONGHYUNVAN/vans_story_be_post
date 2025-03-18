/**
 * 애플리케이션 루트 모듈
 * 
 * 애플리케이션의 모든 모듈을 조합하고 환경 설정을 초기화하는 루트 모듈입니다.
 * 
 * @module app.module
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import * as dotenv from 'dotenv';
import { PostsModule } from './Module/module';
import { AuthModule } from './utils/Authorization/Module/module';
import { mongooseConfig } from './config/database';
dotenv.config();

/**
 * 애플리케이션 루트 모듈 클래스
 * 
 * MongoDB 연결, HTTP 통신, 게시글 및 인증 모듈 등을 통합합니다.
 * dotenv를 통해 환경 변수를 로드하여 애플리케이션 설정을 관리합니다.
 */
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    HttpModule,
    PostsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
