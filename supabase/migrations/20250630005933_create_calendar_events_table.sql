-- 캘린더 이벤트 테이블 생성
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    department VARCHAR(50) DEFAULT '전체',
    is_all_day BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_department ON calendar_events(department);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- RLS (Row Level Security) 활성화
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 정책 생성
-- 모든 사용자가 일정을 볼 수 있음
CREATE POLICY "Everyone can view calendar events" ON calendar_events
    FOR SELECT USING (true);

-- 로그인한 사용자만 일정을 생성할 수 있음
CREATE POLICY "Authenticated users can insert calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 작성자만 자신의 일정을 수정할 수 있음
CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = created_by);

-- 작성자만 자신의 일정을 삭제할 수 있음
CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = created_by);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
