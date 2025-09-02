-- pg_cron extension 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 15분마다 실행할 함수 생성
CREATE OR REPLACE FUNCTION send_push_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- YOUR-PROJECT-ID를 실제 프로젝트 ID로 교체하세요
  edge_function_url := 'https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications';
  
  -- YOUR-SERVICE-ROLE-KEY를 실제 Service Role Key로 교체하세요
  service_role_key := 'YOUR-SERVICE-ROLE-KEY';
  
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'time', NOW()
    )
  );
END;
$$;

-- Cron Job 스케줄 설정 (15분마다)
SELECT cron.schedule(
  'push-notifications-15min',
  '*/15 * * * *',
  'SELECT send_push_notifications();'
);

-- Cron Job 확인
SELECT * FROM cron.job;