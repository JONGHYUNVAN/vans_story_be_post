import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Session } from 'express-session';

interface CustomSession extends Session {
  swaggerAuthorized?: boolean;
}

interface CustomRequest extends Request {
  session: CustomSession;
}

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);

    // API 문서 페이지가 아닌 경우 통과
    if (!req.path.startsWith('/api/posts/swagger')) {
      return next();
    }

    // 인증 요청 처리 (먼저 체크)
    if (req.path === '/api/posts/swagger/auth' && req.method === 'POST') {
      console.log('Auth request received');
      const { password } = req.body;
      console.log('Password received:', password);
      console.log('Expected password:', process.env.SWAGGER_ADMIN_PASSWORD);
      
      if (password === process.env.SWAGGER_ADMIN_PASSWORD) {
        req.session.swaggerAuthorized = true;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: '세션 저장 실패' });
          }
          console.log('Auth successful');
          return res.json({ authorized: true });
        });
      } else {
        console.log('Auth failed');
        return res.status(401).json({ message: '인증 실패' });
      }
      return;
    }

    // API 문서 HTML 페이지 요청인 경우
    if (req.path === '/api/posts/swagger' && req.method === 'GET') {
      if (req.session.swaggerAuthorized) {
        return next();
      }
      const htmlPath = path.join(__dirname, '..', 'views', 'swagger-auth.html');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return fs.createReadStream(htmlPath, { encoding: 'utf8' }).pipe(res);
    }

    // Swagger UI 리소스 요청이나 API 호출인 경우 세션 체크
    if (req.session.swaggerAuthorized) {
      return next();
    }

    return res.status(401).json({ message: '인증이 필요합니다' });
  }
} 