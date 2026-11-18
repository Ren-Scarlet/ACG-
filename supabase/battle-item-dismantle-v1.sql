-- Battle-item dismantling support.
-- Normal battle items return 10 tokens each; important battle items return 20.
-- Ordinary card dismantling keeps its existing rarity/alt rewards unchanged.

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
    raise exception '请先选择要分解的物品';
  end if;

  select tokens into v_balance from public.player_stats
  where user_id=v_user_id for update;
  if not found then raise exception '玩家资料尚未初始化'; end if;

  select reward_tokens,items into v_old_reward,v_old_items from public.card_dismantle_requests
  where user_id=v_user_id and request_id=p_request_id;
  if found then
    if v_old_items <> p_items then
      raise exception '该分解请求编号已用于另一份物品清单，请刷新后重试';
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
  ) then raise exception '分解清单包含重复物品，请刷新后重试'; end if;

  for v_item in
    select x.card_id,x.quantity,c.rarity,c.is_alt,c.item_class,p.draw_mode
    from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    join public.draw_card_catalog c on c.card_id=x.card_id and c.enabled=true
    left join public.card_draw_pools p on p.pack_id=c.pack_id
    order by x.card_id
  loop
    select quantity into v_current from public.card_inventory
    where user_id=v_user_id and card_id=v_item.card_id for update;
    if not found or v_current < v_item.quantity then
      raise exception '物品库存不足：%',v_item.card_id;
    end if;
    v_unit_reward := case
      when v_item.draw_mode='battle_item' and v_item.item_class='important' then 20
      when v_item.draw_mode='battle_item' then 10
      when v_item.is_alt then 30
      when v_item.rarity=5 then 20
      when v_item.rarity=4 then 15
      else 10
    end;
    v_reward := v_reward + v_unit_reward * v_item.quantity;
  end loop;

  if (select count(*) from jsonb_to_recordset(p_items) as x(card_id text,quantity integer))
     <> (select count(*) from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
         join public.draw_card_catalog c on c.card_id=x.card_id and c.enabled=true) then
    raise exception '分解清单中包含无效物品';
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
  values(v_user_id,v_reward,'分解卡牌与对战道具');

  insert into public.card_dismantle_requests(user_id,request_id,reward_tokens,items)
  values(v_user_id,p_request_id,v_reward,p_items);

  return jsonb_build_object('reward_tokens',v_reward,'remaining_tokens',v_balance,'duplicate_request',false);
end;
$$;

revoke all on function public.dismantle_cards(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.dismantle_cards(jsonb,uuid) to authenticated;
