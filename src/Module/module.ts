import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from '../Controller/controller';
import { PostsService } from '../Service/service';
import { Post, PostSchema } from '../schemas/post.schema';
import { InternalApiClient } from '../utils/Api/api';
import { PostInitService } from '../database/init/post.init';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema }
    ]),
    HttpModule
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    InternalApiClient,
    PostInitService
  ],
  exports: [PostsService]
})
export class PostsModule {}