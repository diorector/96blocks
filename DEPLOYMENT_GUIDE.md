# 배포 가이드 - Push Notification 설정

## 1. Supabase CLI 로그인
```bash
npx supabase login
```
브라우저가 열리면 Supabase 계정으로 로그인

## 2. 프로젝트 연결
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```
프로젝트 REF는 Supabase Dashboard → Settings → General에서 확인

## 3. Edge Function 배포
```bash
npx supabase functions deploy push-notifications
```

## 4. 환경변수 설정

### Supabase Dashboard에서:
1. Edge Functions → push-notifications → Secrets
2. 추가할 변수:
   - `NEXT_APP_URL`: https://your-app.vercel.app (Vercel 배포 URL)

### Vercel Dashboard에서:
1. Settings → Environment Variables
2. 추가할 변수:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: (이미 .env.local에 있음)
   - `VAPID_PRIVATE_KEY`: (이미 .env.local에 있음)  
   - `VAPID_EMAIL`: your-email@example.com

## 5. 크론 설정 (무료)

### Option 1: cron-job.org
1. https://cron-job.org 가입
2. Create cronjob
3. 설정:
   - URL: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/push-notifications`
   - Schedule: Every 15 minutes
   - HTTP Method: POST
   - Headers:
     - Authorization: `Bearer YOUR_SUPABASE_ANON_KEY`

### Option 2: GitHub Actions (이미 설정됨)
`.github/workflows/supabase-cron.yml` 파일이 있으므로:

1. GitHub Repository → Settings → Secrets
2. 추가할 Secrets:
   - `SUPABASE_FUNCTION_URL`: https://YOUR-PROJECT-REF.supabase.co/functions/v1/push-notifications
   - `SUPABASE_ANON_KEY`: Supabase Dashboard에서 확인

## 6. 테스트

### 로컬 테스트
```bash
npx supabase functions serve push-notifications --no-verify-jwt
```

### 로그 확인
```bash
npx supabase functions logs push-notifications --tail
```

## 7. 사용자 가이드

1. 사용자가 앱에 접속
2. "알림" 탭 클릭
3. 푸시 알림 토글 ON
4. 브라우저 권한 허용
5. 15분마다 알림 수신

## 트러블슈팅

### "supabase: command not found"
```bash
npx supabase [command]
```

### Edge Function 실행 안 됨
- Supabase Dashboard에서 로그 확인
- CORS 헤더 확인
- 환경변수 설정 확인

### Push 알림 안 옴
- 브라우저 알림 권한 확인
- Service Worker 등록 확인 (개발자도구 → Application → Service Workers)
- VAPID 키 확인

## 주의사항
- iOS Safari는 16.4+ 버전부터 PWA Push 지원
- 저전력 모드에서도 크론잡은 계속 실행됨
- 야간(23시-6시)은 자동 제외됨