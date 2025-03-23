/**
 * 게시글 관련 API 컨트롤러
 * 
 * 게시글의 생성, 조회, 수정, 삭제 등의 HTTP 요청을 처리합니다.
 * 이 컨트롤러는 '/api/v1/posts' 경로로 들어오는 모든 요청을 관리합니다.
 * 
 * @module Controller/controller
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PostsService } from '../Service/service';
import { JwtAuthGuard } from '../utils/Authorization/Guard/auth';
import { Roles } from 'src/utils/Authorization/Guard/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO/dto';
import { PaginateQuery } from 'nestjs-paginate';

/**
 * 게시글 컨트롤러 클래스
 * 
 * REST API 엔드포인트를 제공하며 클라이언트 요청을 처리합니다.
 * 사용자 인증과 권한 검사를 통해 보안을 유지합니다.
 */
@ApiTags('api/v1/posts')
@Controller('api/v1/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 새 게시글을 생성합니다.
   * 
   * 관리자 권한을 가진 인증된 사용자만 게시글을 생성할 수 있습니다.
   * 요청 본문에서 게시글 데이터를 받아 MongoDB에 저장합니다.
   * 
   * @param {CreateDto} createDto - 게시글 생성에 필요한 데이터 (제목, 내용 등)
   * @param {Request} request - 인증된 사용자 정보를 포함한 요청 객체
   * @returns {Promise<ResponseDto>} 생성된 게시글 정보
   * 
   * @throws {UnauthorizedException} 인증되지 않은 사용자가 접근할 경우
   * @throws {ForbiddenException} 관리자 권한이 없는 사용자가 접근할 경우
   */
  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({ status: 201, description: '게시글 생성 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth('Authorization')
  @Post()
  create(@Body() createDto: CreateDto, @Request() request: any): Promise<ResponseDto> {
    console.log('request.user:', request.user);
    console.log('request.user.sub:', request.user?.sub);
    return this.postsService.create(createDto, request.user.sub);
  }

  /**
   * 모든 게시글 목록을 페이지네이션과 함께 조회합니다.
   * 
   * 페이지, 정렬, 검색 등의 쿼리 파라미터를 지원합니다.
   * 인증 없이 접근 가능한 공개 엔드포인트입니다.
   * 
   * @param {PaginateQuery} query - 페이지네이션 쿼리 파라미터 (페이지, 제한, 정렬 등)
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
   */
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공', type: [ResponseDto] })
  @Get()
  findAll(@Query() query: PaginateQuery): Promise<any> {
    return this.postsService.findAll(query);
  }

  /**
   * 특정 ID의 게시글 상세 정보를 조회합니다.
   * 
   * 인증 없이 접근 가능한 공개 엔드포인트입니다.
   * 게시글 ID를 경로 파라미터로 받아 해당 게시글을 조회합니다.
   * 
   * @param {string} id - 조회할 게시글의 MongoDB ObjectId
   * @returns {Promise<ResponseDto>} 조회된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   */
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, description: '게시글 상세 조회 성공', type: ResponseDto })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectId (24자리 16진수 문자열, 예: 507f1f77bcf86cd799439011)',
    example: '507f1f77bcf86cd799439011'
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResponseDto> {
    return this.postsService.findOne(id);
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * 관리자 권한을 가진 인증된 사용자만 게시글을 수정할 수 있습니다.
   * 게시글 ID와 수정할 데이터를 받아 MongoDB에서 해당 게시글을 업데이트합니다.
   * 
   * @param {string} id - 수정할 게시글의 MongoDB ObjectId
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * 
   * @throws {UnauthorizedException} 인증되지 않은 사용자가 접근할 경우
   * @throws {ForbiddenException} 관리자 권한이 없는 사용자가 접근할 경우
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   */
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, description: '게시글 수정 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth('Authorization')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDto): Promise<ResponseDto> {
    return this.postsService.update(id, updateDto);
  }

  /**
   * 특정 ID의 게시글을 삭제합니다.
   * 
   * 관리자 권한을 가진 인증된 사용자만 게시글을 삭제할 수 있습니다.
   * 게시글 ID를 받아 MongoDB에서 해당 게시글을 영구적으로 삭제합니다.
   * 
   * @param {string} id - 삭제할 게시글의 MongoDB ObjectId
   * @returns {Promise<void>} 삭제 성공 시 void 반환
   * 
   * @throws {UnauthorizedException} 인증되지 않은 사용자가 접근할 경우
   * @throws {ForbiddenException} 관리자 권한이 없는 사용자가 접근할 경우
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   */
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 204, description: '게시글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth('Authorization')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.postsService.remove(id);
  }

  /**
   * 테마와 카테고리로 게시글을 필터링하여 검색합니다.
   * 
   * 테마 및 카테고리 쿼리 파라미터를 사용하여 게시글을 필터링합니다.
   * 인증 없이 접근 가능한 공개 엔드포인트입니다.
   * 
   * @param {string} [theme] - 필터링할 게시글 테마 (선택사항)
   * @param {string} [category] - 필터링할 게시글 카테고리 (선택사항)
   * @returns {Promise<ResponseDto[]>} 필터링된 게시글 목록
   */
  @ApiOperation({ summary: '테마와 카테고리로 게시글 검색' })
  @ApiResponse({ status: 200, description: '게시글 검색 성공', type: [ResponseDto] })
  @Get('search/filters')
  async findByThemeAndCategory(
    @Query('theme') theme?: string,
    @Query('category') category?: string
  ): Promise<ResponseDto[]> {
    return this.postsService.findByThemeAndCategory(theme, category);
  }
}
