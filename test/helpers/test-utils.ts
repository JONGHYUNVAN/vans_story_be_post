import { Model } from 'mongoose';
import { Post, PostDocument } from '../../src/modules/post/entities/post.entity';
import { MockGenerator } from './mock-generator';
import { ResponseDto } from '../../src/modules/post/dto';
import { Types } from 'mongoose';

export const createMockPostModel = () => {
  const mockResponse = MockGenerator.createMock(ResponseDto, {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    authorEmail: 'test@example.com',
    author: '테스트 작성자'
  });

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