-- ACG Fishing Shop v2: configurable cross-system rewards.
-- Apply after fishing-system-v1.sql, fishing-server-authoritative-v1.sql,
-- fishing-achievements-shop-v1.sql, and item-workshop-mail-v1.sql.
-- Safe to re-run. Existing bait products are preserved and reclassified.

alter table public.fishing_shop_catalog
  drop constraint if exists fishing_shop_catalog_reward_type_check;

update public.fishing_shop_catalog
set reward_type='bait'
where reward_type='item'
  and reward_config ? 'bait_id';

alter table public.fishing_shop_catalog
  add constraint fishing_shop_catalog_reward_type_check
  check (reward_type in ('bait','tokens','card','item','title','cosmetic'));

create or replace function public.fishing_admin_list_shop()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以管理钓场商店';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by p.sort_order,p.product_id)
    from public.fishing_shop_catalog p
  ),'[]'::jsonb);
end;
$$;

create or replace function public.fishing_admin_save_shop_product(
  p_product_id text,
  p_product_name text,
  p_description text,
  p_icon text,
  p_price_points bigint,
  p_reward_type text,
  p_reward_config jsonb,
  p_stock_limit integer default null,
  p_per_player_limit integer default null,
  p_is_active boolean default true,
  p_sort_order integer default 0
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config jsonb := coalesce(p_reward_config,'{}'::jsonb);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以管理钓场商店';
  end if;
  if nullif(btrim(p_product_id),'') is null or length(p_product_id)>80 then
    raise exception '商品编号无效';
  end if;
  if nullif(btrim(p_product_name),'') is null or length(p_product_name)>80 then
    raise exception '商品名称不能为空，且最多 80 个字符';
  end if;
  if p_price_points is null or p_price_points<=0 then
    raise exception '兑换价格必须大于 0';
  end if;
  if p_stock_limit is not null and p_stock_limit<0 then
    raise exception '库存不能小于 0';
  end if;
  if p_per_player_limit is not null and p_per_player_limit<1 then
    raise exception '每人限购数量至少为 1';
  end if;
  if jsonb_typeof(v_config)<>'object' then
    raise exception '奖励配置格式错误';
  end if;

  if p_reward_type='bait' then
    if not exists(select 1 from public.fishing_bait_catalog
      where bait_id=v_config->>'bait_id' and is_active=true)
      or coalesce((v_config->>'quantity')::integer,0) not between 1 and 20 then
      raise exception '鱼饵奖励配置无效';
    end if;
  elsif p_reward_type='tokens' then
    if coalesce((v_config->>'amount')::bigint,0)<=0 then
      raise exception '代币奖励数量必须大于 0';
    end if;
  elsif p_reward_type='card' then
    if nullif(v_config->>'card_id','') is null
       or coalesce((v_config->>'amount')::bigint,0) not between 1 and 2147483647
       or not exists(select 1 from public.draw_card_catalog
         where card_id=v_config->>'card_id') then
      raise exception '卡牌奖励配置无效：请使用已同步到卡牌目录的卡牌';
    end if;
  elsif p_reward_type='item' then
    if nullif(v_config->>'item_id','') is null
       or coalesce((v_config->>'amount')::bigint,0) not between 1 and 2147483647
       or not exists(select 1 from public.item_catalog
         where item_id=v_config->>'item_id' and is_active=true) then
      raise exception '道具奖励配置无效：请使用已启用的道具';
    end if;
  else
    raise exception '暂不支持该奖励类型';
  end if;

  insert into public.fishing_shop_catalog(
    product_id,product_name,description,icon,price_points,reward_type,
    reward_config,stock_limit,stock_sold,per_player_limit,is_active,sort_order
  ) values (
    btrim(p_product_id),btrim(p_product_name),coalesce(p_description,''),
    coalesce(nullif(btrim(p_icon),''),'🎁'),p_price_points,p_reward_type,
    v_config,p_stock_limit,0,p_per_player_limit,coalesce(p_is_active,true),
    coalesce(p_sort_order,0)
  )
  on conflict(product_id) do update set
    product_name=excluded.product_name,
    description=excluded.description,
    icon=excluded.icon,
    price_points=excluded.price_points,
    reward_type=excluded.reward_type,
    reward_config=excluded.reward_config,
    stock_limit=excluded.stock_limit,
    per_player_limit=excluded.per_player_limit,
    is_active=excluded.is_active,
    sort_order=excluded.sort_order;

  return btrim(p_product_id);
end;
$$;

create or replace function public.fishing_redeem_shop(
  p_product_id text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid:=auth.uid();
  v_existing public.fishing_shop_redemptions%rowtype;
  v_product public.fishing_shop_catalog%rowtype;
  v_points bigint;
  v_tokens bigint;
  v_reward_id text;
  v_amount integer;
  v_bait_balance integer;
  v_owned_count integer;
  v_result jsonb;
begin
  if v_user is null then raise exception '请先登录'; end if;
  if nullif(btrim(p_product_id),'') is null or p_request_id is null then
    raise exception '兑换请求资料不完整';
  end if;

  select points into v_points
  from public.player_fishing_stats where user_id=v_user for update;
  if not found then raise exception '钓鱼资料尚未初始化'; end if;

  select * into v_existing from public.fishing_shop_redemptions
  where user_id=v_user and request_id=p_request_id;
  if found then
    if v_existing.product_id<>p_product_id then
      raise exception '该请求编号已用于其他兑换';
    end if;
    return jsonb_build_object('success',true,'duplicate_request',true,
      'product_id',v_existing.product_id,'price_points',v_existing.price_points,
      'reward_config',v_existing.reward_config);
  end if;

  select * into v_product from public.fishing_shop_catalog
  where product_id=p_product_id and is_active=true for update;
  if not found then raise exception '该商品暂不可兑换'; end if;
  if v_product.stock_limit is not null and v_product.stock_sold>=v_product.stock_limit then
    raise exception '该商品已售罄';
  end if;
  if v_product.per_player_limit is not null then
    select count(*) into v_owned_count from public.fishing_shop_redemptions
    where user_id=v_user and product_id=p_product_id;
    if v_owned_count>=v_product.per_player_limit then
      raise exception '已达到该商品的个人兑换上限';
    end if;
  end if;
  if v_points<v_product.price_points then raise exception '钓鱼积分不足'; end if;

  v_result:=jsonb_build_object('reward_type',v_product.reward_type,
    'reward_config',v_product.reward_config);

  if v_product.reward_type='bait' then
    v_reward_id:=v_product.reward_config->>'bait_id';
    v_amount:=(v_product.reward_config->>'quantity')::integer;
    if v_amount not between 1 and 20 or not exists(
      select 1 from public.fishing_bait_catalog
      where bait_id=v_reward_id and is_active=true
    ) then raise exception '鱼饵奖励配置无效'; end if;

    insert into public.player_fishing_bait(user_id,bait_id,quantity,updated_at)
    values(v_user,v_reward_id,v_amount,clock_timestamp())
    on conflict(user_id,bait_id) do update
      set quantity=public.player_fishing_bait.quantity+excluded.quantity,
          updated_at=clock_timestamp()
    returning quantity into v_bait_balance;
    v_result:=v_result||jsonb_build_object('granted_bait_id',v_reward_id,
      'granted_amount',v_amount,'bait_balance',v_bait_balance);

  elsif v_product.reward_type='tokens' then
    v_amount:=(v_product.reward_config->>'amount')::integer;
    if v_amount<1 then raise exception '代币奖励配置无效'; end if;
    update public.player_stats set tokens=tokens+v_amount,updated_at=clock_timestamp()
    where user_id=v_user returning tokens into v_tokens;
    if not found then raise exception '玩家账户尚未初始化'; end if;
    insert into public.token_transactions(user_id,amount,reason)
    values(v_user,v_amount,'钓鱼商店兑换：'||v_product.product_name);
    v_result:=v_result||jsonb_build_object('granted_tokens',v_amount,
      'token_balance',v_tokens);

  elsif v_product.reward_type='card' then
    v_reward_id:=v_product.reward_config->>'card_id';
    v_amount:=(v_product.reward_config->>'amount')::integer;
    if v_amount<1 or not exists(select 1 from public.draw_card_catalog
      where card_id=v_reward_id) then raise exception '卡牌奖励配置无效'; end if;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user,v_reward_id,v_amount,clock_timestamp())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+excluded.quantity,
          updated_at=clock_timestamp();
    v_result:=v_result||jsonb_build_object('granted_card_id',v_reward_id,
      'granted_amount',v_amount);

  elsif v_product.reward_type='item' then
    v_reward_id:=v_product.reward_config->>'item_id';
    v_amount:=(v_product.reward_config->>'amount')::integer;
    if v_amount<1 or not exists(select 1 from public.item_catalog
      where item_id=v_reward_id and is_active=true) then
      raise exception '道具奖励配置无效';
    end if;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user,v_reward_id,v_amount,clock_timestamp())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+excluded.quantity,
          updated_at=clock_timestamp();
    v_result:=v_result||jsonb_build_object('granted_item_id',v_reward_id,
      'granted_amount',v_amount);
  else
    raise exception '该商品奖励类型暂不支持';
  end if;

  update public.player_fishing_stats
  set points=points-v_product.price_points,updated_at=clock_timestamp()
  where user_id=v_user;
  insert into public.fishing_points_ledger(user_id,amount,reason)
  values(v_user,-v_product.price_points,'钓场商店兑换：'||v_product.product_name);

  update public.fishing_shop_catalog set stock_sold=stock_sold+1
  where product_id=p_product_id;

  insert into public.fishing_shop_redemptions(user_id,product_id,request_id,
    price_points,reward_config)
  values(v_user,p_product_id,p_request_id,v_product.price_points,v_result);

  return jsonb_build_object('success',true,'duplicate_request',false,
    'product_id',p_product_id,'product_name',v_product.product_name,
    'spent_points',v_product.price_points,'remaining_points',v_points-v_product.price_points,
    'reward',v_result);
end;
$$;

create or replace function public.fishing_get_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_stats jsonb;
  v_baits jsonb;
  v_fishbook jsonb;
  v_achievements jsonb;
  v_shop jsonb;
begin
  if v_user_id is null then raise exception '请先登录'; end if;

  select to_jsonb(s) into v_stats from public.player_fishing_stats s
  where s.user_id=v_user_id;
  if v_stats is null then
    insert into public.player_fishing_stats(user_id) values(v_user_id)
    on conflict do nothing;
    select to_jsonb(s) into v_stats from public.player_fishing_stats s
    where s.user_id=v_user_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'bait_id',b.bait_id,'bait_name',c.bait_name,'icon',c.icon,'quantity',b.quantity
  ) order by c.sort_order),'[]'::jsonb)
  into v_baits
  from public.player_fishing_bait b
  join public.fishing_bait_catalog c using(bait_id)
  where b.user_id=v_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'fish_id',f.fish_id,'fish_name',c.fish_name,'catch_count',f.catch_count,
    'best_size_cm',f.best_size_cm,'best_points',f.best_points,'first_caught_at',f.first_caught_at
  ) order by c.sort_order),'[]'::jsonb)
  into v_fishbook
  from public.player_fishbook f
  join public.fishing_fish_catalog c using(fish_id)
  where f.user_id=v_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'achievement_id',a.achievement_id,'name',a.name,'description',a.description,
    'condition_type',a.condition_type,'threshold',a.threshold,'reward_points',a.reward_points,
    'unlocked',p.achievement_id is not null,'unlocked_at',p.unlocked_at
  ) order by a.sort_order),'[]'::jsonb)
  into v_achievements
  from public.fishing_achievements a
  left join public.player_fishing_achievements p
    on p.achievement_id=a.achievement_id and p.user_id=v_user_id
  where a.is_active=true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id',product_id,'product_name',product_name,'description',description,
    'icon',icon,'price_points',price_points,'reward_type',reward_type,
    'reward_config',reward_config,'stock_limit',stock_limit,'stock_sold',stock_sold,
    'per_player_limit',per_player_limit
  ) order by sort_order),'[]'::jsonb)
  into v_shop from public.fishing_shop_catalog
  where is_active=true;

  return jsonb_build_object('stats',v_stats,'baits',v_baits,'fishbook',v_fishbook,
    'achievements',v_achievements,'shop',v_shop,'is_admin',public.is_admin());
end;
$$;

revoke all on function public.fishing_admin_list_shop() from public,anon,authenticated;
grant execute on function public.fishing_admin_list_shop() to authenticated;
revoke all on function public.fishing_admin_save_shop_product(text,text,text,text,bigint,text,jsonb,integer,integer,boolean,integer) from public,anon,authenticated;
grant execute on function public.fishing_admin_save_shop_product(text,text,text,text,bigint,text,jsonb,integer,integer,boolean,integer) to authenticated;
revoke all on function public.fishing_redeem_shop(text,uuid) from public,anon,authenticated;
grant execute on function public.fishing_redeem_shop(text,uuid) to authenticated;
revoke all on function public.fishing_get_dashboard() from public,anon,authenticated;
grant execute on function public.fishing_get_dashboard() to authenticated;
