import * as dotenv from 'dotenv';
import * as path from 'path';
import { TestAuthGuard } from './helpers/test-auth.guard';

// .env.test 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// 테스트 환경 설정
export const setupTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
};

// 테스트용 인증 가드 설정
export const mockAuthGuard = {
  provide: 'APP_GUARD',
  useClass: TestAuthGuard,
}; 