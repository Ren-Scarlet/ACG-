-- Custom card-pack cover selection
-- Run once in Supabase SQL Editor.
alter table public.card_draw_pools
  add column if not exists cover_card_id text;

create or replace function public.admin_set_draw_pool_cover(
  p_pack_id text,
  p_cover_card_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以设置卡包封面';
  end if;

  if not exists (
    select 1 from public.card_draw_pools
    where pack_id = p_pack_id
  ) then
    raise exception '卡包不存在';
  end if;

  if p_cover_card_id is not null and not exists (
    select 1 from public.draw_card_catalog
    where card_id = p_cover_card_id
      and pack_id = p_pack_id
  ) then
    raise exception '封面卡必须属于当前卡包';
  end if;

  update public.card_draw_pools
  set cover_card_id = p_cover_card_id,
      updated_at = now()
  where pack_id = p_pack_id;
end;
$$;

revoke all on function public.admin_set_draw_pool_cover(text,text) from public;
grant execute on function public.admin_set_draw_pool_cover(text,text) to authenticated;
