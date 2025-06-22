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
  Headers,
} from '@nestjs/common';
import { PostsService } from '../Service/service';
import { JwtAuthGuard } from '../../../utils/Authorization/Guard/auth';
import { Roles } from 'src/utils/Authorization/Guard/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO/dto';
import { Paginated } from '../../../utils/types/pagination';

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
   * 
   * @example
   * **Request Headers:**
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * Content-Type: application/json
   * ```
   * 
   * **Request Body:**
   * ```json
   * {
   *   "title": "새로운 게시글 제목",
   *   "topic": "게시글 주제",
   *   "description": "게시글에 대한 간단한 설명입니다.",
   *   "content": {
   *     "type": "doc",
   *     "content": [
   *       {
   *         "type": "paragraph",
   *         "content": [
   *           {
   *             "type": "text",
   *             "text": "게시글의 본문 내용입니다."
   *           }
   *         ]
   *       }
   *     ]
   *   },
   *   "theme": "nest.js",
   *   "category": "introduction",
   *   "tags": ["React", "JavaScript", "Frontend"],
   *   "thumbnail": "thumbnail.jpg",
   *   "language": "ko"
   * }
   * ```
   * 
   * **Response:**
   * ```json
   * {
   *   "_id": "507f1f77bcf86cd799439011",
   *   "title": "새로운 게시글 제목",
   *   "topic": "게시글 주제",
   *   "description": "게시글에 대한 간단한 설명입니다.",
   *   "content": {
   *     "type": "doc",
   *     "content": [
   *       {
   *         "type": "paragraph",
   *         "content": [
   *           {
   *             "type": "text",
   *             "text": "게시글의 본문 내용입니다."
   *           }
   *         ]
   *       }
   *     ]
   *   },
   *   "theme": "nest.js",
   *   "category": "introduction",
   *   "authorEmail": "admin@example.com",
   *   "author": "관리자",
   *   "tags": ["React", "JavaScript", "Frontend"],
   *   "viewCount": 0,
   *   "likeCount": 0,
   *   "thumbnail": "thumbnail.jpg",
   *   "language": "ko",
   *   "createdAt": "2025. 1. 21. 오후 2:30:15",
   *   "updatedAt": "2025. 1. 21. 오후 2:30:15"
   * }
   * ```
   */
  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({ status: 201, description: '게시글 생성 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth('Authorization')
  @Post()
  create(@Body() createDto: CreateDto, @Request() request: any): Promise<ResponseDto> {
    return this.postsService.create(createDto, request.user.sub);
  }

  /**
   * 게시글 목록을 조회합니다.
   * 
   * 테마, 카테고리, 페이지네이션 등의 쿼리 파라미터를 지원합니다.
   * 인증 없이 접근 가능한 공개 엔드포인트입니다.
   * 
   * @param {string} [theme] - 필터링할 게시글 테마 (선택사항)
   * @param {string} [category] - 필터링할 게시글 카테고리 (선택사항)
   * @param {number} [page] - 페이지 번호 (기본값: 1)
   * @param {number} [limit] - 페이지당 게시글 수 (기본값: 10)
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
   * 
   * @example
   * **Request URL:**
   * ```
   * GET /api/v1/posts?theme=dark&category=introduction&page=1&limit=10
   * ```
   * 
   * **Response:**
   * ```json
   * {
   *   "data": [
   *     {
   *       "_id": "507f1f77bcf86cd799439011",
   *       "title": "첫 번째 게시글",
   *       "topic": "소개",
   *       "description": "블로그를 시작하며 작성하는 첫 번째 글입니다.",
   *       "content": {
   *         "type": "doc",
   *         "content": [...]
   *       },
   *       "theme": "nest.js",
   *       "category": "introduction",
   *       "authorEmail": "admin@example.com",
   *       "author": "관리자",
   *       "tags": ["블로그", "시작"],
   *       "viewCount": 42,
   *       "likeCount": 5,
   *       "thumbnail": "intro.jpg",
   *       "language": "ko",
   *       "createdAt": "2025. 1. 20. 오후 3:15:30",
   *       "updatedAt": "2025. 1. 21. 오전 10:20:45"
   *     }
   *   ],
   *   "meta": {
   *     "totalItems": 25,
   *     "currentPage": 1,
   *     "totalPages": 3,
   *     "itemsPerPage": 10
   *   }
   * }
   * ```
   */
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공', type: ResponseDto, isArray: true })
  @ApiQuery({ name: 'theme', required: false, description: '필터링할 게시글 테마' })
  @ApiQuery({ name: 'category', required: false, description: '필터링할 게시글 카테고리' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 게시글 수 (기본값: 10)' })
  async findAll(
    @Query('theme') theme?: string,
    @Query('category') category?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<Paginated<ResponseDto>> {
    return this.postsService.findAll(
      theme, 
      category, 
      parseInt(page, 10), 
      parseInt(limit, 10)
    );
  }

  /**
   * 특정 ID의 게시글 상세 정보를 조회합니다.
   * 
   * 인증 없이 접근 가능한 공개 엔드포인트입니다.
   * 게시글 ID를 경로 파라미터로 받아 해당 게시글을 조회합니다.
   * 
   * @param {string} id - 조회할 게시글의 MongoDB ObjectId
   * @param {string} [viewed] - 조회수 증가 여부 (true일 경우 조회수 1 증가)
   * @returns {Promise<ResponseDto>} 조회된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * **Request URL:**
   * ```
   * GET /api/v1/posts/507f1f77bcf86cd799439011
   * ```
   * 
   * **Request Headers (조회수 증가 시):**
   * ```
   * x-viewed: true
   * ```
   * 
   * **Response:**
   * ```json
   * {
   *   "_id": "507f1f77bcf86cd799439011",
   *   "title": "특정 게시글 제목",
   *   "topic": "특정 주제",
   *   "description": "이 게시글에 대한 상세한 설명입니다.",
   *   "content": {
   *     "type": "doc",
   *     "content": [
   *       {
   *         "type": "heading",
   *         "attrs": { "level": 1 },
   *         "content": [
   *           {
   *             "type": "text",
   *             "text": "제목"
   *           }
   *         ]
   *       },
   *       {
   *         "type": "paragraph",
   *         "content": [
   *           {
   *             "type": "text",
   *             "text": "상세한 게시글 내용이 여기에 포함됩니다."
   *           }
   *         ]
   *       }
   *     ]
   *   },
   *   "theme": "nest.js",
   *   "category": "tutorial",
   *   "authorEmail": "admin@example.com",
   *   "author": "관리자",
   *   "tags": ["튜토리얼", "가이드"],
   *   "viewCount": 156,
   *   "likeCount": 23,
   *   "thumbnail": "tutorial.jpg",
   *   "language": "ko",
   *   "createdAt": "2025. 1. 15. 오후 4:20:10",
   *   "updatedAt": "2025. 1. 18. 오전 11:35:22"
   * }
   * ```
   */
  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, description: '게시글 상세 조회 성공', type: ResponseDto })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectId (24자리 16진수 문자열, 예: 507f1f77bcf86cd799439011)',
    example: '507f1f77bcf86cd799439011'
  })
  findOne(
    @Param('id') id: string,
    @Headers('x-viewed') viewed?: string
  ): Promise<ResponseDto> {
    return this.postsService.findOne(id, viewed === 'true');
  }

  /**
   * 게시글 수정을 위한 조회 메서드입니다.
   * 
   * 인증된 사용자가 자신이 작성한 게시글만 수정할 수 있도록 권한을 확인합니다.
   * JWT 토큰의 이메일과 게시글의 작성자 이메일이 일치하는지 검증합니다.
   * 
   * @param {string} id - 조회할 게시글의 MongoDB ObjectId
   * @param {Request} request - 인증된 사용자 정보를 포함한 요청 객체
   * @returns {Promise<ResponseDto>} 수정 권한이 확인된 게시글 정보
   * 
   * @throws {UnauthorizedException} 인증되지 않은 사용자가 접근할 경우
   * @throws {ForbiddenException} 작성자가 아닌 사용자가 접근할 경우
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * **Request Headers:**
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   * 
   * **Request URL:**
   * ```
   * GET /api/v1/posts/507f1f77bcf86cd799439011/edit
   * ```
   * 
   * **Response:**
   * ```json
   * {
   *   "_id": "507f1f77bcf86cd799439011",
   *   "title": "수정할 게시글 제목",
   *   "topic": "수정할 주제",
   *   "description": "수정할 게시글에 대한 상세한 설명입니다.",
   *   "content": {
   *     "type": "doc",
   *     "content": [
   *       {
   *         "type": "paragraph",
   *         "content": [
   *           {
   *             "type": "text",
   *             "text": "수정할 게시글 내용이 여기에 포함됩니다."
   *           }
   *         ]
   *       }
   *     ]
   *   },
   *   "theme": "nest.js",
   *   "category": "tutorial",
   *   "authorEmail": "user@example.com",
   *   "author": "사용자",
   *   "tags": ["수정", "예제"],
   *   "viewCount": 42,
   *   "likeCount": 8,
   *   "thumbnail": "edit-example.jpg",
   *   "language": "ko",
   *   "createdAt": "2025. 1. 20. 오후 2:15:30",
   *   "updatedAt": "2025. 1. 21. 오전 9:20:15"
   * }
   * ```
   */
  @Get(':id/edit')
  @ApiOperation({ summary: '게시글 수정용 조회' })
  @ApiResponse({ status: 200, description: '게시글 수정용 조회 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '작성자가 아닌 사용자' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectId (24자리 16진수 문자열, 예: 507f1f77bcf86cd799439011)',
    example: '507f1f77bcf86cd799439011'
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  findForEdit(
    @Param('id') id: string,
    @Request() request: any
  ): Promise<ResponseDto> {
    return this.postsService.findForEdit(id, request.user.sub);
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * 인증된 사용자가 자신이 작성한 게시글을 수정하거나, 관리자가 모든 게시글을 수정할 수 있습니다.
   * 게시글 ID와 수정할 데이터를 받아 MongoDB에서 해당 게시글을 업데이트합니다.
   * 
   * @param {string} id - 수정할 게시글의 MongoDB ObjectId
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @param {Request} request - 인증된 사용자 정보를 포함한 요청 객체
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * 
   * @throws {UnauthorizedException} 인증되지 않은 사용자가 접근할 경우
   * @throws {ForbiddenException} 작성자나 관리자가 아닌 사용자가 접근할 경우
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * **Request Headers:**
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * Content-Type: application/json
   * ```
   * 
   * **Request URL:**
   * ```
   * PATCH /api/v1/posts/507f1f77bcf86cd799439011
   * ```
   * 
   * **Request Body (부분 업데이트):**
   * ```json
   * {
   *   "title": "수정된 게시글 제목",
   *   "description": "수정된 설명입니다.",
   *   "tags": ["수정된", "태그", "목록"]
   * }
   * ```
   * 
   * **Response:**
   * ```json
   * {
   *   "_id": "507f1f77bcf86cd799439011",
   *   "title": "수정된 게시글 제목",
   *   "topic": "기존 주제 (변경되지 않음)",
   *   "description": "수정된 설명입니다.",
   *   "content": {
   *     "type": "doc",
   *     "content": [...]
   *   },
   *   "theme": "nest.js",
   *   "category": "tutorial",
   *   "authorEmail": "user@example.com",
   *   "author": "사용자",
   *   "tags": ["수정된", "태그", "목록"],
   *   "viewCount": 156,
   *   "likeCount": 23,
   *   "thumbnail": "tutorial.jpg",
   *   "language": "ko",
   *   "createdAt": "2025. 1. 15. 오후 4:20:10",
   *   "updatedAt": "2025. 1. 21. 오후 3:45:12"
   * }
   * ```
   */
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, description: '게시글 수정 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '수정 권한이 없는 사용자' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateDto,
    @Request() request: any
  ): Promise<ResponseDto> {
    return this.postsService.update(id, updateDto, request.user.sub, request.user.role);
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
   * 
   * @example
   * **Request Headers:**
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   * 
   * **Request URL:**
   * ```
   * DELETE /api/v1/posts/507f1f77bcf86cd799439011
   * ```
   * 
   * **Response:**
   * ```
   * Status: 204 No Content
   * (응답 본문 없음)
   * ```
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
}
