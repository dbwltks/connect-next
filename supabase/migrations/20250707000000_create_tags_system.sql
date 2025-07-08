-- 태그 테이블 생성
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 기본 파란색
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- 게시글-태그 관계 테이블 생성 (다대다 관계)
CREATE TABLE IF NOT EXISTS public.post_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.board_posts(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(post_id, tag_id)
);

-- 기존 board_posts 테이블에 tags 컬럼 추가 (JSON 형태로 태그 정보 저장 - 성능 최적화용)
ALTER TABLE public.board_posts 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_active ON public.tags(is_active);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON public.post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_tags ON public.board_posts USING GIN(tags);

-- updated_at 자동 업데이트 함수 생성 (이미 있다면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- tags 테이블에 트리거 추가
CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON public.tags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- 태그는 모든 사용자가 읽을 수 있음
CREATE POLICY "Everyone can view active tags" ON public.tags
    FOR SELECT USING (is_active = true);

-- 인증된 사용자만 태그 생성 가능
CREATE POLICY "Authenticated users can insert tags" ON public.tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 태그 생성자 또는 관리자만 수정 가능
CREATE POLICY "Tag creators and admins can update tags" ON public.tags
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- post_tags는 게시글 작성자 또는 관리자만 조작 가능
CREATE POLICY "Post authors can manage post tags" ON public.post_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.board_posts 
            WHERE id = post_tags.post_id 
            AND (user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin'
            ))
        )
    );

-- 기본 태그 데이터 삽입
INSERT INTO public.tags (name, slug, color, description) VALUES
    ('공지사항', 'notice', '#F59E0B', '중요한 공지사항'),
    ('일반', 'general', '#6B7280', '일반적인 게시글'),
    ('질문', 'question', '#EF4444', '질문이 있는 게시글'),
    ('정보', 'info', '#10B981', '유용한 정보 공유'),
    ('토론', 'discussion', '#8B5CF6', '토론이 필요한 주제'),
    ('이벤트', 'event', '#F97316', '이벤트 관련 게시글')
ON CONFLICT (name) DO NOTHING;