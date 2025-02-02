// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 기존 HTTP 서버 생성
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);

  // 별도의 마이크로서비스 서버 생성 (TCP 기반)
  const microservice = app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 8877,
    },
  });

  await app.startAllMicroservices();
}
bootstrap();
