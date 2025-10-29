/**
 * 카테고리 컨트롤러
 * 
 * 카테고리 관련 HTTP 요청을 처리합니다.
 * RESTful API 엔드포인트를 제공하며, Swagger 문서화를 포함합니다.
 * 
 * @module controller/category.controller
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryService } from '../service/category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from '../dto';
import { JwtAuthGuard } from '../../../utils/Authorization/Guard/auth';

/**
 * 카테고리 컨트롤러 클래스
 * 
 * 카테고리 관련 모든 HTTP 엔드포인트를 정의합니다.
 * JWT 인증이 필요한 엔드포인트와 공개 엔드포인트를 구분합니다.
 * 
 * @class CategoryController
 */
@ApiTags('api/v1/categories')
@Controller('api/v1/categories')
export class CategoryController {
  /**
   * CategoryController 생성자
   * 
   * @param {CategoryService} categoryService - 카테고리 서비스 인스턴스
   */
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 새로운 카테고리를 생성합니다.
   * 
   * @param {CreateCategoryDto} createCategoryDto - 카테고리 생성 데이터
   * @returns {Promise<CategoryResponseDto>} 생성된 카테고리 정보
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '카테고리 생성',
    description: '새로운 카테고리를 생성합니다. 관리자 권한이 필요합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '카테고리가 성공적으로 생성되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '동일한 값을 가진 카테고리가 이미 존재합니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증이 필요합니다.',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * 모든 카테고리를 조회합니다.
   * 
   * @param {boolean} [activeOnly] - 활성화된 카테고리만 조회할지 여부
   * @returns {Promise<CategoryResponseDto[]>} 카테고리 목록
   */
  @Get()
  @ApiOperation({
    summary: '카테고리 목록 조회',
    description: '모든 카테고리를 조회합니다. 활성화된 카테고리만 필터링할 수 있습니다.',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: '활성화된 카테고리만 조회할지 여부',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리 목록이 성공적으로 조회되었습니다.',
    type: [CategoryResponseDto],
  })
  async findAll(@Query('activeOnly') activeOnly?: boolean): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll(activeOnly);
  }

  /**
   * 그룹별로 카테고리를 조회합니다.
   * 
   * @param {boolean} [activeOnly] - 활성화된 카테고리만 조회할지 여부
   * @returns {Promise<Record<string, CategoryResponseDto[]>>} 그룹별 카테고리 목록
   */
  @Get('grouped')
  @ApiOperation({
    summary: '그룹별 카테고리 조회',
    description: '카테고리를 그룹별로 분류하여 조회합니다.',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: '활성화된 카테고리만 조회할지 여부',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '그룹별 카테고리 목록이 성공적으로 조회되었습니다.',
  })
  async findByGroup(
    @Query('activeOnly') activeOnly?: boolean,
  ): Promise<Record<string, CategoryResponseDto[]>> {
    return this.categoryService.findByGroup(activeOnly);
  }

  /**
   * ID로 특정 카테고리를 조회합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 카테고리 정보
   */
  @Get(':id')
  @ApiOperation({
    summary: '카테고리 상세 조회',
    description: 'ID로 특정 카테고리의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리 정보가 성공적으로 조회되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.findOne(id);
  }

  /**
   * value로 특정 카테고리를 조회합니다.
   * 
   * @param {string} value - 카테고리 값
   * @returns {Promise<CategoryResponseDto>} 카테고리 정보
   */
  @Get('value/:value')
  @ApiOperation({
    summary: '카테고리 값으로 조회',
    description: '카테고리 값(value)으로 특정 카테고리를 조회합니다.',
  })
  @ApiParam({
    name: 'value',
    description: '카테고리 값',
    example: 'nextjs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리 정보가 성공적으로 조회되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  async findByValue(@Param('value') value: string): Promise<CategoryResponseDto> {
    return this.categoryService.findByValue(value);
  }

  /**
   * 카테고리를 업데이트합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @param {UpdateCategoryDto} updateCategoryDto - 업데이트할 데이터
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '카테고리 수정',
    description: '기존 카테고리 정보를 수정합니다. 관리자 권한이 필요합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리가 성공적으로 수정되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '동일한 값을 가진 카테고리가 이미 존재합니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증이 필요합니다.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**
   * 카테고리를 삭제합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '카테고리 삭제',
    description: '카테고리를 완전히 삭제합니다. 관리자 권한이 필요합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '카테고리가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증이 필요합니다.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(id);
  }

  /**
   * 카테고리를 비활성화합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   */
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '카테고리 비활성화',
    description: '카테고리를 비활성화합니다. 관리자 권한이 필요합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리가 성공적으로 비활성화되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증이 필요합니다.',
  })
  async deactivate(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.deactivate(id);
  }

  /**
   * 카테고리를 활성화합니다.
   * 
   * @param {string} id - 카테고리 ID
   * @returns {Promise<CategoryResponseDto>} 업데이트된 카테고리 정보
   */
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '카테고리 활성화',
    description: '카테고리를 활성화합니다. 관리자 권한이 필요합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리가 성공적으로 활성화되었습니다.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '카테고리를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증이 필요합니다.',
  })
  async activate(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.activate(id);
  }
}
