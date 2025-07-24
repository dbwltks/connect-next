-- 비회원(게스트) 역할 추가
INSERT INTO roles (name, display_name, description, level) 
VALUES ('guest', '비회원', '로그인하지 않은 모든 사용자', 0)
ON CONFLICT (name) DO UPDATE SET
display_name = '비회원',
description = '로그인하지 않은 모든 사용자',
level = 0;