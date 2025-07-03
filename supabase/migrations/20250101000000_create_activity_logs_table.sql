-- 활동 로그 테이블 생성
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 작업 타입 (create, update, delete)
  resource_type VARCHAR(50) NOT NULL, -- 리소스 타입 (board_post, calendar_event, etc)
  resource_id VARCHAR(255), -- 리소스 ID
  resource_title TEXT, -- 리소스 제목/이름
  details JSONB, -- 추가 세부 정보
  ip_address INET, -- IP 주소
  user_agent TEXT, -- 사용자 에이전트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource_id ON activity_logs(resource_id);

-- RLS 정책 설정
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 로그를 볼 수 있음
CREATE POLICY "관리자는 모든 활동 로그를 볼 수 있음" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 사용자는 자신의 로그만 볼 수 있음
CREATE POLICY "사용자는 자신의 활동 로그만 볼 수 있음" ON activity_logs
    FOR SELECT USING (user_id = auth.uid());

-- 로그 삽입은 인증된 사용자만 가능
CREATE POLICY "인증된 사용자는 활동 로그를 생성할 수 있음" ON activity_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 댓글 생성
COMMENT ON TABLE activity_logs IS '사용자 활동 로그를 저장하는 테이블';
COMMENT ON COLUMN activity_logs.action IS '수행된 작업 (create, update, delete, view 등)';
COMMENT ON COLUMN activity_logs.resource_type IS '작업 대상 리소스 타입 (board_post, calendar_event, comment 등)';
COMMENT ON COLUMN activity_logs.resource_id IS '작업 대상 리소스의 ID';
COMMENT ON COLUMN activity_logs.resource_title IS '작업 대상 리소스의 제목이나 이름';
COMMENT ON COLUMN activity_logs.details IS '작업에 대한 추가 세부정보 (JSON 형태)'; 