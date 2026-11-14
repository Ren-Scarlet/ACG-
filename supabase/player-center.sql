-- ACG Player Center: match registration, correction, statistics and achievements.
-- Run this migration once in Supabase SQL Editor.
-- It does not grant admin rights to any account.

alter table public.matches
  add column if not exists winning_team text;

alter table public.matches
  drop constraint if exists matches_winning_team_check;

alter table public.matches
  add constraint matches_winning_team_check
  check (winning_team is null or winning_team in ('blue','red'));

alter table public.match_results
  add column if not exists team text;

alter table public.match_results
  drop constraint if exists match_results_team_check;

alter table public.match_results
  add constraint match_results_team_check
  check (team is null or team in ('blue','red'));

-- The achievement catalogue is shared by all players.
insert into public.achievements (id, name, description) values
  ('first_match', '初次登场', '完成1场比赛'),
  ('matches_10', '熟面孔', '完成10场比赛'),
  ('matches_50', '百战老兵', '完成50场比赛'),
  ('first_win', '初次胜利', '获得1场胜利'),
  ('win_streak_3', '连胜之势', '连续赢得3场比赛'),
  ('wins_10', '常胜将军', '累计获得10场胜利'),
  ('win_rate_60', '崭露头角', '至少进行10场比赛，胜率达到60%'),
  ('collection_10', '卡牌收藏家', '同时拥有10种不同卡牌'),
  ('collection_50', '丰富收藏', '同时拥有50种不同卡牌'),
  ('first_draw', '初次召唤', '完成第一次抽卡'),
  ('draws_50', '抽卡爱好者', '累计抽卡50次'),
  ('draws_100', '全力以赴', '累计抽卡100次')
on conflict (id) do nothing;

-- Recalculate a player's public match statistics from the source match records.
create or replace function public.recalculate_player_stats(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_games integer;
  v_wins integer;
  v_losses integer;
begin
  select
    count(*)::integer,
    count(*) filter (where result = 'win')::integer,
    count(*) filter (where result = 'loss')::integer
  into v_games, v_wins, v_losses
  from public.match_results
  where user_id = p_user_id;

  insert into public.player_stats (user_id, games_played, wins, losses, updated_at)
  values (p_user_id, v_games, v_wins, v_losses, now())
  on conflict (user_id) do update
    set games_played = excluded.games_played,
        wins = excluded.wins,
        losses = excluded.losses,
        updated_at = now();
end;
$$;

-- Permanent achievement unlocks: later corrections never revoke an earned achievement.
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
begin
  select coalesce(games_played,0), coalesce(wins,0)
    into v_games, v_wins
  from public.player_stats
  where user_id = p_user_id;

  select count(*)::integer
    into v_distinct_cards
  from public.card_inventory
  where user_id = p_user_id and quantity > 0;

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
  select count(*)::integer
    into v_current_streak
  from ordered
  where result = 'win'
    and rn < coalesce((select rn from first_loss), 2147483647);

  insert into public.player_achievements (user_id, achievement_id)
  select p_user_id, a.id
  from public.achievements a
  where
    (a.id = 'first_match' and v_games >= 1) or
    (a.id = 'matches_10' and v_games >= 10) or
    (a.id = 'matches_50' and v_games >= 50) or
    (a.id = 'first_win' and v_wins >= 1) or
    (a.id = 'win_streak_3' and v_current_streak >= 3) or
    (a.id = 'wins_10' and v_wins >= 10) or
    (a.id = 'win_rate_60' and v_games >= 10 and v_wins::numeric / v_games >= 0.6) or
    (a.id = 'collection_10' and v_distinct_cards >= 10) or
    (a.id = 'collection_50' and v_distinct_cards >= 50)
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

-- Register one 2v2 match. All four players must be distinct and already registered.
create or replace function public.admin_register_2v2_match(
  p_description text,
  p_blue_player_1 uuid,
  p_blue_player_2 uuid,
  p_red_player_1 uuid,
  p_red_player_2 uuid,
  p_winning_team text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id bigint;
  v_players uuid[] := array[p_blue_player_1,p_blue_player_2,p_red_player_1,p_red_player_2];
  v_player uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以登记比赛';
  end if;
  if p_winning_team not in ('blue','red') then
    raise exception '获胜队伍必须是 blue 或 red';
  end if;
  if array_position(v_players, null) is not null or
     (select count(distinct x) from unnest(v_players) as t(x)) <> 4 then
    raise exception '必须选择四名不同的玩家';
  end if;
  if (select count(*) from public.profiles where id = any(v_players)) <> 4 then
    raise exception '玩家账号不存在或尚未完成注册';
  end if;

  insert into public.matches (created_by, description, winning_team)
  values (auth.uid(), nullif(trim(p_description), ''), p_winning_team)
  returning id into v_match_id;

  insert into public.match_results (match_id,user_id,result,team)
  values
    (v_match_id,p_blue_player_1,case when p_winning_team='blue' then 'win' else 'loss' end,'blue'),
    (v_match_id,p_blue_player_2,case when p_winning_team='blue' then 'win' else 'loss' end,'blue'),
    (v_match_id,p_red_player_1,case when p_winning_team='red' then 'win' else 'loss' end,'red'),
    (v_match_id,p_red_player_2,case when p_winning_team='red' then 'win' else 'loss' end,'red');

  foreach v_player in array v_players loop
    perform public.recalculate_player_stats(v_player);
    perform public.refresh_player_achievements(v_player);
  end loop;

  return v_match_id;
end;
$$;

-- Correct a match without losing historical achievement unlocks.
create or replace function public.admin_correct_2v2_match(
  p_match_id bigint,
  p_description text,
  p_blue_player_1 uuid,
  p_blue_player_2 uuid,
  p_red_player_1 uuid,
  p_red_player_2 uuid,
  p_winning_team text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_players uuid[] := array[p_blue_player_1,p_blue_player_2,p_red_player_1,p_red_player_2];
  v_affected uuid[];
  v_player uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以更正比赛';
  end if;
  if p_winning_team not in ('blue','red') then
    raise exception '获胜队伍必须是 blue 或 red';
  end if;
  if array_position(v_players, null) is not null or
     (select count(distinct x) from unnest(v_players) as t(x)) <> 4 then
    raise exception '必须选择四名不同的玩家';
  end if;
  if (select count(*) from public.profiles where id = any(v_players)) <> 4 then
    raise exception '玩家账号不存在或尚未完成注册';
  end if;
  if not exists (select 1 from public.matches where id = p_match_id) then
    raise exception '找不到这场比赛';
  end if;

  select coalesce(array_agg(distinct user_id), array[]::uuid[])
    into v_affected
  from public.match_results
  where match_id = p_match_id;

  update public.matches
  set description = nullif(trim(p_description), ''),
      winning_team = p_winning_team
  where id = p_match_id;

  delete from public.match_results where match_id = p_match_id;

  insert into public.match_results (match_id,user_id,result,team)
  values
    (p_match_id,p_blue_player_1,case when p_winning_team='blue' then 'win' else 'loss' end,'blue'),
    (p_match_id,p_blue_player_2,case when p_winning_team='blue' then 'win' else 'loss' end,'blue'),
    (p_match_id,p_red_player_1,case when p_winning_team='red' then 'win' else 'loss' end,'red'),
    (p_match_id,p_red_player_2,case when p_winning_team='red' then 'win' else 'loss' end,'red');

  v_affected := v_affected || v_players;
  for v_player in select distinct unnest(v_affected) loop
    perform public.recalculate_player_stats(v_player);
    perform public.refresh_player_achievements(v_player);
  end loop;
end;
$$;

revoke all on function public.recalculate_player_stats(uuid) from public, anon, authenticated;
revoke all on function public.refresh_player_achievements(uuid) from public, anon, authenticated;
revoke all on function public.admin_register_2v2_match(text,uuid,uuid,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.admin_correct_2v2_match(bigint,text,uuid,uuid,uuid,uuid,text) from public, anon, authenticated;

grant execute on function public.admin_register_2v2_match(text,uuid,uuid,uuid,uuid,text) to authenticated;
grant execute on function public.admin_correct_2v2_match(bigint,text,uuid,uuid,uuid,uuid,text) to authenticated;
