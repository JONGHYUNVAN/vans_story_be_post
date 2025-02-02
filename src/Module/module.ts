import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from '../Service/service';
import { PostsController } from '../Controller/controller';
import { Post } from '../Entity/entity';
import { AuthModule } from '../Authorization/Module/module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), AuthModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}