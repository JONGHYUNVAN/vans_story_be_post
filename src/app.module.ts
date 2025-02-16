import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { PostsModule } from './Module/module';
import { AuthModule } from './utils/Authorization/Module/module';
import { databaseConfig } from './config/database';
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    PostsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
