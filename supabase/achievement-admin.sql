-- ACG Player Center: admin management for achievement token rewards.
-- Run this migration once in Supabase SQL Editor after achievement-rewards.sql.

create or replace function public.admin_set_achievement_reward(
  p_achievement_id text,
  p_reward_tokens bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以修改成就奖励';
  end if;

  if p_achievement_id is null or length(trim(p_achievement_id)) = 0 then
    raise exception '成就 ID 不能为空';
  end if;

  if p_reward_tokens is null or p_reward_tokens < 0 then
    raise exception '奖励代币必须为 0 或正整数';
  end if;

  update public.achievements
  set reward_tokens = p_reward_tokens
  where id = p_achievement_id;

  if not found then
    raise exception '找不到指定成就';
  end if;
end;
$$;

revoke all on function public.admin_set_achievement_reward(text,bigint) from public, anon, authenticated;
grant execute on function public.admin_set_achievement_reward(text,bigint) to authenticated;
