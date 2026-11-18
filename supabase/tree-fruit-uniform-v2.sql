-- ACG tree fruit uniform draw migration
-- Tree fruits are stored as rarity=1 for schema compatibility, but are drawn uniformly.
-- Normal and battle-item packs keep the existing rarity/alt probability model.
-- Apply once in Supabase SQL Editor.

alter table public.card_draw_pools
  add column if not exists draw_mode text not null default 'rarity';

alter table public.card_draw_pools
  drop constraint if exists card_draw_pools_draw_mode_check;
alter table public.card_draw_pools
  add constraint card_draw_pools_draw_mode_check
  check (draw_mode in ('rarity','uniform','battle_item'));

alter table public.draw_card_catalog add column if not exists item_class text not null default 'normal';

-- Replace the old 3-argument RPC. The frontend will send p_category explicitly.
drop function if exists public.admin_sync_draw_pack_catalog(text,text,jsonb);

create or replace function public.admin_sync_draw_pack_catalog(
  p_pack_id text,
  p_pack_name text,
  p_cards jsonb,
  p_category text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count integer;
  v_mode text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以同步抽卡卡包';
  end if;
  if p_pack_id is null or btrim(p_pack_id) = ''
     or p_pack_name is null or btrim(p_pack_name) = '' then
    raise exception '卡包编号和名称不能为空';
  end if;
  if p_category not in ('normal','battle_item','berry') then
    raise exception '不支持的卡包分类';
  end if;
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) = 0 then
    raise exception '卡包至少需要一张卡牌才能同步';
  end if;

  v_mode := case when p_category='berry' then 'uniform' when p_category='battle_item' then 'battle_item' else 'rarity' end;

  if exists (
    select 1 from jsonb_array_elements(p_cards) as item(value)
    where coalesce(item.value->>'card_id','') = ''
       or coalesce(item.value->>'rarity','') !~ '^[1-5]$'
       or coalesce(item.value->>'is_alt','') not in ('true','false')
       or (p_category='battle_item' and coalesce(item.value->>'item_class','') not in ('normal','important'))
  ) then
    raise exception '卡牌编号、分类或星级资料格式不正确';
  end if;
  if (select count(*) from jsonb_array_elements(p_cards))
     <> (select count(distinct value->>'card_id') from jsonb_array_elements(p_cards)) then
    raise exception '卡牌列表中存在重复编号';
  end if;

  insert into public.draw_card_catalog(card_id,pack_id,rarity,is_alt,enabled,item_class)
  select item.value->>'card_id',p_pack_id,
         case when p_category in ('berry','battle_item') then 1 else (item.value->>'rarity')::integer end,
         case when p_category in ('berry','battle_item') then false else (item.value->>'is_alt')::boolean end,
         true,case when p_category='battle_item' then item.value->>'item_class' else 'normal' end
  from jsonb_array_elements(p_cards) as item(value)
  on conflict(card_id) do update
    set pack_id=excluded.pack_id,
        rarity=excluded.rarity,
        is_alt=excluded.is_alt,
        enabled=true;

  get diagnostics v_count = row_count;

  insert into public.card_draw_pools(pack_id,pack_name,draw_mode)
  values (p_pack_id,p_pack_name,v_mode)
  on conflict(pack_id) do update
    set pack_name=excluded.pack_name,
        draw_mode=excluded.draw_mode;

  return v_count;
end;
$function$;

revoke all on function public.admin_sync_draw_pack_catalog(text,text,jsonb,text) from public, anon;
grant execute on function public.admin_sync_draw_pack_catalog(text,text,jsonb,text) to authenticated;

create or replace function public.admin_set_draw_pool_v2(
  p_pack_id text,
  p_price_tokens bigint,
  p_rate_alt numeric,
  p_rate_5 numeric,
  p_rate_4 numeric,
  p_rate_3 numeric
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_pack_name text;
  v_draw_mode text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以设置卡池';
  end if;
  if p_price_tokens is null or p_price_tokens <= 0 then
    raise exception '每包价格必须大于 0';
  end if;

  select pack_name,draw_mode into v_pack_name,v_draw_mode
  from public.card_draw_pools where pack_id=p_pack_id;
  if v_pack_name is null then raise exception '卡包不存在'; end if;

  if v_draw_mode in ('uniform','battle_item') then
    update public.card_draw_pools
    set price_tokens=p_price_tokens, rate_alt=0, rate_5=0, rate_4=0, rate_3=100,
        enabled=true, updated_at=now()
    where pack_id=p_pack_id;
    return;
  end if;

  if p_rate_alt is null or p_rate_5 is null or p_rate_4 is null or p_rate_3 is null
     or p_rate_alt < 0 or p_rate_5 < 0 or p_rate_4 < 0 or p_rate_3 < 0
     or p_rate_alt > 100 or p_rate_5 > 100 or p_rate_4 > 100 or p_rate_3 > 100
     or round(p_rate_alt + p_rate_5 + p_rate_4 + p_rate_3, 2) <> 100 then
    raise exception '异画、五星、四星、三星概率之和必须等于百分之百（最多两位小数）';
  end if;

  if (p_rate_alt > 0 and not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and is_alt and enabled))
     or (p_rate_5 > 0 and not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and rarity=5 and not is_alt and enabled))
     or (p_rate_4 > 0 and not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and rarity=4 and not is_alt and enabled))
     or (p_rate_3 > 0 and not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and rarity=3 and not is_alt and enabled)) then
    raise exception '当前卡包缺少对应稀有度的可抽取卡牌，请先检查卡包资料';
  end if;

  update public.card_draw_pools
  set price_tokens=p_price_tokens, rate_alt=p_rate_alt, rate_5=p_rate_5,
      rate_4=p_rate_4, rate_3=p_rate_3, enabled=true, updated_at=now()
  where pack_id=p_pack_id;
end;
$function$;

create or replace function public.draw_packages(
  p_pack_id text,
  p_request_id uuid,
  p_pack_count integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pool public.card_draw_pools%rowtype;
  v_balance bigint;
  v_total_cost bigint;
  v_existing_count integer;
  v_cards jsonb;
  v_roll numeric;
  v_rarity integer;
  v_is_alt boolean;
  v_card_id text;
  v_i integer;
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  if p_request_id is null then raise exception '抽卡请求编号缺失，请重新点击'; end if;
  if p_pack_count is null or p_pack_count not in (1,10) then raise exception '一次只能购买 1 包或 10 包'; end if;

  select tokens into v_balance
  from public.player_stats where user_id=v_user_id for update;
  if not found then raise exception '玩家资料尚未初始化，请重新登录'; end if;

  select count(*) into v_existing_count
  from public.card_draw_history
  where user_id=v_user_id and request_id=p_request_id;

  if v_existing_count > 0 then
    if v_existing_count <> p_pack_count * 5
       or exists(select 1 from public.card_draw_history
                 where user_id=v_user_id and request_id=p_request_id and pack_id<>p_pack_id) then
      raise exception '抽卡请求编号已被其他抽卡操作使用，请刷新后重试';
    end if;
    select jsonb_agg(jsonb_build_object(
      'card_id',h.card_id,'draw_index',h.draw_index,'rarity',c.rarity,'is_alt',c.is_alt,'item_class',c.item_class
    ) order by h.draw_index) into v_cards
    from public.card_draw_history h
    join public.draw_card_catalog c on c.card_id=h.card_id
    where h.user_id=v_user_id and h.request_id=p_request_id;
    return jsonb_build_object('cards',coalesce(v_cards,'[]'::jsonb),
      'remaining_tokens',v_balance,'duplicate_request',true,
      'packages',p_pack_count,'charged_tokens',0);
  end if;

  select * into v_pool from public.card_draw_pools
  where pack_id=p_pack_id and enabled=true;
  if not found or v_pool.price_tokens is null then
    raise exception '这个卡池尚未开放';
  end if;
  if v_pool.draw_mode not in ('uniform','battle_item') and
     (v_pool.rate_alt is null or v_pool.rate_3 is null or v_pool.rate_4 is null or v_pool.rate_5 is null) then
    raise exception '这个卡池尚未开放';
  end if;

  if v_pool.draw_mode in ('uniform','battle_item') and not exists(
    select 1 from public.draw_card_catalog where pack_id=p_pack_id and enabled
  ) then
    raise exception '该特殊卡包没有可抽取的卡牌';
  end if;
  if v_pool.draw_mode='battle_item' and (
    not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and enabled and item_class='normal') or
    not exists(select 1 from public.draw_card_catalog where pack_id=p_pack_id and enabled and item_class='important')
  ) then raise exception '对战道具卡包必须同时包含普通道具和贵重道具'; end if;

  v_total_cost := v_pool.price_tokens * p_pack_count;
  if v_balance < v_total_cost then
    raise exception '代币不足，需要 %，当前余额 %',v_total_cost,v_balance;
  end if;

  for v_i in 1..(p_pack_count * 5) loop
    v_is_alt := false;
    v_rarity := 1;

    if v_pool.draw_mode='uniform' then
      select c.card_id into v_card_id
      from public.draw_card_catalog c
      where c.pack_id=p_pack_id and c.enabled=true
      order by random() limit 1;
    elsif v_pool.draw_mode='battle_item' then
      if random()<0.75 then
        select c.card_id into v_card_id from public.draw_card_catalog c
        where c.pack_id=p_pack_id and c.enabled=true and c.item_class='normal'
        order by random() limit 1;
      else
        select c.card_id into v_card_id from public.draw_card_catalog c
        where c.pack_id=p_pack_id and c.enabled=true and c.item_class='important'
        order by random() limit 1;
      end if;
    else
      v_roll := random() * 100;
      v_rarity := null;
      if v_roll < v_pool.rate_alt then
        v_is_alt := true;
      elsif v_roll < v_pool.rate_alt + v_pool.rate_5 then
        v_rarity := 5;
      elsif v_roll < v_pool.rate_alt + v_pool.rate_5 + v_pool.rate_4 then
        v_rarity := 4;
      else
        v_rarity := 3;
      end if;

      select c.card_id into v_card_id
      from public.draw_card_catalog c
      where c.pack_id=p_pack_id and c.enabled=true
        and ((v_is_alt and c.is_alt) or (not v_is_alt and not c.is_alt and c.rarity=v_rarity))
      order by random() limit 1;
    end if;

    if v_card_id is null then
      raise exception '卡池配置错误：抽取类别没有可用卡牌';
    end if;

    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user_id,v_card_id,1,now())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+1,updated_at=now();

    insert into public.card_draw_history(user_id,pack_id,card_id,cost_tokens,request_id,draw_index)
    values(v_user_id,p_pack_id,v_card_id,v_pool.price_tokens,p_request_id,v_i);

    if v_cards is null then v_cards := '[]'::jsonb; end if;
    v_cards := v_cards || jsonb_build_array(jsonb_build_object(
      'card_id',v_card_id,'draw_index',v_i,'rarity',v_rarity,'is_alt',v_is_alt,'item_class',(select item_class from public.draw_card_catalog where card_id=v_card_id)
    ));
    v_card_id := null;
  end loop;

  update public.player_stats
  set tokens=tokens-v_total_cost,updated_at=now()
  where user_id=v_user_id returning tokens into v_balance;

  insert into public.token_transactions(user_id,amount,reason)
  values(v_user_id,-v_total_cost,
    '抽卡：'||v_pool.pack_name||' × '||p_pack_count||'包');

  perform public.refresh_player_achievements(v_user_id);

  return jsonb_build_object('cards',v_cards,'remaining_tokens',v_balance,
    'duplicate_request',false,'packages',p_pack_count,'charged_tokens',v_total_cost);
end;
$function$;

revoke all on function public.draw_packages(text,uuid,integer) from public, anon;
grant execute on function public.draw_packages(text,uuid,integer) to authenticated;
