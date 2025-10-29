/**
 * Category 엔티티 정의
 * 
 * MongoDB에 저장되는 카테고리 데이터의 구조를 정의합니다.
 * 메인 카테고리와 서브 카테고리의 계층 구조를 관리합니다.
 * 
 * @module entities/category.entity
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 카테고리 문서 타입
 * 
 * @typedef {Category & Document} CategoryDocument
 */
export type CategoryDocument = Category & Document & {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 서브 카테고리 스키마
 * 
 * @interface SubCategory
 * @property {string} value - 서브 카테고리 값 (URL에 사용되는 키)
 * @property {string} label - 서브 카테고리 표시명
 * @property {string} [description] - 서브 카테고리 설명 (선택사항)
 */
@Schema({ _id: false })
export class SubCategory {
  /**
   * 서브 카테고리 값 (URL 키)
   */
  @Prop({ required: true })
  value: string;

  /**
   * 서브 카테고리 표시명
   */
  @Prop({ required: true })
  label: string;

  /**
   * 서브 카테고리 설명
   */
  @Prop({ required: false })
  description?: string;
}

/**
 * 카테고리 엔티티 클래스
 * 
 * 메인 카테고리와 해당하는 서브 카테고리들을 관리합니다.
 * 각 카테고리는 고유한 값(value)과 표시명(label), 아이콘 정보를 가집니다.
 * 
 * @class Category
 */
@Schema({
  timestamps: true,
  collection: 'categories'
})
export class Category {
  /**
   * 카테고리 그룹 (Frontend, Backend, Database, IT, Test, Etc)
   * 
   * @type {string}
   */
  @Prop({ required: true })
  group: string;

  /**
   * 카테고리 값 (URL에 사용되는 키)
   * 
   * @type {string}
   */
  @Prop({ required: true, unique: true })
  value: string;

  /**
   * 카테고리 표시명
   * 
   * @type {string}
   */
  @Prop({ required: true })
  label: string;

  /**
   * 카테고리 설명
   * 
   * @type {string}
   */
  @Prop({ required: false })
  description?: string;

  /**
   * 아이콘 이름 (React Icons 라이브러리 기준)
   * 
   * @type {string}
   */
  @Prop({ required: true })
  iconName: string;

  /**
   * 아이콘 색상 (HEX 코드)
   * 
   * @type {string}
   */
  @Prop({ required: true })
  color: string;

  /**
   * 카테고리 경로
   * 
   * @type {string}
   */
  @Prop({ required: true })
  path: string;

  /**
   * 서브 카테고리 목록
   * 
   * @type {SubCategory[]}
   */
  @Prop({ type: [SubCategory], default: [] })
  subCategories: SubCategory[];

  /**
   * 카테고리 활성화 여부
   * 
   * @type {boolean}
   */
  @Prop({ default: true })
  isActive: boolean;

  /**
   * 카테고리 정렬 순서
   * 
   * @type {number}
   */
  @Prop({ default: 0 })
  sortOrder: number;
}

/**
 * SubCategory 스키마 생성
 */
export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

/**
 * Category 클래스에서 생성된 Mongoose 스키마
 */
export const CategorySchema = SchemaFactory.createForClass(Category);
