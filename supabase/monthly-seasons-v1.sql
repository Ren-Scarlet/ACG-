-- ACG monthly season system v1
-- Timezone: Asia/Shanghai (UTC+8). Historical imported totals are excluded.
-- Run after player-center.sql, legacy-match-totals-v1.sql and item-workshop-mail-v1.sql.

create table if not exists public.match_seasons (
  season_key text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','settled')),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint match_seasons_range_check check (ends_at > starts_at)
);

create table if not exists public.season_player_stats (
  season_key text not null references public.match_seasons(season_key) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now(),
  primary key(season_key,user_id)
);

create table if not exists public.season_rank_rewards (
  rank_code text primary key,
  rank_name text not null check(length(btrim(rank_name)) between 1 and 40),
  min_wins integer not null check(min_wins >= 0),
  reward_attachments jsonb not null default '[]'::jsonb,
  mail_title text not null default '月度赛季奖励',
  mail_body text not null default '感谢参与本月赛季，以下是你的段位奖励。',
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint season_rank_rewards_attachments_array check(jsonb_typeof(reward_attachments)='array')
);

create table if not exists public.season_player_settlements (
  season_key text not null references public.match_seasons(season_key) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  player_number text,
  username text,
  games_played integer not null,
  wins integer not null,
  losses integer not null,
  rank_code text,
  rank_name text,
  mail_id bigint references public.mail_messages(id) on delete set null,
  settled_at timestamptz not null default now(),
  primary key(season_key,user_id)
);

alter table public.match_seasons enable row level security;
alter table public.season_player_stats enable row level security;
alter table public.season_rank_rewards enable row level security;
alter table public.season_player_settlements enable row level security;
revoke all on public.match_seasons,public.season_player_stats,public.season_rank_rewards,public.season_player_settlements from public,anon,authenticated;

-- Create a calendar-month season using Beijing calendar boundaries.
create or replace function public.ensure_monthly_season(p_local_date date default (now() at time zone 'Asia/Shanghai')::date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start date := date_trunc('month',p_local_date)::date;
  v_end date := (date_trunc('month',p_local_date)+interval '1 month')::date;
  v_key text := to_char(v_start,'YYYY-MM');
begin
  insert into public.match_seasons(season_key,starts_at,ends_at,status)
  values(
    v_key,
    v_start::timestamp at time zone 'Asia/Shanghai',
    v_end::timestamp at time zone 'Asia/Shanghai',
    'active'
  )
  on conflict(season_key) do nothing;
  return v_key;
end;
$$;

-- Trigger-maintained monthly statistics. A result is attributed to the match's
-- creation timestamp, not the time at which an administrator later edits it.
create or replace function public.sync_season_match_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id bigint;
  v_user_id uuid;
  v_result text;
  v_created_at timestamptz;
  v_local_date date;
  v_key text;
  v_status text;
begin
  if tg_op='DELETE' then
    v_match_id := old.match_id;
    v_user_id := old.user_id;
    v_result := old.result;
  else
    v_match_id := new.match_id;
    v_user_id := new.user_id;
    v_result := new.result;
  end if;

  select created_at into v_created_at from public.matches where id=v_match_id;
  if v_created_at is null then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  v_local_date := (v_created_at at time zone 'Asia/Shanghai')::date;
  v_key := public.ensure_monthly_season(v_local_date);
  select status into v_status from public.match_seasons where season_key=v_key for update;

  -- Never allow a correction/deletion to silently diverge from an already-issued
  -- settlement snapshot and reward mail. Admins must resolve it explicitly.
  if v_status='settled' then
    raise exception '该比赛所属赛季已结算，不能直接更正；请先联系管理员处理结算记录';
  end if;

  if tg_op='DELETE' then
    update public.season_player_stats
      set games_played=greatest(0,games_played-1),
          wins=greatest(0,wins-case when v_result='win' then 1 else 0 end),
          losses=greatest(0,losses-case when v_result='loss' then 1 else 0 end),
          updated_at=now()
    where season_key=v_key and user_id=v_user_id;
    return old;
  elsif tg_op='INSERT' then
    insert into public.season_player_stats(season_key,user_id,games_played,wins,losses,updated_at)
    values(v_key,v_user_id,1,case when v_result='win' then 1 else 0 end,case when v_result='loss' then 1 else 0 end,now())
    on conflict(season_key,user_id) do update
      set games_played=public.season_player_stats.games_played+1,
          wins=public.season_player_stats.wins+excluded.wins,
          losses=public.season_player_stats.losses+excluded.losses,
          updated_at=now();
    return new;
  else
    -- A result update within the same match: remove old result then add new result.
    update public.season_player_stats
      set wins=greatest(0,wins-case when old.result='win' then 1 else 0 end)
          +case when new.result='win' then 1 else 0 end,
          losses=greatest(0,losses-case when old.result='loss' then 1 else 0 end)
          +case when new.result='loss' then 1 else 0 end,
          updated_at=now()
    where season_key=v_key and user_id=v_user_id;
    return new;
  end if;
end;
$$;

drop trigger if exists match_results_season_sync on public.match_results;
create trigger match_results_season_sync
after insert or update or delete on public.match_results
for each row execute function public.sync_season_match_result();

-- Rebuild one month from authoritative match rows. Useful for safe backfill and audit.
create or replace function public.rebuild_season_stats(p_season_key text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_start timestamptz; v_end timestamptz; v_count integer;
begin
  select starts_at,ends_at into v_start,v_end
  from public.match_seasons where season_key=p_season_key for update;
  if not found then raise exception '找不到指定赛季'; end if;
  if exists(select 1 from public.match_seasons where season_key=p_season_key and status='settled') then
    raise exception '已结算赛季不可重建';
  end if;
  delete from public.season_player_stats where season_key=p_season_key;
  insert into public.season_player_stats(season_key,user_id,games_played,wins,losses)
  select p_season_key,mr.user_id,count(*)::integer,
         count(*) filter(where mr.result='win')::integer,
         count(*) filter(where mr.result='loss')::integer
  from public.match_results mr
  join public.matches m on m.id=mr.match_id
  where m.created_at>=v_start and m.created_at<v_end
  group by mr.user_id;
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

-- Ensure the current Beijing calendar month exists immediately after migration.
select public.ensure_monthly_season((now() at time zone 'Asia/Shanghai')::date);

-- Admin config: thresholds are minimum monthly wins. Highest qualifying threshold wins.
create or replace function public.admin_save_season_rank_reward(
  p_rank_code text,p_rank_name text,p_min_wins integer,p_attachments jsonb,
  p_mail_title text default '月度赛季奖励',
  p_mail_body text default '感谢参与本月赛季，以下是你的段位奖励。',
  p_is_enabled boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_item jsonb;
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以配置赛季奖励'; end if;
  if nullif(btrim(p_rank_code),'') is null or length(p_rank_code)>40 then raise exception '段位编号无效'; end if;
  if nullif(btrim(p_rank_name),'') is null or length(p_rank_name)>40 then raise exception '段位名称无效'; end if;
  if p_min_wins is null or p_min_wins<0 then raise exception '胜场门槛必须是非负整数'; end if;
  if jsonb_typeof(coalesce(p_attachments,'[]'::jsonb))<>'array' then raise exception '奖励附件格式必须为数组'; end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_attachments,'[]'::jsonb)) loop
    if coalesce(v_item->>'reward_type','') not in ('tokens','card','item')
       or coalesce((v_item->>'amount')::bigint,0)<=0
       or (v_item->>'reward_type' in ('card','item') and nullif(v_item->>'reward_id','') is null)
       or (v_item->>'reward_type'='tokens' and coalesce(v_item->>'reward_id','')<>'') then
      raise exception '奖励附件必须是有效的代币、卡牌或道具奖励';
    end if;
  end loop;
  insert into public.season_rank_rewards(rank_code,rank_name,min_wins,reward_attachments,mail_title,mail_body,is_enabled,updated_at)
  values(p_rank_code,p_rank_name,p_min_wins,coalesce(p_attachments,'[]'::jsonb),coalesce(p_mail_title,'月度赛季奖励'),coalesce(p_mail_body,''),coalesce(p_is_enabled,true),now())
  on conflict(rank_code) do update set rank_name=excluded.rank_name,min_wins=excluded.min_wins,
    reward_attachments=excluded.reward_attachments,mail_title=excluded.mail_title,
    mail_body=excluded.mail_body,is_enabled=excluded.is_enabled,updated_at=now();
end;
$$;

create or replace function public.admin_list_season_rank_rewards()
returns setof public.season_rank_rewards
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以查看赛季奖励配置'; end if;
  return query select * from public.season_rank_rewards order by min_wins,rank_code;
end;
$$;

create or replace function public.admin_list_seasons()
returns table(season_key text,starts_at timestamptz,ends_at timestamptz,status text,settled_at timestamptz,players_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以查看赛季记录'; end if;
  return query select s.season_key,s.starts_at,s.ends_at,s.status,s.settled_at,
    (select count(*) from public.season_player_stats ps where ps.season_key=s.season_key)
  from public.match_seasons s order by s.season_key desc;
end;
$$;

-- Idempotent settlement: one immutable player snapshot and at most one reward mail
-- per player per month. Mail attachments remain claimable through the existing mailbox.
create or replace function public.settle_monthly_season(p_season_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season public.match_seasons%rowtype;
  v_row record;
  v_rank public.season_rank_rewards%rowtype;
  v_mail_id bigint;
  v_attachment record;
  v_sent integer:=0;
  v_snap integer:=0;
begin
  select * into v_season from public.match_seasons where season_key=p_season_key for update;
  if not found then raise exception '找不到指定赛季'; end if;
  if v_season.status='settled' then
    return jsonb_build_object('season_key',p_season_key,'already_settled',true,'mail_count',0);
  end if;

  perform public.rebuild_season_stats(p_season_key);

  for v_row in
    select ps.*,p.username,p.player_number
    from public.season_player_stats ps
    join public.profiles p on p.id=ps.user_id
    where ps.season_key=p_season_key
    order by ps.wins desc,ps.losses asc,p.player_number
  loop
    select * into v_rank from public.season_rank_rewards
    where is_enabled and min_wins<=v_row.wins
    order by min_wins desc limit 1;

    v_mail_id:=null;
    if found and jsonb_array_length(v_rank.reward_attachments)>0 then
      insert into public.mail_messages(title,body,created_by)
      values(v_rank.mail_title,
        replace(replace(v_rank.mail_body,'{player}',coalesce(v_row.username,'玩家')),'{rank}',v_rank.rank_name)
        || E'\n\n赛季：'||p_season_key||E'\n段位：'||v_rank.rank_name||E'\n战绩：'||v_row.wins||' 胜 / '||v_row.losses||' 败',
        null)
      returning id into v_mail_id;
      insert into public.mail_recipients(mail_id,user_id) values(v_mail_id,v_row.user_id);
      for v_attachment in
        select value, ordinality
        from jsonb_array_elements(v_rank.reward_attachments) with ordinality as a(value,ordinality)
      loop
        insert into public.mail_attachments(mail_id,reward_type,reward_id,amount,sort_order)
        values(v_mail_id,v_attachment.value->>'reward_type',
          nullif(v_attachment.value->>'reward_id',''),
          (v_attachment.value->>'amount')::bigint,v_attachment.ordinality::integer);
      end loop;
      v_sent:=v_sent+1;
    end if;

    insert into public.season_player_settlements(
      season_key,user_id,player_number,username,games_played,wins,losses,rank_code,rank_name,mail_id
    ) values(p_season_key,v_row.user_id,v_row.player_number,v_row.username,
      v_row.games_played,v_row.wins,v_row.losses,
      case when v_rank.rank_code is null then null else v_rank.rank_code end,
      case when v_rank.rank_name is null then null else v_rank.rank_name end,v_mail_id)
    on conflict(season_key,user_id) do nothing;
    v_snap:=v_snap+1;
  end loop;

  update public.match_seasons set status='settled',settled_at=now() where season_key=p_season_key;
  return jsonb_build_object('season_key',p_season_key,'already_settled',false,'players_snapshotted',v_snap,'mail_count',v_sent);
end;
$$;

create or replace function public.admin_settle_monthly_season(p_season_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以执行赛季结算'; end if;
  return public.settle_monthly_season(p_season_key);
end;
$$;

-- Runs daily at 16:05 UTC (00:05 Beijing next day). The function only settles
-- when the Beijing calendar date is day 1, avoiding UTC/month-length assumptions.
-- If pg_cron is enabled for this database, the schedule is installed automatically.
create or replace function public.run_monthly_season_rollover()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_current text;
  v_previous text;
  v_result jsonb;
begin
  if extract(day from v_today)<>1 then
    v_current:=public.ensure_monthly_season(v_today);
    return jsonb_build_object('current_season',v_current,'settlement_due',false);
  end if;
  v_previous:=to_char((date_trunc('month',v_today::timestamp)-interval '1 month')::date,'YYYY-MM');
  if exists(select 1 from public.match_seasons where season_key=v_previous and status='active') then
    v_result:=public.settle_monthly_season(v_previous);
  else
    v_result:=jsonb_build_object('season_key',v_previous,'already_settled',true,'mail_count',0);
  end if;
  v_current:=public.ensure_monthly_season(v_today);
  return jsonb_build_object('current_season',v_current,'previous_result',v_result);
end;
$$;

revoke all on function public.ensure_monthly_season(date) from public,anon,authenticated;
revoke all on function public.sync_season_match_result() from public,anon,authenticated;
revoke all on function public.rebuild_season_stats(text) from public,anon,authenticated;
revoke all on function public.settle_monthly_season(text) from public,anon,authenticated;
revoke all on function public.run_monthly_season_rollover() from public,anon,authenticated;
revoke all on function public.admin_save_season_rank_reward(text,text,integer,jsonb,text,text,boolean) from public,anon,authenticated;
revoke all on function public.admin_list_season_rank_rewards() from public,anon,authenticated;
revoke all on function public.admin_list_seasons() from public,anon,authenticated;
revoke all on function public.admin_settle_monthly_season(text) from public,anon,authenticated;
grant execute on function public.admin_save_season_rank_reward(text,text,integer,jsonb,text,text,boolean) to authenticated;
grant execute on function public.admin_list_season_rank_rewards() to authenticated;
grant execute on function public.admin_list_seasons() to authenticated;
grant execute on function public.admin_settle_monthly_season(text) to authenticated;

-- Cron setup is intentionally isolated so projects without pg_cron can still run
-- the migration; enable pg_cron and execute the schedule block after confirming it.
do $$
begin
  if exists(select 1 from pg_namespace where nspname='cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='acg-monthly-season-rollover';
    perform cron.schedule('acg-monthly-season-rollover','5 16 * * *',
      'select public.run_monthly_season_rollover();');
  end if;
end;
$$;


-- Player-facing current and historical season records.
create or replace function public.player_list_my_seasons()
returns table(
  season_key text,games_played integer,wins integer,losses integer,
  rank_name text,season_status text,settled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  return query
  select ps.season_key,ps.games_played,ps.wins,ps.losses,
    coalesce(sp.rank_name,rr.rank_name),
    s.status,s.settled_at
  from public.season_player_stats ps
  join public.match_seasons s on s.season_key=ps.season_key
  left join public.season_player_settlements sp
    on sp.season_key=ps.season_key and sp.user_id=ps.user_id
  left join lateral (
    select r.rank_name from public.season_rank_rewards r
    where r.is_enabled and r.min_wins<=ps.wins
    order by r.min_wins desc limit 1
  ) rr on true
  where ps.user_id=auth.uid()
  order by ps.season_key desc;
end;
$$;

create or replace function public.player_get_current_season()
returns table(
  season_key text,starts_at timestamptz,ends_at timestamptz,
  games_played integer,wins integer,losses integer,rank_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare v_key text;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  v_key:=public.ensure_monthly_season((now() at time zone 'Asia/Shanghai')::date);
  return query
  select s.season_key,s.starts_at,s.ends_at,
    coalesce(ps.games_played,0),coalesce(ps.wins,0),coalesce(ps.losses,0),rr.rank_name
  from public.match_seasons s
  left join public.season_player_stats ps on ps.season_key=s.season_key and ps.user_id=auth.uid()
  left join lateral (
    select r.rank_name from public.season_rank_rewards r
    where r.is_enabled and r.min_wins<=coalesce(ps.wins,0)
    order by r.min_wins desc limit 1
  ) rr on true
  where s.season_key=v_key;
end;
$$;

create or replace function public.admin_list_season_settlements(p_season_key text)
returns table(
  user_id uuid,player_number text,username text,games_played integer,
  wins integer,losses integer,rank_code text,rank_name text,mail_id bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以查看结算快照'; end if;
  return query
  select x.user_id,x.player_number,x.username,x.games_played,x.wins,x.losses,
    x.rank_code,x.rank_name,x.mail_id
  from public.season_player_settlements x
  where x.season_key=p_season_key
  order by x.wins desc,x.losses asc,x.player_number;
end;
$$;

-- Resend an existing settlement reward by copying its original attachments.
-- The original mail and snapshot remain intact; every resend is a new mail item.
create or replace function public.admin_resend_season_reward(p_season_key text,p_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare v_old public.season_player_settlements%rowtype; v_old_mail public.mail_messages%rowtype; v_new_id bigint;
begin
  if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以补发赛季奖励'; end if;
  select * into v_old from public.season_player_settlements
    where season_key=p_season_key and user_id=p_user_id;
  if not found or v_old.mail_id is null then raise exception '该玩家没有可补发的赛季奖励邮件'; end if;
  select * into v_old_mail from public.mail_messages where id=v_old.mail_id;
  if not found then raise exception '原奖励邮件不存在'; end if;
  insert into public.mail_messages(title,body,created_by)
  values(v_old_mail.title||'（补发）',v_old_mail.body,auth.uid())
  returning id into v_new_id;
  insert into public.mail_recipients(mail_id,user_id) values(v_new_id,p_user_id);
  insert into public.mail_attachments(mail_id,reward_type,reward_id,amount,sort_order)
  select v_new_id,reward_type,reward_id,amount,sort_order
  from public.mail_attachments where mail_id=v_old.mail_id order by sort_order,id;
  return v_new_id;
end;
$$;

revoke all on function public.player_list_my_seasons() from public,anon,authenticated;
revoke all on function public.player_get_current_season() from public,anon,authenticated;
revoke all on function public.admin_list_season_settlements(text) from public,anon,authenticated;
revoke all on function public.admin_resend_season_reward(text,uuid) from public,anon,authenticated;
grant execute on function public.player_list_my_seasons() to authenticated;
grant execute on function public.player_get_current_season() to authenticated;
grant execute on function public.admin_list_season_settlements(text) to authenticated;
grant execute on function public.admin_resend_season_reward(text,uuid) to authenticated;


-- Backfill the current Beijing month once when the migration is installed.
select public.rebuild_season_stats(
  public.ensure_monthly_season((now() at time zone 'Asia/Shanghai')::date)
);
