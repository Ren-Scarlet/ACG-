-- ACG Avatar Frames v1
-- Run once after player-avatar-v1.sql and player-avatar-save-v1.sql.

alter table public.profiles
  add column if not exists avatar_frame_id smallint;

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
  coalesce(r.display_name, p.username) as player_id,
  p.avatar_url,
  p.avatar_frame_id
from public.profiles p
left join public.player_stats s on s.user_id = p.id
left join public.achievements title on title.id = p.selected_title
left join public.player_registry r on r.player_number = p.player_number;

grant select on public.public_profiles to anon, authenticated;

create or replace function public.save_player_avatar_frame(p_frame_id smallint)
returns smallint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception '请先登录后再设置头像框。';
  end if;

  if p_frame_id is not null and (p_frame_id < 1 or p_frame_id > 12) then
    raise exception '头像框编号无效。';
  end if;

  update public.profiles
     set avatar_frame_id = p_frame_id
   where id = v_user_id;

  if not found then
    raise exception '没有找到当前玩家资料。';
  end if;

  return p_frame_id;
end;
$$;

revoke all on function public.save_player_avatar_frame(smallint) from public;
revoke all on function public.save_player_avatar_frame(smallint) from anon;
grant execute on function public.save_player_avatar_frame(smallint) to authenticated;
