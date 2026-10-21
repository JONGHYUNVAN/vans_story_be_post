// app.module을 import하기 전에 더미 환경 변수를 설정합니다(CJS 출력에서는 import 순서가 유지됨).
// 실제 .env 값이 이미 있으면 덮어쓰지 않습니다.
process.env.JWT_SECRET ??= Buffer.from('smoke-secret').toString('base64');
process.env.USER_SERVICE_URL ??= 'http://127.0.0.1:9';
process.env.INTERNAL_API_KEY ??= 'smoke';
process.env.SEARCH_SERVICE_URL ??= 'http://127.0.0.1:9';
