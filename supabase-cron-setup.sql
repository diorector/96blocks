-- Supabase Cron Job 설정
-- 2025-09-03 05:15 KST - pg_cron으로 15분마다 Edge Function 호출

-- 1. pg_cron extension 활성화 (Supabase Dashboard에서 이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. pg_net extension 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. 15분마다 실행할 함수 생성
CREATE OR REPLACE FUNCTION send_push_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL (your-project-id를 실제 프로젝트 ID로 교체)
  edge_function_url := 'https://YOUR-PROJECT-ID.supabase.co/functions/v1/push-notifications';
  
  -- Service Role Key (Supabase Dashboard > Settings > API에서 확인)
  service_role_key := 'YOUR-SERVICE-ROLE-KEY';
  
  -- Edge Function 호출
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

-- 4. Cron Job 스케줄 설정 (15분마다)
SELECT cron.schedule(
  'push-notifications-15min',           -- job 이름
  '*/15 * * * *',                       -- 15분마다
  'SELECT send_push_notifications();'   -- 실행할 함수
);

-- 5. 추가 Cron Job 설정 (선택사항)

-- 매시 정각에만 실행
-- SELECT cron.schedule(
--   'push-notifications-hourly',
--   '0 * * * *',
--   'SELECT send_push_notifications();'
-- );

-- 업무 시간(9-18시)에만 15분마다 실행
-- SELECT cron.schedule(
--   'push-notifications-work-hours',
--   '*/15 9-18 * * *',
--   'SELECT send_push_notifications();'
-- );

-- 6. Cron Job 확인
SELECT * FROM cron.job;

-- 7. Cron Job 삭제 (필요시)
-- SELECT cron.unschedule('push-notifications-15min');

-- ================================================
-- 대안: 직접 데이터베이스에서 처리하는 방법
-- ================================================

-- 데이터베이스에서 직접 푸시 알림 로직 처리
CREATE OR REPLACE FUNCTION process_push_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_hour INT;
  current_minute INT;
  active_user_count INT;
BEGIN
  -- 현재 시간 체크
  current_hour := EXTRACT(HOUR FROM NOW());
  current_minute := EXTRACT(MINUTE FROM NOW());
  
  -- 야간 시간 제외 (23시 ~ 6시)
  IF current_hour >= 23 OR current_hour < 6 THEN
    RAISE NOTICE 'Night time - skipping notifications';
    RETURN;
  END IF;
  
  -- 15분 간격이 아니면 스킵
  IF current_minute % 15 != 0 THEN
    RAISE NOTICE 'Not a 15-minute interval';
    RETURN;
  END IF;
  
  -- 활성 세션 사용자 수 확인
  SELECT COUNT(DISTINCT user_id) INTO active_user_count
  FROM daily_sessions
  WHERE date = CURRENT_DATE
    AND start_time IS NOT NULL
    AND end_time IS NULL;
    
  IF active_user_count > 0 THEN
    -- 알림 로그 테이블에 기록 (선택사항)
    INSERT INTO notification_logs (
      sent_at,
      user_count,
      status
    ) VALUES (
      NOW(),
      active_user_count,
      'pending'
    );
    
    -- Edge Function 호출
    PERFORM send_push_notifications();
    
    RAISE NOTICE 'Sent notifications to % users', active_user_count;
  ELSE
    RAISE NOTICE 'No active users found';
  END IF;
END;
$$;

-- 알림 로그 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_count INT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 설정 완료 메시지
-- ================================================
-- Cron Job이 성공적으로 설정되었습니다.
-- 15분마다 자동으로 푸시 알림이 전송됩니다.
-- Edge Function URL과 Service Role Key를 실제 값으로 교체하세요.