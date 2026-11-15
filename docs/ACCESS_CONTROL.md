# 운영자 로그인(접근 제한)

FoodVOC 운영 사이트는 운영자 비밀번호를 아는 사람만 열 수 있습니다.

## 동작 방식
- `netlify/edge-functions/auth.ts`가 Netlify 서버(엣지)에서 모든 요청을 먼저 검사합니다.
- 로그인하지 않은 방문자에게는 앱 파일(JS·CSS·VOC 데이터)을 보내지 않고 `/__login` 로그인 화면만 보여 줍니다.
- 로그인하면 서명된 쿠키(`fv_session`, HttpOnly·Secure)가 7일간 유지됩니다.
- 헤더의 "로그아웃" 링크(`/__logout`)로 쿠키를 지웁니다.
- 비밀번호를 바꾸면 기존 로그인은 모두 무효가 됩니다.
- 비밀번호 환경 변수가 없으면 사이트를 열지 않습니다(503 "접속 준비 중").
- 틀린 비밀번호는 1초 지연 후 거절합니다.

## 설정 (Netlify 웹 화면)
1. Site configuration → Environment variables → Add a variable
2. Key: `FOODVOC_ADMIN_PASSWORD`, Value: 운영자 비밀번호, Scopes: Functions 포함(기본값 All scopes)
3. 재배포 후 적용됩니다.

비밀번호는 저장소·코드·문서에 넣지 않습니다.

## 주의
- Edge Function은 Git 연동 배포나 `netlify deploy`(CLI)로 올려야 동작합니다. `dist` 폴더를 끌어다 놓는 수동 배포에서는 동작하지 않아 사이트가 그대로 공개됩니다.
- `npm run dev`(로컬 개발 서버)에는 로그인 게이트가 적용되지 않습니다. 로컬 확인은 `netlify dev`를 사용합니다.
- 운영자 1인용 공용 비밀번호 방식입니다. 사용자별 계정·권한·접속 기록이 필요해지면 Netlify Identity 등 별도 인증으로 바꿔야 합니다.
