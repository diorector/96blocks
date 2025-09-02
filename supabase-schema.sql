-- Supabase SQL Schema for 15분 플래너
-- 2025-09-03 04:55 KST - 전체 데이터베이스 스키마

-- 1. 사용자 프로필 테이블 (이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 일일 세션 테이블
CREATE TABLE IF NOT EXISTS daily_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. 시간 슬롯 테이블
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES daily_sessions(id) ON DELETE CASCADE,
  slot_time TIMESTAMPTZ NOT NULL,
  activity TEXT,
  condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, slot_time)
);

-- 4. 푸시 구독 테이블 (새로 추가)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. 알림 스케줄 테이블 (옵션)
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  interval_minutes INTEGER DEFAULT 15,
  start_hour INTEGER DEFAULT 6,
  end_hour INTEGER DEFAULT 23,
  weekdays BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, true],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON daily_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_slots_session ON time_slots(session_id, slot_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_user ON time_slots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS (Row Level Security) 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 일일 세션 정책
CREATE POLICY "Users can view own sessions" ON daily_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON daily_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON daily_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON daily_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 시간 슬롯 정책
CREATE POLICY "Users can view own time slots" ON time_slots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time slots" ON time_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time slots" ON time_slots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time slots" ON time_slots
  FOR DELETE USING (auth.uid() = user_id);

-- 푸시 구독 정책
CREATE POLICY "Users can view own push subscription" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push subscription" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 알림 스케줄 정책
CREATE POLICY "Users can view own notification schedule" ON notification_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification schedule" ON notification_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 트리거: 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_sessions_updated_at BEFORE UPDATE ON daily_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_schedules_updated_at BEFORE UPDATE ON notification_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 통계 뷰 (옵션)
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT ds.date) as total_days,
  COUNT(ts.id) as total_slots,
  AVG(ts.condition_score)::NUMERIC(3,1) as avg_condition,
  MAX(ds.date) as last_active_date
FROM auth.users u
LEFT JOIN daily_sessions ds ON u.id = ds.user_id
LEFT JOIN time_slots ts ON ds.id = ts.session_id
GROUP BY u.id;

-- 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;

-- 완료 메시지
-- 모든 테이블과 정책이 성공적으로 생성되었습니다.
-- push_subscriptions 테이블이 Web Push 알림을 위해 추가되었습니다.