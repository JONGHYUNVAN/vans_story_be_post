/**
 * 카테고리 모듈
 * 
 * 카테고리 관련 컴포넌트들을 모듈로 구성합니다.
 * 컨트롤러, 서비스, 스키마를 등록하고 의존성을 관리합니다.
 * 
 * @module module/category.module
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryService } from '../service/category.service';
import { CategoryController } from '../controller/category.controller';
import { Category, CategorySchema } from '../schemas/category.schema';
import { AuthModule } from '../../../utils/Authorization/Module/module';

/**
 * 카테고리 모듈 클래스
 * 
 * 카테고리 기능에 필요한 모든 컴포넌트를 등록하고 구성합니다.
 * MongoDB 스키마, 서비스, 컨트롤러를 포함합니다.
 * 
 * @class CategoryModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema }
    ]),
    // Nest 12: 가드(JwtAuthGuard)의 의존성(JwtService)은 가드를 사용하는 모듈 안에서 해석되므로 AuthModule을 명시적으로 import
    AuthModule
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService], // 다른 모듈에서 CategoryService를 사용할 수 있도록 내보냄
})
export class CategoryModule {}




