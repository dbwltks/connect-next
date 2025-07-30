-- 알림 구독 테이블 생성
CREATE TABLE notification_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_id TEXT,
    program_id UUID NOT NULL,
    subscription_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 로그인 사용자는 user_id + program_id 조합이 유니크
    -- 익명 사용자는 anonymous_id + program_id 조합이 유니크
    CONSTRAINT unique_user_program UNIQUE (user_id, program_id),
    CONSTRAINT unique_anonymous_program UNIQUE (anonymous_id, program_id),
    
    -- user_id와 anonymous_id 중 하나는 반드시 있어야 함
    CONSTRAINT check_user_or_anonymous CHECK (
        (user_id IS NOT NULL AND anonymous_id IS NULL) OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    )
);

-- 인덱스 생성
CREATE INDEX idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
CREATE INDEX idx_notification_subscriptions_anonymous_id ON notification_subscriptions(anonymous_id);
CREATE INDEX idx_notification_subscriptions_program_id ON notification_subscriptions(program_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 - 사용자는 자신의 구독만 볼 수 있음
CREATE POLICY "Users can view own subscriptions" ON notification_subscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    );

-- RLS 정책 - 사용자는 자신의 구독만 삽입할 수 있음
CREATE POLICY "Users can insert own subscriptions" ON notification_subscriptions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    );

-- RLS 정책 - 사용자는 자신의 구독만 업데이트할 수 있음
CREATE POLICY "Users can update own subscriptions" ON notification_subscriptions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    );

-- RLS 정책 - 사용자는 자신의 구독만 삭제할 수 있음
CREATE POLICY "Users can delete own subscriptions" ON notification_subscriptions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_subscriptions_updated_at 
    BEFORE UPDATE ON notification_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();