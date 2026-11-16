-- ACG Player Avatar v1
-- Run once in Supabase SQL Editor after player-center-profile.sql and player-public-id-v1.sql.

alter table public.profiles
  add column if not exists avatar_url text;

-- Public avatar images are intentionally readable by everyone; writes remain owner-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-avatars', 'player-avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Player avatars are publicly readable" on storage.objects;
create policy "Player avatars are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'player-avatars');

drop policy if exists "Players upload their own avatar" on storage.objects;
create policy "Players upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'player-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Players update their own avatar" on storage.objects;
create policy "Players update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'player-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'player-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep the existing public profile fields and add only the avatar URL.
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
  p.avatar_url
from public.profiles p
left join public.player_stats s on s.user_id = p.id
left join public.achievements title on title.id = p.selected_title
left join public.player_registry r on r.player_number = p.player_number;

grant select on public.public_profiles to anon, authenticated;
