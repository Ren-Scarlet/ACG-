-- Safe admin control for pausing a live draw pool.
-- Run once in Supabase SQL Editor after card-draw.sql.

create or replace function public.admin_disable_draw_pool(p_pack_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以暂停卡池';
  end if;
  if p_pack_id is null or length(trim(p_pack_id)) = 0 then
    raise exception '卡包编号不能为空';
  end if;
  update public.card_draw_pools
  set enabled = false, updated_at = now()
  where pack_id = p_pack_id;
  if not found then
    raise exception '卡包不存在';
  end if;
end;
$$;

revoke all on function public.admin_disable_draw_pool(text) from public, anon, authenticated;
grant execute on function public.admin_disable_draw_pool(text) to authenticated;
