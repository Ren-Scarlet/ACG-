-- ACG player auto-dismantle settings and batch consumable use.
-- Apply this migration in Supabase SQL Editor before publishing the matching frontend.

create table if not exists public.player_card_auto_dismantle_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  rarities integer[] not null default array[3,4,5],
  updated_at timestamptz not null default now(),
  constraint player_card_auto_dismantle_rarities_check
    check (rarities <@ array[3,4,5]::integer[])
);
alter table public.player_card_auto_dismantle_settings enable row level security;
revoke all on public.player_card_auto_dismantle_settings from public, anon, authenticated;

create or replace function public.apply_player_auto_dismantle(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_rarities integer[];
  v_card record;
  v_removed integer := 0;
  v_reward bigint := 0;
  v_unit integer;
begin
  select enabled,rarities into v_enabled,v_rarities
  from public.player_card_auto_dismantle_settings
  where user_id=p_user_id;
  if not coalesce(v_enabled,false) or p_user_id is null then
    return jsonb_build_object('dismantled_cards',0,'reward_tokens',0);
  end if;

  for v_card in
    select ci.card_id,ci.quantity,dc.rarity,dc.is_alt
    from public.card_inventory ci
    join public.draw_card_catalog dc on dc.card_id=ci.card_id and dc.enabled=true
    where ci.user_id=p_user_id and ci.quantity>3
      and dc.rarity=any(v_rarities)
    order by ci.card_id
    for update of ci
  loop
    v_unit := case when v_card.is_alt then 30
      when v_card.rarity=5 then 20
      when v_card.rarity=4 then 15 else 10 end;
    update public.card_inventory
    set quantity=3,updated_at=now()
    where user_id=p_user_id and card_id=v_card.card_id;
    v_removed := v_removed + v_card.quantity - 3;
    v_reward := v_reward + (v_card.quantity - 3) * v_unit;
  end loop;

  if v_reward>0 then
    update public.player_stats
    set tokens=tokens+v_reward,updated_at=now()
    where user_id=p_user_id;
    if not found then raise exception '玩家资料不存在，无法发放自动分解代币'; end if;
    insert into public.token_transactions(user_id,amount,reason)
    values(p_user_id,v_reward,'自动分解重复卡牌');
  end if;

  return jsonb_build_object('dismantled_cards',v_removed,'reward_tokens',v_reward);
end;
$$;

create or replace function public.on_card_inventory_auto_dismantle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.apply_player_auto_dismantle(new.user_id);
  return new;
end;
$$;

drop trigger if exists card_inventory_auto_dismantle on public.card_inventory;
create trigger card_inventory_auto_dismantle
after insert or update of quantity on public.card_inventory
for each row execute function public.on_card_inventory_auto_dismantle();

create or replace function public.player_get_auto_dismantle_settings()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean := false;
  v_rarities integer[] := array[3,4,5];
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select enabled,rarities into v_enabled,v_rarities
  from public.player_card_auto_dismantle_settings
  where user_id=auth.uid();
  return jsonb_build_object('enabled',v_enabled,'rarities',to_jsonb(v_rarities));
end;
$$;

create or replace function public.player_set_auto_dismantle_settings(
  p_enabled boolean,
  p_rarities integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_processed jsonb;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_enabled is null or p_rarities is null
     or exists(select 1 from unnest(p_rarities) r where r not in (3,4,5))
     or cardinality(p_rarities)<>(select count(distinct r) from unnest(p_rarities) r) then
    raise exception '自动分解设置无效，只能选择三星、四星或五星';
  end if;
  perform 1 from public.player_stats where user_id=auth.uid() for update;
  if not found then raise exception '玩家资料尚未初始化'; end if;

  insert into public.player_card_auto_dismantle_settings(user_id,enabled,rarities,updated_at)
  values(auth.uid(),p_enabled,p_rarities,now())
  on conflict(user_id) do update
    set enabled=excluded.enabled,rarities=excluded.rarities,updated_at=now();

  v_processed:=public.apply_player_auto_dismantle(auth.uid());
  select jsonb_build_object('enabled',enabled,'rarities',to_jsonb(rarities))
  into v_result from public.player_card_auto_dismantle_settings where user_id=auth.uid();
  return v_result || jsonb_build_object('processed',v_processed);
end;
$$;

revoke all on function public.apply_player_auto_dismantle(uuid) from public,anon,authenticated;
revoke all on function public.on_card_inventory_auto_dismantle() from public,anon,authenticated;
revoke all on function public.player_get_auto_dismantle_settings() from public,anon;
revoke all on function public.player_set_auto_dismantle_settings(boolean,integer[]) from public,anon;
grant execute on function public.player_get_auto_dismantle_settings() to authenticated;
grant execute on function public.player_set_auto_dismantle_settings(boolean,integer[]) to authenticated;

drop function if exists public.use_inventory_item(text,uuid,integer);
create function public.use_inventory_item(
  p_item_id text,
  p_request_id uuid,
  p_choice_index integer default null,
  p_use_count integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_item public.item_catalog%rowtype;
  v_balance bigint;
  v_existing_item text;
  v_existing_cards jsonb;
  v_existing_data jsonb;
  v_quantity integer;
  v_use_count integer := coalesce(p_use_count,1);
  v_pack public.card_draw_pools%rowtype;
  v_pack_count integer;
  v_card_count integer;
  v_i integer;
  v_roll numeric;
  v_rarity integer;
  v_is_alt boolean;
  v_card_id text;
  v_cards jsonb := '[]'::jsonb;
  v_result jsonb := '{}'::jsonb;
  v_amount bigint;
  v_reward_type text;
  v_reward_id text;
  v_total_weight numeric;
  v_pick numeric;
  v_running numeric;
  v_option record;
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  if nullif(btrim(p_item_id),'') is null or p_request_id is null then
    raise exception '道具编号或使用请求编号缺失';
  end if;
  if v_use_count not between 1 and 20 then raise exception '一次最多使用 20 张道具'; end if;

  -- Lock the player row to serialize item use, token grants and card draws.
  select tokens into v_balance
  from public.player_stats
  where user_id=v_user_id
  for update;
  if not found then raise exception '玩家资料尚未初始化，请重新登录'; end if;

  select item_id,result_cards,result_data
    into v_existing_item,v_existing_cards,v_existing_data
  from public.consumable_use_history
  where user_id=v_user_id and request_id=p_request_id;
  if found then
    if v_existing_item<>p_item_id then
      raise exception '使用请求编号已用于其他道具，请刷新后重试';
    end if;
    if coalesce((v_existing_data->>'use_count')::integer,1)<>v_use_count then
      raise exception '该请求编号已用于不同数量的道具，请使用原数量重试';
    end if;
    return jsonb_build_object(
      'item_id',p_item_id,
      'cards',coalesce(v_existing_cards,'[]'::jsonb),
      'result',coalesce(v_existing_data,'{}'::jsonb),
      'remaining_tokens',v_balance,
      'duplicate_request',true
    );
  end if;

  select * into v_item
  from public.item_catalog
  where item_id=p_item_id and is_active=true
  for share;
  if not found then raise exception '这个道具不存在或已停用'; end if;
  if v_item.category<>'consumable' then raise exception '这个道具不能直接使用'; end if;
  if v_item.effect_type='none' then raise exception '这个道具没有可执行效果'; end if;

  select quantity into v_quantity
  from public.card_inventory
  where user_id=v_user_id and card_id=p_item_id
  for update;
  if not found or v_quantity<v_use_count then raise exception '道具数量不足，无法使用'; end if;

  if v_item.effect_type='draw_pack' then
    v_pack_count := (v_item.effect_config->>'pack_count')::integer;
    select * into v_pack
    from public.card_draw_pools
    where pack_id=v_item.effect_config->>'pack_id' and enabled=true;
    if not found then raise exception '指定卡包尚未开放'; end if;
    if v_pack.draw_mode is distinct from 'uniform'
       and (v_pack.rate_alt is null or v_pack.rate_5 is null
         or v_pack.rate_4 is null or v_pack.rate_3 is null) then
      raise exception '指定卡包尚未完成概率设置';
    end if;
    v_card_count := v_pack_count*v_use_count*5;

    for v_i in 1..v_card_count loop
      v_card_id := null;
      v_rarity := null;
      v_is_alt := false;
      if v_pack.draw_mode='uniform' then
        select c.card_id into v_card_id
        from public.draw_card_catalog c
        where c.pack_id=v_pack.pack_id and c.enabled=true
        order by random() limit 1;
        v_rarity := 1;
      else
        v_roll := random()*100;
        if v_roll<v_pack.rate_alt then
          v_is_alt := true;
        elsif v_roll<v_pack.rate_alt+v_pack.rate_5 then
          v_rarity := 5;
        elsif v_roll<v_pack.rate_alt+v_pack.rate_5+v_pack.rate_4 then
          v_rarity := 4;
        else
          v_rarity := 3;
        end if;
        select c.card_id into v_card_id
        from public.draw_card_catalog c
        where c.pack_id=v_pack.pack_id and c.enabled=true
          and ((v_is_alt and c.is_alt)
            or (not v_is_alt and not c.is_alt and c.rarity=v_rarity))
        order by random() limit 1;
      end if;
      if v_card_id is null then raise exception '卡包配置错误：抽取类别没有可用卡牌'; end if;

      insert into public.card_inventory(user_id,card_id,quantity,updated_at)
      values(v_user_id,v_card_id,1,now())
      on conflict(user_id,card_id) do update
        set quantity=public.card_inventory.quantity+1,updated_at=now();

      v_cards := v_cards || jsonb_build_array(jsonb_build_object(
        'card_id',v_card_id,'draw_index',v_i,'rarity',v_rarity,'is_alt',v_is_alt
      ));
    end loop;
    v_result := jsonb_build_object(
      'kind','draw_pack','pack_id',v_pack.pack_id,
      'pack_name',v_pack.pack_name,'packages',v_pack_count,
      'card_count',v_card_count
    );

  elsif v_item.effect_type='grant_tokens' then
    if v_use_count<>1 then raise exception '该道具暂不支持批量使用'; end if;
    v_amount := (v_item.effect_config->>'amount')::bigint;
    update public.player_stats
    set tokens=tokens+v_amount,updated_at=now()
    where user_id=v_user_id returning tokens into v_balance;
    insert into public.token_transactions(user_id,amount,reason)
    values(v_user_id,v_amount,'道具使用：'||v_item.name);
    v_result := jsonb_build_object('kind','tokens','amount',v_amount);

  elsif v_item.effect_type='grant_card' then
    if v_use_count<>1 then raise exception '该道具暂不支持批量使用'; end if;
    v_reward_id := v_item.effect_config->>'card_id';
    v_amount := (v_item.effect_config->>'amount')::bigint;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user_id,v_reward_id,v_amount::integer,now())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    v_result := jsonb_build_object('kind','card','reward_id',v_reward_id,'amount',v_amount);

  elsif v_item.effect_type='grant_item' then
    if v_use_count<>1 then raise exception '该道具暂不支持批量使用'; end if;
    v_reward_id := v_item.effect_config->>'item_id';
    v_amount := (v_item.effect_config->>'amount')::bigint;
    if not exists(select 1 from public.item_catalog where item_id=v_reward_id and is_active=true) then
      raise exception '指定奖励道具不存在或已停用';
    end if;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user_id,v_reward_id,v_amount::integer,now())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    v_result := jsonb_build_object('kind','item','reward_id',v_reward_id,'amount',v_amount);

  elsif v_item.effect_type in ('random_reward','choose_reward') then
    if v_use_count<>1 then raise exception '该道具暂不支持批量使用'; end if;
    if v_item.effect_type='random_reward' then
      select sum((value->>'weight')::numeric) into v_total_weight
      from jsonb_array_elements(v_item.effect_config->'options');
      v_pick := random()*v_total_weight;
      v_running := 0;
      for v_option in select value from jsonb_array_elements(v_item.effect_config->'options') loop
        v_running := v_running+(v_option.value->>'weight')::numeric;
        if v_pick<=v_running then exit; end if;
      end loop;
    else
      if p_choice_index is null or p_choice_index<1
         or p_choice_index>jsonb_array_length(v_item.effect_config->'options') then
        raise exception '请先选择一项奖励';
      end if;
      select value into v_option
      from jsonb_array_elements(v_item.effect_config->'options') with ordinality as options(value,position)
      where position=p_choice_index;
    end if;
    v_reward_type := v_option.value->>'reward_type';
    v_reward_id := v_option.value->>'reward_id';
    v_amount := (v_option.value->>'amount')::bigint;
    if v_reward_type='tokens' then
      update public.player_stats
      set tokens=tokens+v_amount,updated_at=now()
      where user_id=v_user_id returning tokens into v_balance;
      insert into public.token_transactions(user_id,amount,reason)
      values(v_user_id,v_amount,'随机道具奖励：'||v_item.name);
    elsif v_reward_type='card' then
      insert into public.card_inventory(user_id,card_id,quantity,updated_at)
      values(v_user_id,v_reward_id,v_amount::integer,now())
      on conflict(user_id,card_id) do update
        set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    elsif v_reward_type='item' then
      if not exists(select 1 from public.item_catalog where item_id=v_reward_id and is_active=true) then
        raise exception '随机奖励中的道具不存在或已停用';
      end if;
      insert into public.card_inventory(user_id,card_id,quantity,updated_at)
      values(v_user_id,v_reward_id,v_amount::integer,now())
      on conflict(user_id,card_id) do update
        set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    end if;
    v_result := jsonb_build_object(
      'kind',v_reward_type,'reward_id',v_reward_id,'amount',v_amount,
      'choice_label',coalesce(v_option.value->>'label','')
    );
  end if;

  if v_quantity=v_use_count then
    delete from public.card_inventory
    where user_id=v_user_id and card_id=p_item_id;
  else
    update public.card_inventory
    set quantity=quantity-v_use_count,updated_at=now()
    where user_id=v_user_id and card_id=p_item_id;
  end if;
  v_result := v_result || jsonb_build_object('use_count',v_use_count);

  insert into public.consumable_use_history(user_id,request_id,item_id,result_cards,result_data)
  values(v_user_id,p_request_id,p_item_id,v_cards,v_result);

  select tokens into v_balance from public.player_stats where user_id=v_user_id;
  return jsonb_build_object(
    'item_id',p_item_id,'cards',v_cards,'result',v_result,
    'remaining_tokens',v_balance,'duplicate_request',false
  );
end;
$$;

revoke all on function public.use_inventory_item(text,uuid,integer,integer) from public,anon;
grant execute on function public.use_inventory_item(text,uuid,integer,integer) to authenticated;



notify pgrst, 'reload schema';
