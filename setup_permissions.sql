-- 권한 카테고리 추가
INSERT INTO permission_categories (name, display_name, icon, description, display_order, is_active) VALUES 
('programs', '프로그램 관리', '📅', '프로그램 관련 권한들', 1, true),
('widget', '위젯 관리', '🧩', '위젯 관련 권한들', 2, true),
('system', '시스템 관리', '⚙️', '시스템 관련 권한들', 3, true)
ON CONFLICT (name) DO NOTHING;

-- 기본 역할 추가
INSERT INTO roles (name, display_name, description, level, is_system, is_active) VALUES 
('admin', '관리자', '시스템 관리자', 10, true, true),
('tier0', 'Tier 0', '최고 관리자', 9, true, true),
('tier1', 'Tier 1', '고급 관리자', 8, true, true),
('tier2', 'Tier 2', '일반 관리자', 7, true, true),
('tier3', 'Tier 3', '일반 사용자', 6, true, true),
('guest', '게스트', '방문자', 1, true, true)
ON CONFLICT (name) DO NOTHING;

-- 프로그램 관련 권한 추가
INSERT INTO permissions (name, display_name, description, category, data_scope, is_active) VALUES 
-- 일정 관리 권한
('programs.calendar.view', '일정 조회', '프로그램 일정을 조회할 수 있습니다', 'programs', 'all', true),
('programs.calendar.create', '일정 생성', '프로그램 일정을 생성할 수 있습니다', 'programs', 'all', true),
('programs.calendar.edit', '일정 수정', '프로그램 일정을 수정할 수 있습니다', 'programs', 'all', true),
('programs.calendar.delete', '일정 삭제', '프로그램 일정을 삭제할 수 있습니다', 'programs', 'all', true),

-- 참가자 관리 권한
('programs.participants.view', '참가자 조회', '프로그램 참가자를 조회할 수 있습니다', 'programs', 'all', true),
('programs.participants.create', '참가자 추가', '프로그램 참가자를 추가할 수 있습니다', 'programs', 'all', true),
('programs.participants.edit', '참가자 수정', '프로그램 참가자를 수정할 수 있습니다', 'programs', 'all', true),
('programs.participants.delete', '참가자 삭제', '프로그램 참가자를 삭제할 수 있습니다', 'programs', 'all', true),

-- 출석 관리 권한
('programs.attendance.view', '출석 조회', '프로그램 출석을 조회할 수 있습니다', 'programs', 'all', true),
('programs.attendance.create', '출석 체크', '프로그램 출석을 체크할 수 있습니다', 'programs', 'all', true),
('programs.attendance.edit', '출석 수정', '프로그램 출석을 수정할 수 있습니다', 'programs', 'all', true),
('programs.attendance.delete', '출석 삭제', '프로그램 출석을 삭제할 수 있습니다', 'programs', 'all', true),

-- 재정 관리 권한
('programs.finance.view', '재정 조회', '프로그램 재정을 조회할 수 있습니다', 'programs', 'sensitive', true),
('programs.finance.create', '재정 추가', '프로그램 재정을 추가할 수 있습니다', 'programs', 'sensitive', true),
('programs.finance.edit', '재정 수정', '프로그램 재정을 수정할 수 있습니다', 'programs', 'sensitive', true),
('programs.finance.delete', '재정 삭제', '프로그램 재정을 삭제할 수 있습니다', 'programs', 'sensitive', true),

-- 확인사항 관리 권한
('programs.checklist.view', '확인사항 조회', '프로그램 확인사항을 조회할 수 있습니다', 'programs', 'all', true),
('programs.checklist.create', '확인사항 추가', '프로그램 확인사항을 추가할 수 있습니다', 'programs', 'all', true),
('programs.checklist.edit', '확인사항 수정', '프로그램 확인사항을 수정할 수 있습니다', 'programs', 'all', true),
('programs.checklist.delete', '확인사항 삭제', '프로그램 확인사항을 삭제할 수 있습니다', 'programs', 'all', true),

-- 개요 관리 권한
('programs.overview.view', '개요 조회', '프로그램 개요를 조회할 수 있습니다', 'programs', 'all', true),
('programs.overview.edit', '개요 수정', '프로그램 개요를 수정할 수 있습니다', 'programs', 'all', true),

-- 위젯 관리 권한
('widget.layout.view', '레이아웃 조회', '위젯 레이아웃을 조회할 수 있습니다', 'widget', 'all', true),
('widget.layout.edit', '레이아웃 편집', '위젯 레이아웃을 편집할 수 있습니다', 'widget', 'all', true),
('widget.settings.view', '위젯 설정 조회', '위젯 설정을 조회할 수 있습니다', 'widget', 'all', true),
('widget.settings.edit', '위젯 설정 편집', '위젯 설정을 편집할 수 있습니다', 'widget', 'all', true)
ON CONFLICT (name) DO NOTHING;

-- 역할별 권한 할당
-- admin (모든 권한)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- tier0 (관리자급 권한, 재정 제외)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'tier0' 
AND p.name NOT LIKE '%finance%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- tier1 (고급 관리자 권한)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'tier1'
AND (
  p.name LIKE '%.view' 
  OR p.name LIKE '%attendance%'
  OR p.name LIKE '%checklist%'
  OR p.name LIKE '%participants.create'
  OR p.name LIKE '%participants.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- tier2 (일반 관리자 권한)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'tier2'
AND (
  p.name LIKE '%.view'
  OR p.name LIKE '%attendance.create'
  OR p.name LIKE '%attendance.edit'
  OR p.name LIKE '%checklist.create'
  OR p.name LIKE '%checklist.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- tier3 (일반 사용자 권한)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'tier3'
AND (
  p.name LIKE '%.view'
  OR p.name = 'programs.attendance.create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- guest (조회만 가능)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest'
AND (
  p.name = 'programs.calendar.view'
  OR p.name = 'programs.overview.view'
  OR p.name = 'widget.layout.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;