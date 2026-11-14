-- ACG card draw v2: 5 cards per pack, 10-pack draws, alternate art rates and card dismantling.
-- Run this migration once in Supabase SQL Editor after the existing card-draw.sql.
-- Existing player balances, inventory and draw history are preserved.

alter table public.draw_card_catalog
  add column if not exists is_alt boolean not null default false;

insert into public.draw_card_catalog(card_id,pack_id,rarity,is_alt) values
  ('card_001','pack_001',5,false),
  ('card_002','pack_001',3,false),
  ('card_003','pack_001',3,false),
  ('card_004','pack_001',3,false),
  ('card_005','pack_001',3,false),
  ('card_006','pack_001',3,false),
  ('card_007','pack_001',3,false),
  ('card_008','pack_001',3,false),
  ('card_009','pack_001',3,false),
  ('card_010','pack_001',3,false),
  ('card_011','pack_001',3,false),
  ('card_012','pack_001',3,false),
  ('card_013','pack_001',4,false),
  ('card_014','pack_001',4,false),
  ('card_015','pack_001',4,false),
  ('card_016','pack_001',4,false),
  ('card_017','pack_001',4,false),
  ('card_018','pack_001',4,false),
  ('card_019','pack_001',5,false),
  ('card_020','pack_001',5,false),
  ('card_021','pack_002',3,false),
  ('card_022','pack_002',3,true),
  ('card_023','pack_002',4,false),
  ('card_024','pack_002',4,true),
  ('card_025','pack_002',5,false),
  ('card_026','pack_002',5,true),
  ('card_027','pack_003',3,false),
  ('card_028','pack_003',3,false),
  ('card_029','pack_003',3,true),
  ('card_030','pack_003',4,false),
  ('card_031','pack_003',4,false),
  ('card_032','pack_003',4,false),
  ('card_033','pack_003',4,false),
  ('card_034','pack_003',5,false),
  ('card_035','pack_003',5,false),
  ('card_036','pack_003',5,true),
  ('card_037','pack_004',3,false),
  ('card_038','pack_004',3,false),
  ('card_039','pack_004',3,true),
  ('card_040','pack_004',4,false),
  ('card_041','pack_004',4,false),
  ('card_042','pack_004',4,false),
  ('card_043','pack_004',4,false),
  ('card_044','pack_004',4,false),
  ('card_045','pack_004',5,false),
  ('card_046','pack_004',5,false),
  ('card_047','pack_004',5,true)
on conflict(card_id) do update
  set pack_id=excluded.pack_id, rarity=excluded.rarity, is_alt=excluded.is_alt, enabled=true;

insert into public.card_draw_pools(pack_id,pack_name) values
  ('pack_003','固拉多'),
  ('pack_004','盖欧卡')
on conflict(pack_id) do update set pack_name=excluded.pack_name;

alter table public.card_draw_pools
  add column if not exists rate_alt numeric(5,2) not null default 0;

alter table public.card_draw_pools
  drop constraint if exists card_draw_pool_rates_check;

alter table public.card_draw_pools
  alter column rate_3 type numeric(5,2) using rate_3::numeric(5,2),
  alter column rate_4 type numeric(5,2) using rate_4::numeric(5,2),
  alter column rate_5 type numeric(5,2) using rate_5::numeric(5,2);

alter table public.card_draw_pools
  add constraint card_draw_pool_rates_v2_check check (
    (rate_3 is null and rate_4 is null and rate_5 is null and rate_alt = 0)
    or
    (rate_3 between 0 and 100 and rate_4 between 0 and 100
      and rate_5 between 0 and 100 and rate_alt between 0 and 100
      and round(rate_3 + rate_4 + rate_5 + rate_alt, 2) = 100)
  );

-- Pause existing pools until the administrator confirms the new four-part rates.
update public.card_draw_pools set enabled=false, updated_at=now();

alter table public.card_draw_history
  add column if not exists draw_index integer not null default 1;

alter table public.card_draw_history
  drop constraint if exists card_draw_history_request_unique;

create unique index if not exists card_draw_history_request_index_unique
  on public.card_draw_history(user_id, request_id, draw_index);

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
set search_path = ''
as $$
declare
  v_pack_name text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以设置卡池';
  end if;
  if p_price_tokens is null or p_price_tokens <= 0 then
    raise exception '每包价格必须大于 0';
  end if;
  if p_rate_alt is null or p_rate_5 is null or p_rate_4 is null or p_rate_3 is null
     or p_rate_alt < 0 or p_rate_5 < 0 or p_rate_4 < 0 or p_rate_3 < 0
     or p_rate_alt > 100 or p_rate_5 > 100 or p_rate_4 > 100 or p_rate_3 > 100
     or round(p_rate_alt + p_rate_5 + p_rate_4 + p_rate_3, 2) <> 100 then
    raise exception '异画、五星、四星、三星概率之和必须为 100%%（最多两位小数）';
  end if;

  select pack_name into v_pack_name
  from public.card_draw_pools where pack_id=p_pack_id;
  if v_pack_name is null then raise exception '卡包不存在'; end if;

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
$$;

create or replace function public.draw_packages(
  p_pack_id text,
  p_request_id uuid,
  p_pack_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
      'card_id',h.card_id,'draw_index',h.draw_index,'rarity',c.rarity,'is_alt',c.is_alt
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
  if not found or v_pool.price_tokens is null or v_pool.rate_alt is null
     or v_pool.rate_3 is null or v_pool.rate_4 is null or v_pool.rate_5 is null then
    raise exception '这个卡池尚未开放';
  end if;

  v_total_cost := v_pool.price_tokens * p_pack_count;
  if v_balance < v_total_cost then
    raise exception '代币不足，需要 %，当前余额 %',v_total_cost,v_balance;
  end if;

  for v_i in 1..(p_pack_count * 5) loop
    v_roll := random() * 100;
    v_is_alt := false;
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
      'card_id',v_card_id,'draw_index',v_i,'rarity',v_rarity,'is_alt',v_is_alt
    ));
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
$$;

create table if not exists public.card_dismantle_requests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  reward_tokens bigint not null,
  items jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,request_id)
);
alter table public.card_dismantle_requests enable row level security;
revoke all on public.card_dismantle_requests from anon,authenticated;

create or replace function public.dismantle_cards(
  p_items jsonb,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance bigint;
  v_old_reward bigint;
  v_old_items jsonb;
  v_item record;
  v_current integer;
  v_reward bigint := 0;
  v_unit_reward integer;
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  if p_request_id is null then raise exception '分解请求编号缺失，请重试'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception '请先选择要分解的卡牌';
  end if;

  select tokens into v_balance from public.player_stats
  where user_id=v_user_id for update;
  if not found then raise exception '玩家资料尚未初始化'; end if;

  select reward_tokens,items into v_old_reward,v_old_items from public.card_dismantle_requests
  where user_id=v_user_id and request_id=p_request_id;
  if found then
    if v_old_items <> p_items then
      raise exception '该分解请求编号已用于另一份卡牌清单，请刷新后重试';
    end if;
    return jsonb_build_object('reward_tokens',v_old_reward,'remaining_tokens',v_balance,'duplicate_request',true);
  end if;

  if exists(
    select 1 from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    where x.card_id is null or length(trim(x.card_id))=0 or x.quantity is null or x.quantity<1
  ) then raise exception '分解数量无效'; end if;

  if exists(
    select 1 from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    group by x.card_id having count(*)>1
  ) then raise exception '分解清单包含重复卡牌，请刷新后重试'; end if;

  for v_item in
    select x.card_id,x.quantity,c.rarity,c.is_alt
    from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    join public.draw_card_catalog c on c.card_id=x.card_id and c.enabled=true
    order by x.card_id
  loop
    select quantity into v_current from public.card_inventory
    where user_id=v_user_id and card_id=v_item.card_id for update;
    if not found or v_current < v_item.quantity then
      raise exception '卡牌库存不足：%',v_item.card_id;
    end if;
    v_unit_reward := case when v_item.is_alt then 30
      when v_item.rarity=5 then 20
      when v_item.rarity=4 then 15 else 10 end;
    v_reward := v_reward + v_unit_reward * v_item.quantity;
  end loop;

  if (select count(*) from jsonb_to_recordset(p_items) as x(card_id text,quantity integer))
     <> (select count(*) from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
         join public.draw_card_catalog c on c.card_id=x.card_id and c.enabled=true) then
    raise exception '分解清单中包含无效卡牌';
  end if;

  for v_item in
    select x.card_id,x.quantity
    from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    order by x.card_id
  loop
    select quantity into v_current from public.card_inventory
    where user_id=v_user_id and card_id=v_item.card_id for update;
    if v_current > v_item.quantity then
      update public.card_inventory set quantity=quantity-v_item.quantity,updated_at=now()
      where user_id=v_user_id and card_id=v_item.card_id;
    else
      delete from public.card_inventory where user_id=v_user_id and card_id=v_item.card_id;
    end if;
  end loop;

  update public.player_stats set tokens=tokens+v_reward,updated_at=now()
  where user_id=v_user_id returning tokens into v_balance;

  insert into public.token_transactions(user_id,amount,reason)
  values(v_user_id,v_reward,'分解卡牌');

  insert into public.card_dismantle_requests(user_id,request_id,reward_tokens,items)
  values(v_user_id,p_request_id,v_reward,p_items);

  return jsonb_build_object('reward_tokens',v_reward,'remaining_tokens',v_balance,'duplicate_request',false);
end;
$$;

revoke all on function public.admin_set_draw_pool_v2(text,bigint,numeric,numeric,numeric,numeric) from public,anon,authenticated;
revoke all on function public.draw_packages(text,uuid,integer) from public,anon,authenticated;
revoke all on function public.dismantle_cards(jsonb,uuid) from public,anon,authenticated;
revoke all on function public.draw_one_card(text,uuid) from public,anon,authenticated;
revoke all on function public.admin_set_draw_pool(text,bigint,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.admin_set_draw_pool_v2(text,bigint,numeric,numeric,numeric,numeric) to authenticated;
grant execute on function public.draw_packages(text,uuid,integer) to authenticated;
grant execute on function public.dismantle_cards(jsonb,uuid) to authenticated;
