-- activity_logs 테이블에 레벨 컬럼 추가
alter table public.activity_logs 
add column if not exists level integer not null default 1;

-- 레벨 인덱스 추가
create index if not exists activity_logs_level_idx on public.activity_logs(level);

-- 레벨별 복합 인덱스
create index if not exists activity_logs_level_created_idx on public.activity_logs(level, created_at desc);

-- 레벨 설명 코멘트 추가
comment on column public.activity_logs.level is 'Log level: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR, 4=OFF';

-- 고레벨 로그 뷰 생성 (WARN 이상)
create or replace view public.high_priority_logs as
select 
  id,
  user_id,
  action,
  resource_type,
  resource_id,
  resource_title,
  details,
  ip_address,
  user_agent,
  level,
  created_at,
  case 
    when level = 0 then 'DEBUG'
    when level = 1 then 'INFO'
    when level = 2 then 'WARN'
    when level = 3 then 'ERROR'
    when level = 4 then 'OFF'
    else 'UNKNOWN'
  end as level_name
from public.activity_logs
where level >= 2
order by level desc, created_at desc;

-- 관리자만 고우선순위 로그 조회 가능
alter table public.high_priority_logs enable row level security;

create policy "관리자 고우선순위 로그 조회" on public.high_priority_logs
  for select using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- 로그 레벨별 통계 함수
create or replace function public.get_log_level_stats(days_back integer default 7)
returns table(
  level integer,
  level_name text,
  count bigint,
  percentage numeric
) as $$
begin
  return query
  select 
    l.level,
    case 
      when l.level = 0 then 'DEBUG'
      when l.level = 1 then 'INFO'
      when l.level = 2 then 'WARN'
      when l.level = 3 then 'ERROR'
      when l.level = 4 then 'OFF'
      else 'UNKNOWN'
    end as level_name,
    count(*) as count,
    round(count(*) * 100.0 / sum(count(*)) over(), 2) as percentage
  from public.activity_logs l
  where l.created_at >= current_date - interval '1 day' * days_back
  group by l.level
  order by l.level;
end;
$$ language plpgsql;

-- 로그 레벨 통계 함수 권한 설정
revoke execute on function public.get_log_level_stats(integer) from public;
grant execute on function public.get_log_level_stats(integer) to authenticated;

-- 로그 성능 모니터링을 위한 테이블 생성
create table if not exists public.log_performance_metrics (
  id uuid default gen_random_uuid() primary key,
  metric_type text not null,
  batch_size integer,
  processing_time_ms numeric,
  throughput_per_sec numeric,
  error_count integer default 0,
  error_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 성능 메트릭 인덱스
create index if not exists log_performance_metrics_type_idx on public.log_performance_metrics(metric_type);
create index if not exists log_performance_metrics_created_idx on public.log_performance_metrics(created_at desc);

-- 성능 메트릭 RLS
alter table public.log_performance_metrics enable row level security;

create policy "관리자 성능 메트릭 조회" on public.log_performance_metrics
  for select using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

create policy "시스템 성능 메트릭 삽입" on public.log_performance_metrics
  for insert with check (true);

-- 성능 임계값 알림 함수
create or replace function public.check_performance_threshold()
returns trigger as $$
begin
  -- 처리 시간이 1초 이상인 경우 알림
  if NEW.processing_time_ms > 1000 then
    perform pg_notify('performance_alert', json_build_object(
      'id', NEW.id,
      'metric_type', NEW.metric_type,
      'processing_time_ms', NEW.processing_time_ms,
      'batch_size', NEW.batch_size,
      'throughput_per_sec', NEW.throughput_per_sec,
      'created_at', NEW.created_at
    )::text);
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- 성능 알림 트리거
create trigger performance_alert_trigger
  after insert on public.log_performance_metrics
  for each row
  execute function public.check_performance_threshold(); 