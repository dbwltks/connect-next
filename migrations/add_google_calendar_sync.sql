-- Google Calendar 동기화를 위한 테이블 추가

-- events 테이블에 google_calendar_id와 connect_id 컬럼 추가
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS connect_id VARCHAR(255) UNIQUE;

-- connect_id 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_events_connect_id ON events(connect_id);
CREATE INDEX IF NOT EXISTS idx_events_google_calendar_id ON events(google_calendar_id);

-- connect_id가 없는 기존 이벤트에 고유 ID 생성
UPDATE events 
SET connect_id = CONCAT('connect_', id, '_', EXTRACT(EPOCH FROM created_at))
WHERE connect_id IS NULL;

-- 사용자별 Google Calendar 인증 정보를 저장할 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS user_google_calendar_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token_encrypted TEXT, -- 암호화된 토큰
    refresh_token_encrypted TEXT, -- 암호화된 리프레시 토큰
    token_expires_at TIMESTAMP WITH TIME ZONE,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS 정책 설정
ALTER TABLE user_google_calendar_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Google Calendar auth" ON user_google_calendar_auth
    FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE user_google_calendar_auth IS 'Google Calendar 인증 정보 저장 (선택사항 - 서버 사이드 인증용)';
COMMENT ON COLUMN events.google_calendar_id IS 'Google Calendar에서의 이벤트 ID';
COMMENT ON COLUMN events.connect_id IS 'Connect Next에서의 고유 식별자 (Google Calendar 동기화용)';