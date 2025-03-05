import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// MongoDB 연결 이벤트 리스너 설정
mongoose.connection.on('connected', () => {
  console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI,
  directConnection: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  retryWrites: true,
};

// MongoDB 연결 상태 확인을 위한 헬퍼 함수
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