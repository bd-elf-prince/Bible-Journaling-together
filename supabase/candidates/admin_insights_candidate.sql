-- 스크립트 이름: CommentBible 관리자 인사이트 candidate migration
-- 버전: 1.0.0
-- 작성일: 2026-08-14
-- 변경사항: first-party analytics, admin ACL/RLS, dedupe, rollup, retention
-- 용도: staging 검증 전 additive SQL 후보
-- 사용자 입력 필요: private.cb_insights_admins 관리자 UUID, pg_cron 일정

begin;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

create table if not exists private.cb_insights_admins(
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid null references auth.users(id)
);
revoke all on private.cb_insights_admins from public, anon, authenticated;

create or replace function private.cb_has_insights_access()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.cb_insights_admins a where a.user_id=(select auth.uid()) and a.active)
$$;
revoke all on function private.cb_has_insights_access() from public;
grant usage on schema private to authenticated;
grant execute on function private.cb_has_insights_access() to authenticated;

create or replace function public.cb_is_insights_admin(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.cb_insights_admins a where a.user_id=p_user_id and a.active)
$$;
revoke all on function public.cb_is_insights_admin(uuid) from public, anon, authenticated;
grant execute on function public.cb_is_insights_admin(uuid) to service_role;

create table if not exists public.cb_analytics_event_dedup(
  event_id uuid primary key,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create table if not exists public.cb_analytics_events(
  event_id uuid not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  event_type text not null check(event_type in ('page_view','bible_read','signup_succeeded','login_succeeded','post_created','comment_created','content_updated','content_deleted','report_created','notification_opened','http_error','rate_limited','request_timing','consent_withdrawn')),
  visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),
  session_hash text not null check(session_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid null references auth.users(id) on delete set null,
  path text not null check(length(path)<=160 and path like '/%'),
  referrer_host text not null default '' check(length(referrer_host)<=120),
  device text not null check(device in ('mobile','tablet','desktop','other')),
  browser text not null check(browser in ('Chrome','Safari','Firefox','Edge','Other')),
  country text not null check(country ~ '^[A-Z]{2}$'),
  duration_ms integer null check(duration_ms between 0 and 120000),
  properties jsonb not null default '{}'::jsonb check(jsonb_typeof(properties)='object'),
  primary key(event_id,occurred_at)
) partition by range(occurred_at);

do $$
declare month_start date:=date_trunc('month',now())::date; next_start date:=(date_trunc('month',now())+interval '1 month')::date; after_next date:=(date_trunc('month',now())+interval '2 month')::date;
begin
  execute format('create table if not exists public.cb_analytics_events_%s partition of public.cb_analytics_events for values from (%L) to (%L)',to_char(month_start,'YYYYMM'),month_start,next_start);
  execute format('create table if not exists public.cb_analytics_events_%s partition of public.cb_analytics_events for values from (%L) to (%L)',to_char(next_start,'YYYYMM'),next_start,after_next);
end $$;
create table if not exists public.cb_analytics_events_default partition of public.cb_analytics_events default;
do $$declare part record;begin for part in select inhrelid::regclass table_name from pg_inherits where inhparent='public.cb_analytics_events'::regclass loop execute format('revoke all on table %s from public, anon, authenticated',part.table_name);end loop;end $$;
create index if not exists cb_analytics_events_time_idx on public.cb_analytics_events(occurred_at desc);
create index if not exists cb_analytics_events_session_time_idx on public.cb_analytics_events(session_hash,occurred_at desc);
create index if not exists cb_analytics_events_visitor_time_idx on public.cb_analytics_events(visitor_hash,occurred_at desc);
create index if not exists cb_analytics_events_type_time_idx on public.cb_analytics_events(event_type,occurred_at desc);
create index if not exists cb_analytics_events_path_time_idx on public.cb_analytics_events(path,occurred_at desc) where event_type='page_view';
create index if not exists cb_analytics_events_user_time_idx on public.cb_analytics_events(user_id,occurred_at desc) where user_id is not null;

create table if not exists public.cb_analytics_sessions(
  session_hash text primary key check(session_hash ~ '^[a-f0-9]{64}$'),visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),user_id uuid null references auth.users(id) on delete set null,
  first_at timestamptz not null,last_at timestamptz not null,first_path text not null,last_path text not null,pageview_count integer not null default 0,action_count integer not null default 0,
  referrer_host text not null default '',device text not null,country text not null,event_types text[] not null default '{}',is_returning boolean not null default false
);
create index if not exists cb_analytics_sessions_last_cursor_idx on public.cb_analytics_sessions(last_at desc,session_hash desc);
create index if not exists cb_analytics_sessions_visitor_first_idx on public.cb_analytics_sessions(visitor_hash,first_at);
create index if not exists cb_analytics_sessions_user_last_idx on public.cb_analytics_sessions(user_id,last_at desc) where user_id is not null;

create table if not exists public.cb_analytics_daily_rollups(
  day date not null,event_type text not null,dimension text not null default 'all',dimension_value text not null default 'all',event_count bigint not null default 0,visitor_count bigint not null default 0,session_count bigint not null default 0,primary key(day,event_type,dimension,dimension_value)
);
create index if not exists cb_analytics_rollup_day_idx on public.cb_analytics_daily_rollups(day desc,event_type);
create table if not exists public.cb_analytics_health(day date primary key,browser_dropped bigint not null default 0,ingest_rejected bigint not null default 0,updated_at timestamptz not null default now());
create table if not exists public.cb_analytics_privacy_tombstones(visitor_hash text primary key,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '35 days');
create unlogged table if not exists public.cb_analytics_rate_limits(subject_digest text not null,bucket_start timestamptz not null,request_count integer not null default 1,expires_at timestamptz not null,primary key(subject_digest,bucket_start));

alter table public.cb_analytics_event_dedup enable row level security;alter table public.cb_analytics_event_dedup force row level security;
alter table public.cb_analytics_events enable row level security;alter table public.cb_analytics_events force row level security;
alter table public.cb_analytics_sessions enable row level security;alter table public.cb_analytics_sessions force row level security;
alter table public.cb_analytics_daily_rollups enable row level security;alter table public.cb_analytics_daily_rollups force row level security;
alter table public.cb_analytics_health enable row level security;alter table public.cb_analytics_health force row level security;
alter table public.cb_analytics_privacy_tombstones enable row level security;alter table public.cb_analytics_privacy_tombstones force row level security;
alter table public.cb_analytics_rate_limits enable row level security;alter table public.cb_analytics_rate_limits force row level security;
revoke all on public.cb_analytics_event_dedup,public.cb_analytics_events,public.cb_analytics_sessions,public.cb_analytics_daily_rollups,public.cb_analytics_health,public.cb_analytics_privacy_tombstones,public.cb_analytics_rate_limits from public,anon,authenticated;
grant select on public.cb_analytics_sessions,public.cb_analytics_daily_rollups,public.cb_analytics_health to authenticated;
create policy cb_insights_admin_sessions on public.cb_analytics_sessions for select to authenticated using ((select private.cb_has_insights_access()));
create policy cb_insights_admin_rollups on public.cb_analytics_daily_rollups for select to authenticated using ((select private.cb_has_insights_access()));
create policy cb_insights_admin_health on public.cb_analytics_health for select to authenticated using ((select private.cb_has_insights_access()));

create or replace function public.cb_consume_analytics_rate_limit(p_subject_digest text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare bucket timestamptz:=to_timestamp(floor(extract(epoch from now())/greatest(1,p_window_seconds))*greatest(1,p_window_seconds)); current_count integer;
begin
 if p_subject_digest !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 10000 or p_window_seconds not between 1 and 86400 then return false;end if;
 insert into public.cb_analytics_rate_limits(subject_digest,bucket_start,request_count,expires_at) values(p_subject_digest,bucket,1,bucket+make_interval(secs=>p_window_seconds)+interval '2 days')
 on conflict(subject_digest,bucket_start) do update set request_count=public.cb_analytics_rate_limits.request_count+1 returning request_count into current_count;
 return current_count<=p_limit;
end $$;

create or replace function public.cb_ingest_analytics_events(p_events jsonb,p_user_id uuid default null,p_browser_dropped integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb;claimed integer;accepted integer:=0;duplicates integer:=0;rejected integer:=0;vhash text;shash text;etype text;at timestamptz;
begin
 if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>20 then raise exception 'invalid batch';end if;
 for item in select value from jsonb_array_elements(p_events) loop
  begin
   vhash:=item->>'visitor_hash';shash:=item->>'session_hash';etype:=item->>'event_type';at:=(item->>'occurred_at')::timestamptz;
   if exists(select 1 from public.cb_analytics_privacy_tombstones t where t.visitor_hash=vhash and t.expires_at>now()) then rejected:=rejected+1;continue;end if;
   insert into public.cb_analytics_event_dedup(event_id,occurred_at) values((item->>'event_id')::uuid,at) on conflict do nothing;get diagnostics claimed=row_count;
   if claimed=0 then duplicates:=duplicates+1;continue;end if;
   insert into public.cb_analytics_events(event_id,occurred_at,event_type,visitor_hash,session_hash,user_id,path,referrer_host,device,browser,country,duration_ms,properties)
   values((item->>'event_id')::uuid,at,etype,vhash,shash,p_user_id,item->>'path',coalesce(item->>'referrer_host',''),item->>'device',item->>'browser',item->>'country',nullif(item->>'duration_ms','')::integer,coalesce(item->'properties','{}'::jsonb));
   insert into public.cb_analytics_sessions(session_hash,visitor_hash,user_id,first_at,last_at,first_path,last_path,pageview_count,action_count,referrer_host,device,country,event_types,is_returning)
   values(shash,vhash,p_user_id,at,at,item->>'path',item->>'path',(etype='page_view')::integer,(etype<>'page_view')::integer,coalesce(item->>'referrer_host',''),item->>'device',item->>'country',array[etype],exists(select 1 from public.cb_analytics_sessions s where s.visitor_hash=vhash and s.session_hash<>shash))
   on conflict(session_hash) do update set last_at=greatest(public.cb_analytics_sessions.last_at,excluded.last_at),last_path=case when excluded.last_at>=public.cb_analytics_sessions.last_at then excluded.last_path else public.cb_analytics_sessions.last_path end,user_id=coalesce(excluded.user_id,public.cb_analytics_sessions.user_id),pageview_count=public.cb_analytics_sessions.pageview_count+excluded.pageview_count,action_count=public.cb_analytics_sessions.action_count+excluded.action_count,event_types=(select array_agg(distinct x) from unnest(public.cb_analytics_sessions.event_types||excluded.event_types)x),is_returning=public.cb_analytics_sessions.is_returning or excluded.is_returning;
   accepted:=accepted+1;
  exception when others then rejected:=rejected+1;delete from public.cb_analytics_event_dedup where event_id=(item->>'event_id')::uuid;end;
 end loop;
 insert into public.cb_analytics_health(day,browser_dropped,ingest_rejected) values(current_date,greatest(0,p_browser_dropped),rejected) on conflict(day) do update set browser_dropped=public.cb_analytics_health.browser_dropped+excluded.browser_dropped,ingest_rejected=public.cb_analytics_health.ingest_rejected+excluded.ingest_rejected,updated_at=now();
 return jsonb_build_object('accepted',accepted,'duplicate',duplicates,'rejected',rejected);
end $$;

create or replace function public.cb_withdraw_analytics_consent(p_visitor_hash text,p_user_id uuid default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 insert into public.cb_analytics_privacy_tombstones(visitor_hash) values(p_visitor_hash) on conflict(visitor_hash) do update set created_at=now(),expires_at=now()+interval '35 days';
 delete from public.cb_analytics_events where visitor_hash=p_visitor_hash or (p_user_id is not null and user_id=p_user_id);
 delete from public.cb_analytics_sessions where visitor_hash=p_visitor_hash or (p_user_id is not null and user_id=p_user_id);
 update public.cb_analytics_events set user_id=null where p_user_id is not null and user_id=p_user_id;
 return true;
end $$;

create or replace function public.cb_admin_insights_snapshot(p_days integer default 7)
returns jsonb language sql stable security definer set search_path='' as $$
with bounds as(select now()-make_interval(days=>least(30,greatest(1,p_days))) since),e as(select * from public.cb_analytics_events,bounds where occurred_at>=since),m as(select jsonb_build_object(
 'active_now',(select count(distinct visitor_hash) from public.cb_analytics_sessions where last_at>=now()-interval '5 minutes'),'visitors_today',count(distinct visitor_hash) filter(where occurred_at>=date_trunc('day',now())),'visitors_7d',(select count(distinct visitor_hash) from public.cb_analytics_events where occurred_at>=now()-interval '7 days'),'visitors_30d',(select count(distinct visitor_hash) from public.cb_analytics_events where occurred_at>=now()-interval '30 days'),'sessions',count(distinct session_hash),'new_visitors',(select count(*) from public.cb_analytics_sessions,bounds where first_at>=since and not is_returning),'returning_visitors',(select count(*) from public.cb_analytics_sessions,bounds where first_at>=since and is_returning),'pageviews',count(*) filter(where event_type='page_view'),'signup',count(*) filter(where event_type='signup_succeeded'),'login',count(*) filter(where event_type='login_succeeded'),'post',count(*) filter(where event_type='post_created'),'comment',count(*) filter(where event_type='comment_created'),'reports',count(*) filter(where event_type='report_created'),'errors',count(*) filter(where event_type='http_error'),'rate_429',count(*) filter(where event_type='rate_limited'),'read_p50',coalesce(round(percentile_cont(.5) within group(order by duration_ms) filter(where event_type='request_timing' and properties->>'operation'='read')),0),'read_p95',coalesce(round(percentile_cont(.95) within group(order by duration_ms) filter(where event_type='request_timing' and properties->>'operation'='read')),0),'write_p50',coalesce(round(percentile_cont(.5) within group(order by duration_ms) filter(where event_type='request_timing' and properties->>'operation'='write')),0),'write_p95',coalesce(round(percentile_cont(.95) within group(order by duration_ms) filter(where event_type='request_timing' and properties->>'operation'='write')),0),'dropped',(select coalesce(sum(browser_dropped+ingest_rejected),0) from public.cb_analytics_health,bounds where day>=since::date)) metrics from e)
select jsonb_build_object('generated_at',now(),'metrics',(select metrics from m),
 'trend',(select coalesce(jsonb_agg(x order by bucket),'[]') from(select date_trunc('hour',occurred_at) bucket,count(distinct visitor_hash) visitors,count(*) filter(where event_type='page_view') pageviews from e group by 1)x),
 'popular_bible',(select coalesce(jsonb_agg(x),'[]') from(select concat(properties->>'book',' ',properties->>'chapter','장') label,count(*) count from e where event_type='bible_read' group by 1 order by 2 desc limit 8)x),
 'popular_pages',(select coalesce(jsonb_agg(x),'[]') from(select path label,count(*) count from e where event_type='page_view' group by 1 order by 2 desc limit 8)x),
 'sources',(select coalesce(jsonb_agg(x),'[]') from(select coalesce(nullif(properties->>'utm_source',''),nullif(referrer_host,''),'direct') label,count(*) count from e group by 1 order by 2 desc limit 8)x),
 'devices',(select coalesce(jsonb_agg(x),'[]') from(select device label,count(*) count from e group by 1 order by 2 desc)x),'browsers',(select coalesce(jsonb_agg(x),'[]') from(select browser label,count(*) count from e group by 1 order by 2 desc)x),'countries',(select coalesce(jsonb_agg(x),'[]') from(select country label,count(*) count from e group by 1 order by 2 desc limit 12)x),
 'funnel',jsonb_build_array(jsonb_build_object('label','방문','count',(select count(distinct session_hash) from e)),jsonb_build_object('label','성경 열람','count',(select count(distinct session_hash) from e where event_type='bible_read')),jsonb_build_object('label','로그인','count',(select count(distinct session_hash) from e where event_type='login_succeeded')),jsonb_build_object('label','글·댓글','count',(select count(distinct session_hash) from e where event_type in('post_created','comment_created')))))
$$;

create or replace function public.cb_admin_insights_visitors(p_from date default null,p_to date default null,p_event text default null,p_source text default null,p_login text default 'all',p_cursor text default null,p_limit integer default 25)
returns jsonb language sql stable security definer set search_path='' as $$
with filtered as(select s.* from public.cb_analytics_sessions s where (p_from is null or s.last_at>=p_from) and(p_to is null or s.last_at<p_to+1) and(p_event is null or p_event=any(s.event_types)) and(p_source is null or s.referrer_host=p_source) and(p_login='all' or(p_login='yes' and s.user_id is not null)or(p_login='no' and s.user_id is null)) and(p_cursor is null or(s.last_at,s.session_hash)<(split_part(p_cursor,'|',1)::timestamptz,split_part(p_cursor,'|',2))) order by s.last_at desc,s.session_hash desc limit least(101,greatest(1,p_limit)+1)),page as(select * from filtered limit least(100,greatest(1,p_limit)))
select jsonb_build_object('rows',(select coalesce(jsonb_agg(jsonb_build_object('first_at',first_at,'visitor_id',left(visitor_hash,12),'session_id',left(session_hash,12),'logged_in',user_id is not null,'masked_user',case when user_id is null then '—' else 'usr_'||left(encode(extensions.digest(user_id::text,'sha256'),'hex'),8) end,'first_path',first_path,'last_path',last_path,'pageviews',pageview_count,'actions',action_count,'source',coalesce(nullif(referrer_host,''),'direct'),'device',device,'country',country,'last_at',last_at) order by last_at desc,session_hash desc),'[]') from page),'next_cursor',(select case when (select count(*) from filtered)>least(100,greatest(1,p_limit)) then last_at::text||'|'||session_hash else null end from page order by last_at,session_hash limit 1),'dropped',(select coalesce(sum(browser_dropped+ingest_rejected),0) from public.cb_analytics_health where day>=current_date-30))
$$;

create or replace function public.cb_rollup_and_retain_analytics()
returns jsonb language plpgsql security definer set search_path='' as $$
declare rolled bigint:=0;deleted bigint:=0;
begin
 perform pg_advisory_xact_lock(hashtext('cb_rollup_and_retain_analytics'));
 insert into public.cb_analytics_daily_rollups(day,event_type,event_count,visitor_count,session_count)
 select occurred_at::date,event_type,count(*),count(distinct visitor_hash),count(distinct session_hash) from public.cb_analytics_events where occurred_at<now()-interval '30 days' group by 1,2
 on conflict(day,event_type,dimension,dimension_value) do update set event_count=public.cb_analytics_daily_rollups.event_count+excluded.event_count,visitor_count=public.cb_analytics_daily_rollups.visitor_count+excluded.visitor_count,session_count=public.cb_analytics_daily_rollups.session_count+excluded.session_count;
 get diagnostics rolled=row_count;delete from public.cb_analytics_events where occurred_at<now()-interval '30 days';get diagnostics deleted=row_count;
 delete from public.cb_analytics_sessions where last_at<now()-interval '30 days';delete from public.cb_analytics_daily_rollups where day<current_date-760;delete from public.cb_analytics_event_dedup where received_at<now()-interval '32 days';delete from public.cb_analytics_privacy_tombstones where expires_at<now();delete from public.cb_analytics_rate_limits where expires_at<now();
 return jsonb_build_object('rollup_rows',rolled,'raw_deleted',deleted);
end $$;

revoke all on function public.cb_consume_analytics_rate_limit(text,integer,integer),public.cb_ingest_analytics_events(jsonb,uuid,integer),public.cb_withdraw_analytics_consent(text,uuid),public.cb_admin_insights_snapshot(integer),public.cb_admin_insights_visitors(date,date,text,text,text,text,integer),public.cb_rollup_and_retain_analytics() from public,anon,authenticated;
grant execute on function public.cb_consume_analytics_rate_limit(text,integer,integer),public.cb_ingest_analytics_events(jsonb,uuid,integer),public.cb_withdraw_analytics_consent(text,uuid),public.cb_admin_insights_snapshot(integer),public.cb_admin_insights_visitors(date,date,text,text,text,text,integer),public.cb_rollup_and_retain_analytics() to service_role;
commit;

-- 보존: raw/session 30일, rate digest 2일, tombstone 35일, 일별 rollup 760일.
-- 운영: pg_cron으로 rollup/retention 매일, 다음 월 partition 생성 월 1회. raw IP/원문 UA/정확 위치/본문은 저장하지 않는다.
-- 스크립트 끝 — CommentBible 관리자 인사이트 candidate migration 1.0.0
