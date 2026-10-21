/**
 * 게시글 모듈
 * 
 * 게시글 관련 기능을 제공하는 NestJS 모듈입니다.
 * 컨트롤러, 서비스, 데이터베이스 스키마 등을 등록하고 관리합니다.
 * 
 * @module Module/module
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from '../Controller/controller';
import { PostsService } from '../Service/service';
import { Post, PostSchema } from '../schemas/post.schema';
import { InternalApiClient } from '../../../utils/Api/api';
import { PostInitService } from '../../../database/init/post.init';
import { Category, CategorySchema } from '../../category/schemas/category.schema';
import { AuthModule } from '../../../utils/Authorization/Module/module';

/**
 * 게시글 기능 모듈
 * 
 * 게시글의 생성, 조회, 수정, 삭제 등의 기능을 제공합니다.
 * MongoDB 연결, HTTP 통신, 컨트롤러 및 서비스 등을 포함합니다.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Category.name, schema: CategorySchema }
    ]),
    HttpModule,
    // Nest 12: 가드(JwtAuthGuard)의 의존성(JwtService)은 가드를 사용하는 모듈 안에서 해석되므로 AuthModule을 명시적으로 import
    AuthModule
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    InternalApiClient,
    PostInitService
  ],
  exports: [PostsService]
})
export class PostsModule {}