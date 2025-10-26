/**
 * DTO 모듈 인덱스 파일
 * 
 * 모든 DTO 클래스를 중앙에서 관리하고 export합니다.
 * 
 * @module dto/index
 */

export { CreatePostDto } from './create-post.dto';
export { UpdatePostDto } from './update-post.dto';
export { PostResponseDto } from './post-response.dto';

// 기존 이름과의 호환성을 위한 alias
export { CreatePostDto as CreateDto } from './create-post.dto';
export { UpdatePostDto as UpdateDto } from './update-post.dto';
export { PostResponseDto as ResponseDto } from './post-response.dto';
