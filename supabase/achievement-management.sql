-- ACG achievement management: editable catalogue, supported unlock rules, and safe permanent unlocks.
-- Run once in Supabase SQL Editor after player-center.sql, achievement-rewards.sql and card-draw.sql.

alter table public.achievements
  add column if not exists is_active boolean not null default true,
  add column if not exists condition_type text,
  add column if not exists threshold numeric,
  add column if not exists min_games integer not null default 0;

-- Backfill the existing catalogue without changing IDs or player unlock history.
update public.achievements set condition_type='matches', threshold=1, min_games=0 where id='first_match';
update public.achievements set condition_type='matches', threshold=10, min_games=0 where id='matches_10';
update public.achievements set condition_type='matches', threshold=50, min_games=0 where id='matches_50';
update public.achievements set condition_type='wins', threshold=1, min_games=0 where id='first_win';
update public.achievements set condition_type='win_streak', threshold=3, min_games=0 where id='win_streak_3';
update public.achievements set condition_type='wins', threshold=10, min_games=0 where id='wins_10';
update public.achievements set condition_type='win_rate', threshold=60, min_games=10 where id='win_rate_60';
update public.achievements set condition_type='collection', threshold=10, min_games=0 where id='collection_10';
update public.achievements set condition_type='collection', threshold=50, min_games=0 where id='collection_50';
update public.achievements set condition_type='draws', threshold=1, min_games=0 where id='first_draw';
update public.achievements set condition_type='draws', threshold=50, min_games=0 where id='draws_50';
update public.achievements set condition_type='draws', threshold=100, min_games=0 where id='draws_100';

update public.achievements
set condition_type=coalesce(condition_type,'matches'),
    threshold=coalesce(threshold,1)
where condition_type is null or threshold is null;

alter table public.achievements
  alter column condition_type set default 'matches',
  alter column condition_type set not null,
  alter column threshold set default 1,
  alter column threshold set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.achievements'::regclass and conname='achievements_condition_type_check') then
    alter table public.achievements add constraint achievements_condition_type_check
      check (condition_type in ('matches','wins','win_streak','win_rate','collection','draws'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.achievements'::regclass and conname='achievements_threshold_check') then
    alter table public.achievements add constraint achievements_threshold_check
      check (threshold > 0 and (condition_type <> 'win_rate' or threshold <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.achievements'::regclass and conname='achievements_min_games_check') then
    alter table public.achievements add constraint achievements_min_games_check
      check (min_games >= 0 and (condition_type <> 'win_rate' or min_games > 0));
  end if;
end;
$$;

-- Only active achievements can be newly earned. Existing unlocks are never deleted.
create or replace function public.refresh_player_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_games integer;
  v_wins integer;
  v_distinct_cards integer;
  v_current_streak integer;
  v_draws bigint;
begin
  select coalesce(games_played,0), coalesce(wins,0)
    into v_games, v_wins
  from public.player_stats
  where user_id = p_user_id;

  select count(*)::integer into v_distinct_cards
  from public.card_inventory
  where user_id = p_user_id and quantity > 0;

  select count(*) into v_draws
  from public.card_draw_history
  where user_id = p_user_id;

  with ordered as (
    select mr.result,
           row_number() over (
             order by coalesce(m.created_at, 'epoch'::timestamptz) desc, m.id desc
           ) as rn
    from public.match_results mr
    join public.matches m on m.id = mr.match_id
    where mr.user_id = p_user_id
  ),
  first_loss as (
    select min(rn) as rn from ordered where result = 'loss'
  )
  select count(*)::integer into v_current_streak
  from ordered
  where result = 'win'
    and rn < coalesce((select rn from first_loss), 2147483647);

  insert into public.player_achievements (user_id, achievement_id)
  select p_user_id, a.id
  from public.achievements a
  where a.is_active = true
    and case a.condition_type
      when 'matches' then v_games >= a.threshold
      when 'wins' then v_wins >= a.threshold
      when 'win_streak' then v_current_streak >= a.threshold
      when 'win_rate' then v_games >= a.min_games and v_games > 0
        and (v_wins::numeric * 100 / v_games) >= a.threshold
      when 'collection' then v_distinct_cards >= a.threshold
      when 'draws' then v_draws >= a.threshold
      else false
    end
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

-- A draw is a progress event too; this makes custom draw achievements work immediately.
create or replace function public.refresh_achievements_after_draw()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_player_achievements(new.user_id);
  return new;
end;
$$;

drop trigger if exists card_draw_refresh_achievements on public.card_draw_history;
create trigger card_draw_refresh_achievements
after insert on public.card_draw_history
for each row execute function public.refresh_achievements_after_draw();

revoke all on function public.refresh_achievements_after_draw() from public, anon, authenticated;

-- Admin-only create/update endpoint. IDs are stable once created; updates preserve unlocks.
create or replace function public.admin_save_achievement(
  p_id text,
  p_name text,
  p_description text,
  p_reward_tokens bigint,
  p_is_active boolean,
  p_condition_type text,
  p_threshold numeric,
  p_min_games integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以管理成就';
  end if;
  if p_id is null or p_id !~ '^[a-z0-9][a-z0-9_-]{1,49}$' then
    raise exception '成就 ID 必须为 2–50 位小写英文字母、数字、下划线或短横线';
  end if;
  if p_name is null or length(trim(p_name)) not between 1 and 40 then
    raise exception '成就名称必须为 1–40 个字符';
  end if;
  if p_description is null or length(trim(p_description)) not between 1 and 160 then
    raise exception '成就描述必须为 1–160 个字符';
  end if;
  if p_reward_tokens is null or p_reward_tokens < 0 then
    raise exception '奖励代币不能小于 0';
  end if;
  if p_is_active is null then
    raise exception '必须指定成就是否启用';
  end if;
  if p_condition_type not in ('matches','wins','win_streak','win_rate','collection','draws') then
    raise exception '不支持的成就条件类型';
  end if;
  if p_threshold is null or p_threshold <= 0 or
     (p_condition_type='win_rate' and p_threshold > 100) or
     (p_condition_type <> 'win_rate' and p_threshold <> trunc(p_threshold)) then
    raise exception '目标值必须大于 0；非胜率目标必须为整数，胜率目标不能超过 100';
  end if;
  if p_min_games is null or p_min_games < 0 or
     (p_condition_type='win_rate' and p_min_games < 1) then
    raise exception '最少比赛场次不能小于 0；胜率成就至少需要 1 场比赛';
  end if;
  if p_condition_type <> 'win_rate' and p_min_games <> 0 then
    raise exception '只有胜率成就需要设置最少比赛场次';
  end if;

  insert into public.achievements
    (id,name,description,reward_tokens,is_active,condition_type,threshold,min_games)
  values
    (p_id,trim(p_name),trim(p_description),p_reward_tokens,p_is_active,p_condition_type,p_threshold,p_min_games)
  on conflict (id) do update set
    name=excluded.name,
    description=excluded.description,
    reward_tokens=excluded.reward_tokens,
    is_active=excluded.is_active,
    condition_type=excluded.condition_type,
    threshold=excluded.threshold,
    min_games=excluded.min_games;
end;
$$;

revoke all on function public.admin_save_achievement(text,text,text,bigint,boolean,text,numeric,integer) from public, anon, authenticated;
grant execute on function public.admin_save_achievement(text,text,text,bigint,boolean,text,numeric,integer) to authenticated;
