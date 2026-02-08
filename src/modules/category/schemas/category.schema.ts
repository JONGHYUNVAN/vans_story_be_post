/**
 * Category 엔티티 정의
 * 
 * MongoDB에 저장되는 카테고리 데이터의 구조를 정의합니다.
 * 메인 카테고리와 서브 카테고리의 계층 구조를 관리합니다.
 * 
 * @module schemas/category.schema
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
 * 카테고리 엔티티 클래스
 * 
 * 메인 카테고리와 서브 카테고리를 모두 관리합니다.
 * parentId가 null이면 메인 카테고리, 값이 있으면 서브 카테고리입니다.
 * 
 * @class Category
 */
@Schema({
  timestamps: true,
  collection: 'categories'
})
export class Category {
  /**
   * 부모 카테고리 ID (null이면 메인 카테고리)
   * 
   * @type {Types.ObjectId | null}
   */
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId: Types.ObjectId | null;

  /**
   * 카테고리 그룹 (Frontend, Backend, Database, IT, Test, Etc)
   * 메인 카테고리에만 적용
   * 
   * @type {string}
   */
  @Prop({ required: false })
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
   * 메인 카테고리에만 적용
   * 
   * @type {string}
   */
  @Prop({ required: false })
  iconName: string;

  /**
   * 아이콘 색상 (HEX 코드)
   * 메인 카테고리에만 적용
   * 
   * @type {string}
   */
  @Prop({ required: false })
  color: string;

  /**
   * 카테고리 경로
   * 
   * @type {string}
   */
  @Prop({ required: true })
  path: string;

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
 * Category 클래스에서 생성된 Mongoose 스키마
 */
export const CategorySchema = SchemaFactory.createForClass(Category);
