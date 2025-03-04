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
import { CreateDto, UpdateDto, ResponseDto } from '../Dto/dto';
import { PaginateQuery } from 'nestjs-paginate';

@ApiTags('api/v1/posts')
@Controller('api/v1/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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

  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공', type: [ResponseDto] })
  @Get()
  findAll(@Query() query: PaginateQuery): Promise<any> {
    return this.postsService.findAll(query);
  }

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
