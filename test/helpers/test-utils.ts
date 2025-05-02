import { Model } from 'mongoose';
import { Post, PostDocument } from '../../src/schemas/post.schema';
import { mockResponseDto } from '../fixtures/post-test-data';

export const createMockPostModel = () => {
  const mockModel = {
    create: jest.fn().mockResolvedValue({
      toObject: () => mockResponseDto
    }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockResponseDto])
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponseDto
      })
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponseDto
      })
    }),
    findByIdAndDelete: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        toObject: () => mockResponseDto
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