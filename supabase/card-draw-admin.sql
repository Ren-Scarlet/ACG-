-- Safe admin control for pausing a live draw pool.
-- Run once in Supabase SQL Editor after card-draw.sql and achievement-management.sql.

-- Keep draw achievements on the unified active-condition evaluator only.
create or replace function public.draw_one_card(
  p_pack_id text,
  p_request_id uuid
)
returns table(card_id text, remaining_tokens bigint, duplicate_request boolean)
language plpgsql
security definer
set search_path = ''
as $
declare
  v_user_id uuid := auth.uid();
  v_pool public.card_draw_pools%rowtype;
  v_balance bigint;
  v_old_card text;
  v_rarity integer;
  v_roll integer;
  v_card_id text;
  v_history_id bigint;
begin
  if v_user_id is null then
    raise exception '请先登录';
  end if;
  if p_request_id is null then
    raise exception '抽卡请求编号缺失，请重新点击抽卡';
  end if;

  select tokens into v_balance
  from public.player_stats
  where user_id=v_user_id
  for update;

  if not found then
    raise exception '玩家资料尚未初始化，请重新登录';
  end if;

  select h.card_id into v_old_card
  from public.card_draw_history h
  where h.user_id=v_user_id and h.request_id=p_request_id;

  if found then
    return query select v_old_card, v_balance, true;
    return;
  end if;

  select * into v_pool
  from public.card_draw_pools
  where pack_id=p_pack_id and enabled=true;

  if not found or v_pool.price_tokens is null
     or v_pool.rate_3 is null or v_pool.rate_4 is null or v_pool.rate_5 is null then
    raise exception '这个卡池尚未开放';
  end if;

  if v_balance < v_pool.price_tokens then
    raise exception '代币不足，需要 %，当前余额 %',v_pool.price_tokens,v_balance;
  end if;

  v_roll := floor(random()*100)::integer + 1;
  if v_roll <= v_pool.rate_3 then
    v_rarity := 3;
  elsif v_roll <= v_pool.rate_3 + v_pool.rate_4 then
    v_rarity := 4;
  else
    v_rarity := 5;
  end if;

  select c.card_id into v_card_id
  from public.draw_card_catalog c
  where c.pack_id=p_pack_id and c.rarity=v_rarity and c.enabled=true
  order by random()
  limit 1;

  if v_card_id is null then
    raise exception '卡池配置错误：该星级没有可抽取卡牌';
  end if;

  update public.player_stats
  set tokens=tokens-v_pool.price_tokens, updated_at=now()
  where user_id=v_user_id
  returning tokens into v_balance;

  insert into public.card_inventory (user_id,card_id,quantity,updated_at)
  values (v_user_id,v_card_id,1,now())
  on conflict (user_id,card_id) do update
    set quantity=public.card_inventory.quantity+1, updated_at=now();

  insert into public.token_transactions (user_id,amount,reason)
  values (v_user_id,-v_pool.price_tokens,'抽卡：'||v_pool.pack_name);

  insert into public.card_draw_history (user_id,pack_id,card_id,cost_tokens,request_id)
  values (v_user_id,p_pack_id,v_card_id,v_pool.price_tokens,p_request_id)
  returning id into v_history_id;

  perform public.refresh_player_achievements(v_user_id);

  return query select v_card_id,v_balance,false;
end;
$;



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
