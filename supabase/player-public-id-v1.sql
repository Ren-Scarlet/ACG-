-- Public Chinese IDs for registered players.
-- Run once in Supabase SQL Editor after account-player-binding.sql and player-center-profile.sql.

create or replace view public.public_profiles
with (security_barrier = true)
as
select
  p.username,
  p.created_at,
  title.name as selected_title,
  coalesce((
    select array_agg(badge.name order by badge.name)
    from unnest(coalesce(p.selected_badges, '{}'::text[])) as chosen(achievement_id)
    join public.achievements badge on badge.id = chosen.achievement_id
  ), '{}'::text[]) as selected_badges,
  coalesce(s.games_played, 0) as games_played,
  coalesce(s.wins, 0) as wins,
  coalesce(s.losses, 0) as losses,
  case when coalesce(s.games_played, 0) = 0 then 0
       else round(s.wins::numeric * 100 / s.games_played, 1)
  end as win_rate,
  p.player_number,
  coalesce(r.display_name, p.username) as player_id
from public.profiles p
left join public.player_stats s on s.user_id = p.id
left join public.achievements title on title.id = p.selected_title
left join public.player_registry r on r.player_number = p.player_number;

grant select on public.public_profiles to anon, authenticated;

create or replace function public.admin_update_player_public_id(
  p_player_number text,
  p_public_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_public_id text := trim(coalesce(p_public_id, ''));
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以修改玩家中文 ID';
  end if;
  if p_player_number is null or p_player_number !~ '^P[0-9]{3}$' then
    raise exception '玩家编号无效';
  end if;
  if v_public_id = '' or char_length(v_public_id) > 40 then
    raise exception '中文 ID 不能为空，且最多 40 个字符';
  end if;
  if exists (
    select 1 from public.player_registry r
    where lower(r.display_name) = lower(v_public_id)
      and r.player_number <> p_player_number
  ) then
    raise exception '这个中文 ID 已经被其他玩家使用';
  end if;
  update public.player_registry
  set display_name = v_public_id
  where player_number = p_player_number;
  if not found then
    raise exception '玩家编号不存在';
  end if;
end;
$$;

revoke all on function public.admin_update_player_public_id(text,text) from public, anon, authenticated;
grant execute on function public.admin_update_player_public_id(text,text) to authenticated;
