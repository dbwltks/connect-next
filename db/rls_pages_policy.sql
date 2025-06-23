-- cms_pages RLS 정책 추가
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (있을 경우)
DROP POLICY IF EXISTS "allow all read access" ON cms_pages;
DROP POLICY IF EXISTS "사용자는 페이지 읽기 가능" ON cms_pages;

-- 새로운 정책 추가: 모든 사용자가 페이지 정보를 읽을 수 있도록 허용
CREATE POLICY "사용자는 페이지 읽기 가능" ON cms_pages
FOR SELECT
USING (true); 