-- CMS 카테고리 테이블 (섹션과 연동)
CREATE TABLE IF NOT EXISTS cms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  section_id UUID REFERENCES cms_sections(id),
  page_type TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  "order" INTEGER NOT NULL,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
