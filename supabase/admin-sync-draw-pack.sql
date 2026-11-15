-- One-time migration: allow administrators to sync new card packs into the draw catalog.
-- After this function is installed, future packs/cards can be synced from the admin UI without SQL.
create or replace function public.admin_sync_draw_pack_catalog(
  p_pack_id text,
  p_pack_name text,
  p_cards jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以同步抽卡卡包';
  end if;
  if p_pack_id is null or btrim(p_pack_id) = ''
     or p_pack_name is null or btrim(p_pack_name) = '' then
    raise exception '卡包编号和名称不能为空';
  end if;
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) = 0 then
    raise exception '卡包至少需要一张卡牌才能同步';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_cards) as item(value)
    where coalesce(item.value->>'card_id','') = ''
       or coalesce(item.value->>'rarity','') !~ '^[1-5]$'
       or coalesce(item.value->>'is_alt','') not in ('true','false')
  ) then
    raise exception '卡牌编号、星级或异画标记格式不正确';
  end if;
  if (select count(*) from jsonb_array_elements(p_cards))
     <> (select count(distinct value->>'card_id') from jsonb_array_elements(p_cards)) then
    raise exception '卡牌列表中存在重复编号';
  end if;

  insert into public.draw_card_catalog(card_id,pack_id,rarity,is_alt,enabled)
  select item.value->>'card_id',p_pack_id,(item.value->>'rarity')::integer,
         (item.value->>'is_alt')::boolean,true
  from jsonb_array_elements(p_cards) as item(value)
  on conflict(card_id) do update
    set pack_id=excluded.pack_id,
        rarity=excluded.rarity,
        is_alt=excluded.is_alt,
        enabled=true;

  get diagnostics v_count = row_count;

  insert into public.card_draw_pools(pack_id,pack_name)
  values (p_pack_id,p_pack_name)
  on conflict(pack_id) do update
    set pack_name=excluded.pack_name;

  return v_count;
end;
$$;

revoke all on function public.admin_sync_draw_pack_catalog(text,text,jsonb) from public, anon;
grant execute on function public.admin_sync_draw_pack_catalog(text,text,jsonb) to authenticated;
