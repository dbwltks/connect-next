-- users 테이블에 roles JSON 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;

-- 기존 단일 role을 roles 배열로 마이그레이션
UPDATE users 
SET roles = CASE 
  WHEN role IS NOT NULL AND role != '' THEN jsonb_build_array(role)
  ELSE '["member"]'::jsonb
END
WHERE roles = '[]'::jsonb OR roles IS NULL;

-- 예시 데이터 (필요시 사용)
-- UPDATE users SET roles = '["admin", "finance_manager"]' WHERE email = 'admin@example.com';
-- UPDATE users SET roles = '["member", "finance_team"]' WHERE email = 'finance@example.com';

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);