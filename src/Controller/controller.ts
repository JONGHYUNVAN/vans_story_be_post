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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateDto, UpdateDto, ResponseDto } from '../Dto/dto';
import { PaginateQuery } from 'nestjs-paginate';

@ApiTags('api/posts')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({ status: 201, description: '게시글 생성 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Roles('admin')
  @Post()
  create(@Body() createDto: CreateDto, @Request() request: any): Promise<ResponseDto> {
    return this.postsService.create(createDto, request.user.sub);
  }

  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공', type: [ResponseDto] })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Get()
  findAll(@Query() query: PaginateQuery): Promise<any> {
    return this.postsService.findAll(query);
  }

  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, description: '게시글 상세 조회 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Get(':id')
  findOne(@Param('id') id: number): Promise<ResponseDto> {
    return this.postsService.findOne(id);
  }

  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, description: '게시글 수정 성공', type: ResponseDto })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateDto): Promise<ResponseDto> {
    return this.postsService.update(id, updateDto);
  }

  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 204, description: '게시글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.postsService.remove(id);
  }
}
