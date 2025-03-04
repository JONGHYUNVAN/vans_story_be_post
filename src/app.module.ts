import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import * as dotenv from 'dotenv';
import { PostsModule } from './Module/module';
import { AuthModule } from './utils/Authorization/Module/module';
import { mongooseConfig } from './config/database';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        ...mongooseConfig
      }),
    }),
    HttpModule,
    PostsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
