/**
 * 카테고리 모듈
 * 
 * 카테고리 관련 컴포넌트들을 모듈로 구성합니다.
 * 컨트롤러, 서비스, 스키마를 등록하고 의존성을 관리합니다.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { AuthModule } from 'src/auth/auth.module';

/**
 * 카테고리 모듈 클래스
 * 
 * 카테고리 기능에 필요한 모든 컴포넌트를 등록하고 구성합니다.
 * MongoDB 스키마, 서비스, 컨트롤러를 포함합니다.
 * 
 * @class CategoriesModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema }
    ]),
    // Nest 12: 가드(JwtAuthGuard)의 의존성(JwtService)은 가드를 사용하는 모듈 안에서 해석되므로 AuthModule을 명시적으로 import
    AuthModule
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  // CategoriesService와 Category 모델(MongooseModule)을 다른 모듈에서 쓸 수 있도록 내보냄
  exports: [CategoriesService, MongooseModule],
})
export class CategoriesModule {}




