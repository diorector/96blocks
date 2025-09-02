# Supabase Edge Functions 푸시 알림 설정 가이드

## 📱 완전 자동 푸시 알림 설정 (15분마다)

### 1. Edge Function 배포

```bash
# Supabase CLI 설치 (없다면)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref YOUR_PROJECT_ID

# Edge Function 배포
supabase functions deploy push-notifications
```

### 2. 환경변수 설정 (Supabase Dashboard)

Settings → Edge Functions → 환경변수 추가:

```
VAPID_PUBLIC_KEY=BEPktFdlI2cxKywK3mklkSSbMHyD1Q4aRRLN_hLWsz3zqIFTdN3xBqZ9486VK6gzXjGnKydZ_L0VFjOIBWIM3nA
VAPID_PRIVATE_KEY=m5ek4oV0AVM67giNROwS1PvaE4fkhWI84C66mHzfcd0
VAPID_EMAIL=your-email@example.com
```

### 3. Cron Job 설정 (SQL Editor에서 실행)

```sql
-- pg_cron 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 15분마다 Edge Function 호출
SELECT cron.schedule(
  'push-notifications-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);
```

### 4. 필요한 값들 찾기

**Project ID**: 
- Supabase Dashboard → Settings → General → Project ID

**Service Role Key**:
- Supabase Dashboard → Settings → API → Service Role Key (secret)

### 5. 작동 확인

```sql
-- Cron Job 목록 확인
SELECT * FROM cron.job;

-- 최근 실행 로그 확인
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## 🎯 장점

1. **완전 자동화**: 서버 관리 불필요
2. **무료**: Supabase 무료 플랜에서도 작동
3. **안정적**: Supabase 인프라 활용
4. **저전력 모드 무관**: 서버에서 직접 푸시

## 🔧 문제 해결

### Cron이 실행되지 않을 때:
```sql
-- pg_cron 상태 확인
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 수동 테스트
SELECT net.http_post(
  url := 'https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'
  ),
  body := '{}'::jsonb
);
```

### Edge Function이 작동하지 않을 때:
```bash
# 로그 확인
supabase functions logs push-notifications

# 로컬 테스트
supabase functions serve push-notifications
```

## 📝 요약

1. **Supabase Dashboard**에서:
   - Edge Functions 환경변수 설정
   - Project ID와 Service Role Key 복사

2. **SQL Editor**에서:
   - `supabase-cron-setup.sql` 실행
   - YOUR-PROJECT-ID와 YOUR-SERVICE-ROLE-KEY 교체

3. **완료!** 
   - 15분마다 자동으로 푸시 알림 전송
   - 저전력 모드에서도 작동
   - 추가 서버 불필요

## 🚀 고급 설정

### 시간대별 다른 메시지:
```sql
-- Edge Function에서 시간대별 메시지 커스터마이징
CASE 
  WHEN EXTRACT(HOUR FROM NOW()) < 12 THEN '오전 활동을 기록하세요!'
  WHEN EXTRACT(HOUR FROM NOW()) < 18 THEN '오후도 화이팅!'
  ELSE '저녁 시간을 기록하세요!'
END
```

### 주말 제외:
```sql
-- 평일에만 실행
SELECT cron.schedule(
  'push-notifications-weekdays',
  '*/15 * * * 1-5',  -- 월-금만
  'SELECT send_push_notifications();'
);
```