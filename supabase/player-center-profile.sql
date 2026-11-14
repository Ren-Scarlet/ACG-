-- ACG Player Center: public profile and title/badge selection.
-- Run once in Supabase SQL Editor after player-center.sql.

alter table public.profiles
  add column if not exists selected_title text,
  add column if not exists selected_badges text[] not null default '{}';

-- The public view exposes only deliberately public fields.
-- It does not expose email, admin status, token balance, inventory or token history.
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
  end as win_rate
from public.profiles p
left join public.player_stats s on s.user_id = p.id
left join public.achievements title on title.id = p.selected_title;

grant select on public.public_profiles to anon, authenticated;

-- Players may only select titles and badges they have permanently unlocked.
create or replace function public.save_profile_display(
  p_title_id text,
  p_badge_ids text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badges text[] := coalesce(p_badge_ids, '{}'::text[]);
  v_badge_count integer;
begin
  if auth.uid() is null then
    raise exception '请先登录';
  end if;

  if cardinality(v_badges) > 3 then
    raise exception '最多只能展示三个徽章';
  end if;

  select count(distinct badge_id)::integer
    into v_badge_count
  from unnest(v_badges) as supplied(badge_id);

  if v_badge_count <> cardinality(v_badges) then
    raise exception '不能重复选择同一个徽章';
  end if;

  if p_title_id is not null and not exists (
    select 1 from public.player_achievements
    where user_id = auth.uid() and achievement_id = p_title_id
  ) then
    raise exception '只能选择已经解锁的称号';
  end if;

  if exists (
    select 1
    from unnest(v_badges) as supplied(badge_id)
    where not exists (
      select 1 from public.player_achievements unlocked
      where unlocked.user_id = auth.uid()
        and unlocked.achievement_id = supplied.badge_id
    )
  ) then
    raise exception '只能展示已经解锁的徽章';
  end if;

  update public.profiles
  set selected_title = p_title_id,
      selected_badges = v_badges
  where id = auth.uid();

  if not found then
    raise exception '玩家资料不存在';
  end if;
end;
$$;

revoke all on function public.save_profile_display(text,text[]) from public, anon, authenticated;
grant execute on function public.save_profile_display(text,text[]) to authenticated;
