-- 웹사이트 사용자 테이블 (계정 정보)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 주소 테이블 (캐나다식 주소 구조)
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address TEXT,
  address_detail TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Canada',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 교회 멤버 테이블 (교회 멤버십 정보)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  member_code TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  korean_name TEXT,
  gender TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  introducer_name TEXT,
  infant_baptism_date DATE,
  adult_baptism_date DATE,
  membership_date DATE,
  membership_status TEXT DEFAULT 'active' NOT NULL,
  wedding_date DATE,
  wedding_prayer TEXT, -- 주례자
  occupation TEXT, -- 직업
  workplace TEXT, -- 직장
  education TEXT, -- 학력
  prayer_requests TEXT, -- 기도 요청
  profile_image_url TEXT, -- 프로필 이미지 URL
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 멤버-주소 연결 테이블
CREATE TABLE IF NOT EXISTS member_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  address_id UUID NOT NULL REFERENCES addresses(id),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 설교 테이블
CREATE TABLE IF NOT EXISTS sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scripture TEXT NOT NULL,
  preacher TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 교회 일정 테이블
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  image_url TEXT
);

-- 소그룹/셀 테이블
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  leader TEXT NOT NULL,
  meeting_time TEXT,
  meeting_location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 소그룹 멤버십 테이블
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id),
  member_id UUID NOT NULL REFERENCES members(id),
  role TEXT DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  category TEXT DEFAULT 'general',
  publish_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 갤러리/사진 테이블
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 갤러리 이미지 테이블
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES gallery(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 기도 요청 테이블
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 교회 정보 테이블
CREATE TABLE IF NOT EXISTS church_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address_id UUID REFERENCES addresses(id),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  service_times JSONB NOT NULL,
  pastor_name TEXT NOT NULL,
  pastor_message TEXT,
  vision_statement TEXT,
  mission_statement TEXT,
  logo_url TEXT,
  banner_url TEXT,
  social_links JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 홈페이지 배너 테이블
CREATE TABLE IF NOT EXISTS cms_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  has_button BOOLEAN DEFAULT FALSE NOT NULL,
  button_text TEXT,
  button_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 홈페이지 섹션 테이블
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  section_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_info ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (관리자는 모든 테이블에 접근 가능)
CREATE POLICY admin_all_access ON users FOR ALL TO authenticated USING (role = 'admin');
CREATE POLICY admin_all_access ON members FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON addresses FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON member_addresses FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON sermons FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON events FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON groups FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON group_members FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON announcements FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON gallery FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON gallery_images FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON prayer_requests FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY admin_all_access ON church_info FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 홈페이지 레이아웃 테이블
CREATE TABLE IF NOT EXISTS homepage_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_template TEXT NOT NULL DEFAULT 'default',
  sections JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE homepage_layout ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON homepage_layout FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY public_read ON homepage_layout FOR SELECT TO authenticated USING (true);

-- 사용자 자신의 정보에 대한 접근 정책
CREATE POLICY user_own_access ON users FOR ALL TO authenticated USING (id = auth.uid());

-- 일반 사용자의 읽기 정책 (공개 정보)
CREATE POLICY public_read ON sermons FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON groups FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON gallery FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON gallery_images FOR SELECT TO authenticated USING (true);
CREATE POLICY public_read ON church_info FOR SELECT TO authenticated USING (true);

-- 멤버가 자신의 정보에 접근하는 정책
CREATE POLICY member_own_access ON members FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY member_own_access ON member_addresses FOR ALL TO authenticated USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));
CREATE POLICY member_own_access ON prayer_requests FOR ALL TO authenticated USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- 공개 기도 요청에 대한 읽기 정책
CREATE POLICY public_prayer_read ON prayer_requests FOR SELECT TO authenticated USING (is_public = true);

-- 그룹 멤버십에 대한 정책
CREATE POLICY group_member_access ON group_members FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));
