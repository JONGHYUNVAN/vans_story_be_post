/**
 * MongoDB 데이터베이스 연결 설정 파일
 * 
 * MongoDB 연결 설정, 이벤트 리스너 및 헬퍼 함수를 정의합니다.
 * 이 모듈은 애플리케이션에서 MongoDB 연결을 관리하는 데 사용됩니다.
 * 
 * @module config/database
 */

import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB 연결 이벤트 리스너 설정
 * 연결 상태 변화를 모니터링하고 로그를 출력합니다.
 */
mongoose.connection.on('connected', () => {
  console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

/**
 * Mongoose 모듈 설정 옵션
 * 
 * @property {string} uri - MongoDB 연결 문자열 (환경 변수에서 로드)
 * @property {boolean} directConnection - 직접 연결 사용 여부
 * @property {number} serverSelectionTimeoutMS - 서버 선택 타임아웃 (밀리초)
 * @property {number} connectTimeoutMS - 연결 타임아웃 (밀리초)
 * @property {boolean} retryWrites - 쓰기 재시도 사용 여부
 */
export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI,
  directConnection: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  retryWrites: true,
};

/**
 * MongoDB 연결 상태 확인을 위한 헬퍼 함수
 * 
 * MongoDB 연결을 시도하고 결과를 콘솔에 출력합니다.
 * 
 * @async
 * @returns {Promise<boolean>} 연결 성공 여부를 반환합니다 (true: 성공, false: 실패)
 * @throws {Error} MongoDB 연결 중 오류가 발생한 경우
 * 
 * @example
 * ```typescript
 * const isConnected = await checkMongoConnection();
 * if (isConnected) {
 *   console.log('데이터베이스 연결 성공');
 * } else {
 *   console.error('데이터베이스 연결 실패');
 * }
 * ```
 */
export const checkMongoConnection = async () => {
  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.connect(process.env.MONGODB_URI, mongooseConfig);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB 연결 실패: ${error.message}`);
    return false;
  }
}; 