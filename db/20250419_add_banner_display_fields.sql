-- 배너 표시 모드(display_mode)와 전체화면(full_width) 필드 추가
ALTER TABLE cms_banners ADD COLUMN IF NOT EXISTS display_mode VARCHAR(16) DEFAULT 'single';
ALTER TABLE cms_banners ADD COLUMN IF NOT EXISTS full_width BOOLEAN DEFAULT false;
