# Supabase Edge Functions 설정 가이드 (간단 버전)

## 1️⃣ Supabase CLI 설치
```bash
npm install -g supabase
```

## 2️⃣ 프로젝트 연결
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

## 3️⃣ Edge Function 배포
```bash
cd supabase/functions/push-notifications
supabase functions deploy push-notifications
```

## 4️⃣ 환경변수 설정 (Supabase Dashboard)
1. **Edge Functions** → **push-notifications** → **Secrets**
2. 추가할 변수:
```
VAPID_PUBLIC_KEY=BEPktFdlI2cxKywK3mklkSSbMHyD1Q4aRRLN_hLWsz3zqIFTdN3xBqZ9486VK6gzXjGnKydZ_L0VFjOIBWIM3nA
VAPID_PRIVATE_KEY=m5ek4oV0AVM67giNROwS1PvaE4fkhWI84C66mHzfcd0
VAPID_EMAIL=your-email@example.com
```

## 5️⃣ Database Webhooks로 자동 실행 (대안)

SQL Editor에서 실행:

```sql
-- 15분마다 트리거될 테이블
CREATE TABLE IF NOT EXISTS cron_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Database Webhook 생성 (Dashboard에서)
-- 1. Database → Webhooks → Create new webhook
-- 2. Name: push-notifications-trigger  
-- 3. Table: cron_triggers
-- 4. Events: INSERT
-- 5. URL: https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications
-- 6. Headers: Authorization: Bearer YOUR-SERVICE-KEY

-- 15분마다 트리거 삽입 (외부 크론 서비스 사용)
-- cron-job.org 또는 easycron.com에서:
-- URL: https://YOUR-PROJECT-ID.supabase.co/rest/v1/cron_triggers
-- Method: POST
-- Headers: 
--   apikey: YOUR-ANON-KEY
--   Content-Type: application/json
-- Body: {}
-- Schedule: */15 * * * *
```

## 6️⃣ 무료 크론 서비스 설정

### Option A: cron-job.org (무료)
1. https://cron-job.org 가입
2. Create cronjob
3. URL: `https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications`
4. Schedule: Every 15 minutes
5. HTTP Method: POST
6. Headers:
   - Authorization: `Bearer YOUR-ANON-KEY`

### Option B: GitHub Actions (무료)
`.github/workflows/cron.yml` 생성:
```yaml
name: Push Notifications
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Function
        run: |
          curl -X POST \
            https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications \
            -H "Authorization: Bearer YOUR-ANON-KEY"
```

## 7️⃣ 테스트
```bash
# 로컬 테스트
supabase functions serve push-notifications

# 로그 확인
supabase functions logs push-notifications
```

## ✅ 완료!
- 15분마다 자동 실행
- 저전력 모드 무관
- 완전 무료

## 🔧 문제 해결

### Edge Function이 실행 안 될 때:
```bash
supabase functions logs push-notifications --tail
```

### 권한 오류:
- Anon Key 사용 (공개 접근용)
- Service Role Key는 서버 간 통신용

## 📝 정리
1. Supabase Edge Function 배포 ✅
2. 무료 크론 서비스로 15분마다 트리거 ✅  
3. 저전력 모드에서도 작동 ✅