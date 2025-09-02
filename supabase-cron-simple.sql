-- Extensions 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron Job 설정 (15분마다)
SELECT cron.schedule(
  'push-notifications-15min',
  '*/15 * * * *',
  'SELECT net.http_post(url := ''https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications'', headers := ''{"Authorization": "Bearer YOUR-SERVICE-ROLE-KEY"}''::jsonb, body := ''{}''::jsonb);'
);

-- Cron Job 목록 확인
SELECT * FROM cron.job;