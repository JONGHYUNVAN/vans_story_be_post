import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from '../Service/service';
import { PostsController } from '../Controller/controller';
import { Post } from '../Entity/entity';
import { AuthModule } from '../utils/Authorization/Module/module';
import { PostsRepository } from '../Repository/repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    AuthModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}