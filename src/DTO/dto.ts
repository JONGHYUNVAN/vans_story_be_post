export class CreatePostDto {
    title: string;
    content: string;
    theme: string;
    authorEmail: string;
  }
  

  export class UpdatePostDto {
    title?: string;
    content?: string;
    theme?: string;
  }
  

  export class PostResponseDto {
    id: number;
    title: string;
    content: string;
    theme: string;
    authorEmail: string;
    createdAt: Date;
    updatedAt: Date;
  }