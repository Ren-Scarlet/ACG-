-- ACG legacy cumulative match totals import.
-- Historical totals are deliberately separate from real match_results rows.
-- Run once in Supabase SQL Editor after player-center.sql.

create table if not exists public.player_legacy_match_totals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  player_number text not null,
  wins bigint not null default 0 check (wins >= 0),
  losses bigint not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create index if not exists player_legacy_match_totals_player_number_idx
  on public.player_legacy_match_totals(player_number);

alter table public.player_legacy_match_totals enable row level security;
revoke all on public.player_legacy_match_totals from public, anon, authenticated;

-- Rebuild lifetime stats as imported historical totals + actual registered match rows.
create or replace function public.recalculate_player_stats(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_games bigint;
  v_wins bigint;
  v_losses bigint;
  v_legacy_wins bigint := 0;
  v_legacy_losses bigint := 0;
begin
  select coalesce(wins,0), coalesce(losses,0)
    into v_legacy_wins, v_legacy_losses
  from public.player_legacy_match_totals
  where user_id = p_user_id;

  select
    count(*)::bigint,
    count(*) filter (where result = 'win')::bigint,
    count(*) filter (where result = 'loss')::bigint
  into v_games, v_wins, v_losses
  from public.match_results
  where user_id = p_user_id;

  v_wins := v_wins + v_legacy_wins;
  v_losses := v_losses + v_legacy_losses;
  v_games := v_games + v_legacy_wins + v_legacy_losses;

  insert into public.player_stats (user_id, games_played, wins, losses, updated_at)
  values (p_user_id, v_games, v_wins, v_losses, now())
  on conflict (user_id) do update
    set games_played = excluded.games_played,
        wins = excluded.wins,
        losses = excluded.losses,
        updated_at = now();
end;
$$;

-- Admin-only listing for the import management screen.
create or replace function public.admin_list_legacy_match_totals()
returns table (
  user_id uuid,
  username text,
  player_number text,
  legacy_wins bigint,
  legacy_losses bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以查看历史累计战绩';
  end if;

  return query
  select p.id, p.username, p.player_number,
         coalesce(h.wins,0), coalesce(h.losses,0), h.updated_at
  from public.profiles p
  left join public.player_legacy_match_totals h on h.user_id = p.id
  where p.player_number is not null
  order by p.player_number;
end;
$$;

-- Bulk upsert. Existing imported totals are REPLACED for supplied players, never added.
-- Input: [{"player_number":"P001","wins":12,"losses":5}, ...]
create or replace function public.admin_import_legacy_match_totals(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_player_number text;
  v_wins bigint;
  v_losses bigint;
  v_user_id uuid;
  v_count integer := 0;
  v_seen text[] := array[]::text[];
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以导入历史累计战绩';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception '导入数据必须是数组';
  end if;
  if jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 500 then
    raise exception '每次必须导入 1 至 500 名玩家';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception '每条数据必须包含玩家编号、胜场和败场';
    end if;
    v_player_number := upper(trim(coalesce(v_row->>'player_number','')));
    if v_player_number !~ '^P[0-9]{3}$' then
      raise exception '玩家编号格式错误：%', coalesce(v_row->>'player_number','空值');
    end if;
    if v_player_number = any(v_seen) then
      raise exception '导入数据中存在重复玩家编号：%', v_player_number;
    end if;
    v_seen := array_append(v_seen,v_player_number);

    if coalesce(v_row->>'wins','') !~ '^[0-9]{1,12}$'
       or coalesce(v_row->>'losses','') !~ '^[0-9]{1,12}$' then
      raise exception '% 的胜场或败场必须是非负整数', v_player_number;
    end if;
    v_wins := (v_row->>'wins')::bigint;
    v_losses := (v_row->>'losses')::bigint;

    select p.id into v_user_id
    from public.profiles p
    where p.player_number = v_player_number;

    if v_user_id is null then
      raise exception '玩家编号 % 尚未绑定注册账号', v_player_number;
    end if;

    insert into public.player_legacy_match_totals
      (user_id,player_number,wins,losses,updated_at,updated_by)
    values
      (v_user_id,v_player_number,v_wins,v_losses,now(),auth.uid())
    on conflict (user_id) do update
      set player_number = excluded.player_number,
          wins = excluded.wins,
          losses = excluded.losses,
          updated_at = now(),
          updated_by = auth.uid();

    perform public.recalculate_player_stats(v_user_id);
    perform public.refresh_player_achievements(v_user_id);
    v_count := v_count + 1;
    v_user_id := null;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.admin_list_legacy_match_totals() from public, anon, authenticated;
revoke all on function public.admin_import_legacy_match_totals(jsonb) from public, anon, authenticated;
grant execute on function public.admin_list_legacy_match_totals() to authenticated;
grant execute on function public.admin_import_legacy_match_totals(jsonb) to authenticated;
