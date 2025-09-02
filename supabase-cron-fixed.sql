-- 1. Extensions 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. 간단한 버전 - 직접 HTTP 호출
SELECT cron.schedule(
  'push-notifications-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications',
    headers := '{"Authorization": "Bearer YOUR-SERVICE-ROLE-KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  );
  $$
);

-- 3. Cron Job 확인
SELECT * FROM cron.job;

-- 4. 삭제가 필요한 경우
-- SELECT cron.unschedule('push-notifications-every-15min');