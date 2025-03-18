/**
 * Swagger UI 인증 미들웨어
 * 
 * Swagger API 문서에 대한 접근을 제한하고 인증을 처리하는 미들웨어입니다.
 * 인증된 사용자만 API 문서에 접근할 수 있도록 세션 기반 인증을 구현합니다.
 * 
 * @module middleware/swagger.auth.middleware
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Session } from 'express-session';

/**
 * Swagger 인증 정보를 저장하기 위한 세션 인터페이스
 * 기본 세션에 Swagger 인증 상태를 추가합니다.
 */
interface CustomSession extends Session {
  swaggerAuthorized?: boolean;
}

/**
 * 커스텀 세션을 포함하는 요청 인터페이스
 * Express Request 인터페이스를 확장하여 CustomSession을 포함합니다.
 */
interface CustomRequest extends Request {
  session: CustomSession;
}

/**
 * Swagger UI 접근 제어 미들웨어
 * 
 * API 문서에 대한 접근을 제한하고 비밀번호 인증을 처리합니다.
 * 인증되지 않은 사용자에게는 로그인 페이지를 표시합니다.
 */
@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  /**
   * 미들웨어 처리 함수
   * 
   * 요청 경로를 확인하고 Swagger UI 접근에 대한 인증을 처리합니다.
   * 1. API 문서 페이지가 아닌 경우 통과시킵니다.
   * 2. 인증 요청을 처리합니다.
   * 3. 인증되지 않은 사용자에게 로그인 페이지를 표시합니다.
   * 
   * @param {CustomRequest} req - 확장된 Express 요청 객체
   * @param {Response} res - Express 응답 객체
   * @param {NextFunction} next - 다음 미들웨어 실행 함수
   * @returns {void}
   */
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