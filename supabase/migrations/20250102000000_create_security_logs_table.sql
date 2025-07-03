-- 보안 로그 테이블 생성
create table if not exists public.security_logs (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  severity integer not null default 1,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 인덱스를 위한 컬럼
  event_date date generated always as (date(created_at)) stored
);

-- 인덱스 생성
create index if not exists security_logs_event_type_idx on public.security_logs(event_type);
create index if not exists security_logs_severity_idx on public.security_logs(severity);
create index if not exists security_logs_user_id_idx on public.security_logs(user_id);
create index if not exists security_logs_ip_address_idx on public.security_logs(ip_address);
create index if not exists security_logs_created_at_idx on public.security_logs(created_at desc);
create index if not exists security_logs_event_date_idx on public.security_logs(event_date);

-- 복합 인덱스
create index if not exists security_logs_user_event_idx on public.security_logs(user_id, event_type, created_at desc);
create index if not exists security_logs_ip_event_idx on public.security_logs(ip_address, event_type, created_at desc);

-- RLS 정책 활성화
alter table public.security_logs enable row level security;

-- 관리자만 모든 보안 로그 조회 가능
create policy "관리자는 모든 보안 로그 조회 가능" on public.security_logs
  for select using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- 시스템이 보안 로그 삽입 가능 (서버 사이드)
create policy "시스템 보안 로그 삽입" on public.security_logs
  for insert with check (true);

-- 보안 로그는 수정/삭제 불가 (감사 목적)
create policy "보안 로그 수정 불가" on public.security_logs
  for update using (false);

create policy "보안 로그 삭제 불가" on public.security_logs
  for delete using (false);

-- 보안 통계 뷰 생성
create or replace view public.security_stats as
select 
  event_date,
  event_type,
  severity,
  count(*) as event_count,
  count(distinct user_id) as unique_users,
  count(distinct ip_address) as unique_ips
from public.security_logs
group by event_date, event_type, severity
order by event_date desc, event_count desc;

-- 관리자만 보안 통계 조회 가능
create policy "관리자 보안 통계 조회" on public.security_stats
  for select using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- 보안 알림을 위한 함수 생성
create or replace function public.check_security_alert()
returns trigger as $$
begin
  -- 심각도 HIGH(3) 이상인 경우 알림
  if NEW.severity >= 3 then
    -- 실시간 알림을 위한 채널 알림
    perform pg_notify('security_alert', json_build_object(
      'id', NEW.id,
      'event_type', NEW.event_type,
      'severity', NEW.severity,
      'user_id', NEW.user_id,
      'ip_address', NEW.ip_address,
      'details', NEW.details,
      'created_at', NEW.created_at
    )::text);
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- 보안 알림 트리거 생성
create trigger security_alert_trigger
  after insert on public.security_logs
  for each row
  execute function public.check_security_alert();

-- 자동 아카이빙을 위한 함수 (30일 이후 데이터 압축)
create or replace function public.archive_old_security_logs()
returns void as $$
begin
  -- 30일 이전 데이터를 별도 아카이브 테이블로 이동
  insert into public.security_logs_archive 
  select * from public.security_logs 
  where created_at < current_date - interval '30 days';
  
  -- 원본에서 삭제
  delete from public.security_logs 
  where created_at < current_date - interval '30 days';
end;
$$ language plpgsql;

-- 아카이브 테이블 생성 (압축된 형태)
create table if not exists public.security_logs_archive (
  like public.security_logs including all
);

-- 아카이브 테이블도 RLS 적용
alter table public.security_logs_archive enable row level security;

create policy "관리자 아카이브 조회" on public.security_logs_archive
  for select using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- 일일 아카이빙 스케줄 (cron 확장이 있다면)
-- select cron.schedule('archive-security-logs', '0 2 * * *', 'select public.archive_old_security_logs();'); 