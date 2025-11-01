import { Model } from 'mongoose';
import { Post, PostDocument } from '../../src/modules/post/entities/post.entity';
import { MockGenerator } from './mock-generator';
import { ResponseDto } from '../../src/modules/post/dto';
import { Types } from 'mongoose';

// 고정된 Mock 응답 생성
const createFixedMockResponse = (): ResponseDto => {
  return {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    title: '테스트 게시글 제목',
    content: {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: '테스트 게시글 내용입니다.'
        }]
      }]
    },
    mainCategory: 'light',
    subCategory: 'introduction',
    description: '테스트 게시글 설명입니다.',
    tags: ['테스트', '태그'],
    topic: '테스트 주제',
    language: 'ko',
    thumbnail: 'thumbnail.jpg',
    authorEmail: 'test@example.com',
    author: '테스트 작성자',
    createdAt: '2025-11-01T00:00:00.000Z',
    updatedAt: '2025-11-01T00:00:00.000Z',
    viewCount: 0,
    likeCount: 0
  } as ResponseDto;
};

export const createMockPostModel = () => {
  const mockResponse = createFixedMockResponse();

  const mockModel = {
    create: jest.fn().mockResolvedValue({
      toObject: () => mockResponse
    }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockResponse])
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponse
      })
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponse
      })
    }),
    findByIdAndDelete: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponse
      })
    }),
    countDocuments: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1)
    })
  };

  return mockModel as unknown as Model<PostDocument>;
};

export const createMockApiClient = () => {
  return {
    getUserNickname: jest.fn().mockResolvedValue('테스트 작성자')
  };
}; 