import { CreateDto, UpdateDto, ResponseDto } from '../../src/DTO/dto';
import { Types } from 'mongoose';

export const mockCreateDto: CreateDto = {
  title: '테스트 게시글',
  content: '테스트 내용',
  theme: 'light',
  category: 'general',
  description: '테스트 설명',
  tags: ['테스트'],
  topic: '테스트 주제'
};

export const mockUpdateDto: UpdateDto = {
  title: '수정된 테스트 게시글',
  content: '수정된 테스트 내용'
};

export const mockResponseDto: ResponseDto = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  title: '테스트 게시글',
  content: '테스트 내용',
  theme: 'light',
  category: 'general',
  authorEmail: 'test@example.com',
  author: '테스트 작성자',
  viewCount: 0,
  createdAt: "2025. 3. 24. 오후 9:14:10",
  updatedAt: "2025. 4. 27. 오후 7:47:51",
  description: '테스트 설명',
  tags: ['테스트'],
  topic: '테스트 주제',
  thumbnail: '',
  language: 'ko',
  likeCount: 0
};

export const mockPaginatedResponse = {
  data: [mockResponseDto],
  meta: {
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  }
}; 