import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './Controller/controller';
import { PostsService } from './Service/service';
import * as dotenv from 'dotenv';
import { PostsModule } from './Module/module';
import { AuthModule } from './Authorization/Module/module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'sqlite' | 'mysql',
      database: process.env.DB_TYPE === 'sqlite' ? process.env.DB_DATABASE : undefined,
      host: process.env.DB_TYPE === 'mysql' ? process.env.DB_HOST : undefined,
      port: process.env.DB_TYPE === 'mysql' ? +process.env.DB_PORT : undefined,
      username: process.env.DB_TYPE === 'mysql' ? process.env.DB_USERNAME : undefined,
      password: process.env.DB_TYPE === 'mysql' ? process.env.DB_PASSWORD : undefined,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 개발환경에서만 true로 설정
    }),
    PostsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
