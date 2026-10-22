// app.module을 import하기 전에 더미 환경 변수를 설정합니다(CJS 출력에서는 import 순서가 유지됨).
// 실제 .env 값이 이미 있으면 덮어쓰지 않습니다.
process.env.JWT_SECRET ??= Buffer.from('smoke-secret').toString('base64');
// 연결 프로바이더는 가짜로 바뀌지만(withFakeMongoose) 옵션 팩토리가 getOrThrow로 읽으므로 필요하다.
// 먼저 채워 두면 ConfigModule이 실제 .env의 운영 URI로 덮어쓰지 않는다.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:1/smoke';
process.env.USER_SERVICE_URL ??= 'http://127.0.0.1:9';
process.env.INTERNAL_API_KEY ??= 'smoke';
process.env.SEARCH_SERVICE_URL ??= 'http://127.0.0.1:9';
