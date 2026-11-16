-- ACG Fishing System v1.1: achievement rewards and bait exchange shop
-- Apply AFTER fishing-system-v1.sql and fishing-server-authoritative-v1.sql.
-- Safe to re-run: catalogue rows are upserted and trigger/function definitions replaced.

-- 1) Achievement rewards are paid in fishing points, never site tokens.
create or replace function public.award_fishing_achievement_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward integer;
  v_name text;
begin
  select reward_points,name into v_reward,v_name
  from public.fishing_achievements
  where achievement_id=new.achievement_id and is_active=true;

  if coalesce(v_reward,0)>0 then
    insert into public.player_fishing_stats(user_id,points,updated_at)
    values(new.user_id,v_reward,clock_timestamp())
    on conflict(user_id) do update
      set points=public.player_fishing_stats.points+excluded.points,
          updated_at=clock_timestamp();

    insert into public.fishing_points_ledger(user_id,amount,reason)
    values(new.user_id,v_reward,'钓鱼成就奖励：'||coalesce(v_name,new.achievement_id));
  end if;
  return new;
end;
$$;

drop trigger if exists player_fishing_achievement_points on public.player_fishing_achievements;
create trigger player_fishing_achievement_points
after insert on public.player_fishing_achievements
for each row execute function public.award_fishing_achievement_points();

revoke all on function public.award_fishing_achievement_points() from public,anon,authenticated;

-- 2) Initial achievement set. Progress is lifetime progress; rewards are one-time.
insert into public.fishing_achievements
  (achievement_id,name,description,condition_type,threshold,reward_points,sort_order,is_active)
values
  ('first_catch','初次相遇','成功钓起第一条鱼。','catches',1,25,1,true),
  ('catch_10','渐入佳境','累计成功钓获 10 条鱼。','catches',10,75,2,true),
  ('catch_50','湖畔熟客','累计成功钓获 50 条鱼。','catches',50,200,3,true),
  ('catch_100','资深钓手','累计成功钓获 100 条鱼。','catches',100,400,4,true),
  ('points_500','小有收获','当前持有 500 点钓鱼积分。','points',500,50,5,true),
  ('points_2000','满载而归','当前持有 2,000 点钓鱼积分。','points',2000,100,6,true),
  ('points_10000','湖畔富翁','当前持有 10,000 点钓鱼积分。','points',10000,300,7,true),
  ('fish_3','初识鱼群','在鱼类图鉴中发现 3 种不同的鱼。','distinct_fish',3,75,8,true),
  ('fish_6','博学钓客','在鱼类图鉴中发现 6 种不同的鱼。','distinct_fish',6,180,9,true),
  ('fish_10','青岚湖博士','在鱼类图鉴中发现全部 10 种鱼。','distinct_fish',10,400,10,true),
  ('first_large','巨物现身','成功钓起一条大型尺寸的鱼。','large_fish',1,150,11,true)
on conflict(achievement_id) do update set
  name=excluded.name,description=excluded.description,
  condition_type=excluded.condition_type,threshold=excluded.threshold,
  reward_points=excluded.reward_points,sort_order=excluded.sort_order,is_active=true;

-- Backfill unlocks for players who already met a condition before this migration.
-- The insert trigger grants the one-time point reward in the same transaction.
insert into public.player_fishing_achievements(user_id,achievement_id)
select s.user_id,a.achievement_id
from public.player_fishing_stats s
cross join public.fishing_achievements a
where a.is_active and (
  (a.condition_type='catches' and s.total_catches>=a.threshold)
  or (a.condition_type='points' and s.points>=a.threshold)
  or (a.condition_type='distinct_fish' and s.distinct_fish>=a.threshold)
  or (a.condition_type='large_fish' and a.threshold<=1 and exists(
    select 1 from public.fishing_catches c
    where c.user_id=s.user_id and c.size_tier='large'
  ))
  or (a.condition_type='specific_fish' and exists(
    select 1 from public.fishing_catches c
    where c.user_id=s.user_id and c.fish_id=a.fish_id
  ))
)
on conflict(user_id,achievement_id) do nothing;

-- 3) Shop stock: all rewards are bait packs held in the fishing-bait inventory.
-- The special unknown bait is intentionally obtainable here while its recipe remains undefined.
insert into public.fishing_shop_catalog
  (product_id,product_name,description,icon,price_points,reward_type,reward_config,stock_limit,stock_sold,per_player_limit,is_active,sort_order)
values
  ('shop_small_bait_bundle','小型鱼饵补给包','内含 3 个小型混合饵，适合在湖畔轻松练习。','🪱',100,'item','{"bait_id":"small_mixed_bait","quantity":3}'::jsonb,null,0,null,true,1),
  ('shop_medium_bait_bundle','中型鱼饵补给包','内含 2 个中型混合饵，向更有价值的鱼种进发。','🎣',450,'item','{"bait_id":"medium_mixed_bait","quantity":2}'::jsonb,null,0,null,true,2),
  ('shop_large_bait','大型混合饵','兑换 1 个大型混合饵，挑战大型鱼种。','🐟',1100,'item','{"bait_id":"large_mixed_bait","quantity":1}'::jsonb,null,0,null,true,3),
  ('shop_mystery_bait','成分不明的混合饵','特殊鱼饵补给。可尝试钓取市谷的鱼王与鱼王之王；鱼饵配方仍保持未开放。','❔',4800,'item','{"bait_id":"unknown_mixed_bait","quantity":1}'::jsonb,null,0,null,true,4)
on conflict(product_id) do update set
  product_name=excluded.product_name,description=excluded.description,
  icon=excluded.icon,price_points=excluded.price_points,
  reward_type=excluded.reward_type,reward_config=excluded.reward_config,
  stock_limit=excluded.stock_limit,per_player_limit=excluded.per_player_limit,
  is_active=true,sort_order=excluded.sort_order;

-- 4) Atomic, idempotent redemption. Only fishing bait can be granted by this v1 shop.
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
  v_bait_id text;
  v_quantity integer;
  v_bait_balance integer;
  v_owned_count integer;
begin
  if v_user is null then raise exception '请先登录'; end if;
  if nullif(trim(p_product_id),'') is null or p_request_id is null then
    raise exception '兑换请求资料不完整';
  end if;

  select points into v_points
  from public.player_fishing_stats where user_id=v_user for update;
  if not found then raise exception '钓鱼资料尚未初始化'; end if;

  select * into v_existing from public.fishing_shop_redemptions
  where user_id=v_user and request_id=p_request_id;
  if found then
    if v_existing.product_id<>p_product_id then raise exception '该请求编号已用于其他兑换'; end if;
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
    if v_owned_count>=v_product.per_player_limit then raise exception '已达到该商品的个人兑换上限'; end if;
  end if;
  if v_points<v_product.price_points then raise exception '钓鱼积分不足'; end if;
  if v_product.reward_type<>'item' then raise exception '当前版本只支持鱼饵类商品'; end if;

  v_bait_id:=v_product.reward_config->>'bait_id';
  v_quantity:=coalesce((v_product.reward_config->>'quantity')::integer,0);
  if v_quantity<1 or v_quantity>20 or not exists(
    select 1 from public.fishing_bait_catalog where bait_id=v_bait_id and is_active=true
  ) then raise exception '商品奖励配置无效'; end if;

  update public.player_fishing_stats
  set points=points-v_product.price_points,updated_at=clock_timestamp()
  where user_id=v_user;

  insert into public.fishing_points_ledger(user_id,amount,reason)
  values(v_user,-v_product.price_points,'钓场商店兑换：'||v_product.product_name);

  insert into public.player_fishing_bait(user_id,bait_id,quantity,updated_at)
  values(v_user,v_bait_id,v_quantity,clock_timestamp())
  on conflict(user_id,bait_id) do update
    set quantity=public.player_fishing_bait.quantity+excluded.quantity,
        updated_at=clock_timestamp()
  returning quantity into v_bait_balance;

  update public.fishing_shop_catalog set stock_sold=stock_sold+1
  where product_id=p_product_id;

  insert into public.fishing_shop_redemptions(user_id,product_id,request_id,price_points,reward_config)
  values(v_user,p_product_id,p_request_id,v_product.price_points,v_product.reward_config);

  return jsonb_build_object('success',true,'duplicate_request',false,
    'product_id',p_product_id,'product_name',v_product.product_name,
    'spent_points',v_product.price_points,'remaining_points',v_points-v_product.price_points,
    'bait_id',v_bait_id,'bait_quantity',v_quantity,'bait_balance',v_bait_balance);
end;
$$;

revoke all on function public.fishing_redeem_shop(text,uuid) from public,anon,authenticated;
grant execute on function public.fishing_redeem_shop(text,uuid) to authenticated;

-- 5) Dashboard exposes reward details used by the client UI.
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

  select to_jsonb(s) into v_stats from public.player_fishing_stats s where s.user_id=v_user_id;
  if v_stats is null then
    insert into public.player_fishing_stats(user_id) values(v_user_id) on conflict do nothing;
    select to_jsonb(s) into v_stats from public.player_fishing_stats s where s.user_id=v_user_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'bait_id',b.bait_id,'bait_name',c.bait_name,'icon',c.icon,'quantity',b.quantity
  ) order by c.sort_order),'[]'::jsonb)
  into v_baits
  from public.player_fishing_bait b join public.fishing_bait_catalog c using(bait_id)
  where b.user_id=v_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'fish_id',f.fish_id,'fish_name',c.fish_name,'catch_count',f.catch_count,
    'best_size_cm',f.best_size_cm,'best_points',f.best_points,'first_caught_at',f.first_caught_at
  ) order by c.sort_order),'[]'::jsonb)
  into v_fishbook
  from public.player_fishbook f join public.fishing_fish_catalog c using(fish_id)
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
  into v_shop from public.fishing_shop_catalog where is_active=true;

  return jsonb_build_object('stats',v_stats,'baits',v_baits,'fishbook',v_fishbook,
    'achievements',v_achievements,'shop',v_shop);
end;
$$;

revoke all on function public.fishing_get_dashboard() from public,anon,authenticated;
grant execute on function public.fishing_get_dashboard() to authenticated;

-- Ensure the read-only catalogue policies remain active.
drop policy if exists fishing_achievements_read_active on public.fishing_achievements;
create policy fishing_achievements_read_active on public.fishing_achievements
  for select to authenticated using (is_active=true or public.is_admin());
drop policy if exists fishing_shop_catalog_read_active on public.fishing_shop_catalog;
create policy fishing_shop_catalog_read_active on public.fishing_shop_catalog
  for select to authenticated using (is_active=true or public.is_admin());
