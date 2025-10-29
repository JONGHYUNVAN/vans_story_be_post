/**
 * 카테고리 서비스
 * 
 * 카테고리 관련 비즈니스 로직을 처리합니다.
 * MongoDB와의 데이터 상호작용을 담당하며, CRUD 연산을 제공합니다.
 * 
 * @module service/category.service
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from '../dto';

/**
 * 카테고리 서비스 클래스
 * 
 * 카테고리 데이터의 생성, 조회, 수정, 삭제 기능을 제공합니다.
 * 
 * @class CategoryService
 */
@Injectable()
export class CategoryService {
  /**
   * CategoryService 생성자
   * 
   * @param {Model<CategoryDocument>} categoryModel - 카테고리 모델 인스턴스
   */
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * 새로운 카테고리를 생성합니다.
   * 
   * @param {CreateCategoryDto} createCategoryDto - 카테고리 생성 데이터
   * @returns {Promise<CategoryResponseDto>} 생성된 카테고리 정보
   * @throws {ConflictException} 동일한 value를 가진 카테고리가 이미 존재하는 경우
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // 중복 value 체크
    const existingCategory = await this.categoryModel.findOne({ 
      value: createCategoryDto.value 
    });

    if (existingCategory) {
      throw new ConflictException(`카테고리 '${createCategoryDto.value}'가 이미 존재합니다.`);
    }

    const createdCategory = new this.categoryModel(createCategoryDto);
    const savedCategory = await createdCategory.save();
    
    return this.toResponseDto(savedCategory);
  }

  /**
   * 모든 카테고리를 조회합니다.
   * 
   * @param {boolean} [activeOnly=false] - 활성화된 카테고리만 조회할지 여부
   * @returns {Promise<CategoryResponseDto[]>} 카테고리 목록
   */
  async findAll(activeOnly: boolean = false): Promise<CategoryResponseDto[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const categories = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .exec();

    return categories.map(category => this.toResponseDto(category));
  }

  /**
   * 그룹별로 카테고리를 조회합니다.
   * 
   * @param {boolean} [activeOnly=false] - 활성화된 카테고리만 조회할지 여부
   * @returns {Promise<Record<string, CategoryResponseDto[]>>} 그룹별 카테고리 목록
   */
  async findByGroup(activeOnly: boolean = false): Promise<Record<string, CategoryResponseDto[]>> {
    const categories = await this.findAll(activeOnly);
    
    return categories.reduce((grouped, category) => {
      if (!grouped[category.group]) {
        grouped[category.group] = [];
      }
      grouped[category.group].push(category);
      return grouped;
    }, {} as Record<string, CategoryResponseDto[]>);
  }

  /**
   * ID로 특정 카테고리를 조회합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 카테고리 정보
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   */
  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findById(id).exec();
    
    if (!category) {
      throw new NotFoundException(`ID '${id}'인 카테고리를 찾을 수 없습니다.`);
    }

    return this.toResponseDto(category);
  }

  /**
   * value로 특정 카테고리를 조회합니다.
   * 
   * @param {string} value - 카테고리 값
   * @returns {Promise<CategoryResponseDto>} 카테고리 정보
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   */
  async findByValue(value: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findOne({ value }).exec();
    
    if (!category) {
      throw new NotFoundException(`값 '${value}'인 카테고리를 찾을 수 없습니다.`);
    }

    return this.toResponseDto(category);
  }

  /**
   * 카테고리를 업데이트합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @param {UpdateCategoryDto} updateCategoryDto - 업데이트할 데이터
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   * @throws {ConflictException} 업데이트하려는 value가 이미 존재하는 경우
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    // value 변경 시 중복 체크
    if (updateCategoryDto.value) {
      const existingCategory = await this.categoryModel.findOne({ 
        value: updateCategoryDto.value,
        _id: { $ne: id }
      });

      if (existingCategory) {
        throw new ConflictException(`카테고리 '${updateCategoryDto.value}'가 이미 존재합니다.`);
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`ID '${id}'인 카테고리를 찾을 수 없습니다.`);
    }

    return this.toResponseDto(updatedCategory);
  }

  /**
   * 카테고리를 삭제합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<void>}
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   */
  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException(`ID '${id}'인 카테고리를 찾을 수 없습니다.`);
    }
  }

  /**
   * 카테고리를 비활성화합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   */
  async deactivate(id: string): Promise<CategoryResponseDto> {
    return this.update(id, { isActive: false });
  }

  /**
   * 카테고리를 활성화합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   * @throws {NotFoundException} 카테고리를 찾을 수 없는 경우
   */
  async activate(id: string): Promise<CategoryResponseDto> {
    return this.update(id, { isActive: true });
  }

  /**
   * 카테고리 엔티티를 응답 DTO로 변환합니다.
   * 
   * @private
   * @param {CategoryDocument} category - 카테고리 문서
   * @returns {CategoryResponseDto} 응답 DTO
   */
  private toResponseDto(category: CategoryDocument): CategoryResponseDto {
    return {
      id: category._id.toString(),
      group: category.group,
      value: category.value,
      label: category.label,
      description: category.description,
      iconName: category.iconName,
      color: category.color,
      path: category.path,
      subCategories: category.subCategories || [],
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

