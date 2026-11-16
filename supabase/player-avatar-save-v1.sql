-- ACG Player Avatar Save RPC v1
-- Run once after player-avatar-v1.sql.
-- The client may upload only to its own storage folder; this RPC records only that user's avatar URL.

create or replace function public.save_player_avatar(p_avatar_url text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_expected_path text;
begin
  if v_user_id is null then
    raise exception '请先登录后再更换头像。';
  end if;

  if p_avatar_url is null or length(p_avatar_url) > 2048 then
    raise exception '头像地址无效。';
  end if;

  v_expected_path := '/storage/v1/object/public/player-avatars/' || v_user_id::text || '/avatar.webp';

  if position(v_expected_path in p_avatar_url) = 0 then
    raise exception '头像地址不属于当前账号。';
  end if;

  update public.profiles
     set avatar_url = p_avatar_url
   where id = v_user_id;

  if not found then
    raise exception '没有找到当前玩家资料，头像未保存。';
  end if;

  return p_avatar_url;
end;
$$;

revoke all on function public.save_player_avatar(text) from public;
revoke all on function public.save_player_avatar(text) from anon;
grant execute on function public.save_player_avatar(text) to authenticated;
