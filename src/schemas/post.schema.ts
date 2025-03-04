import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({
  timestamps: true,
  collection: 'posts'
})
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  authorEmail: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ required: true })
  theme: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: '' })
  thumbnail: string;

  @Prop({ required: true, default: 'ko' })
  language: string;
}

export const PostSchema = SchemaFactory.createForClass(Post); 