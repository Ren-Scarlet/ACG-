-- ACG Card Hub: SR / SSR select-card ticket support.
-- Run once in Supabase SQL Editor after item-workshop-mail-v1.sql and card-draw-v2.sql.

alter table public.item_catalog
  drop constraint if exists item_catalog_effect_type_check;
alter table public.item_catalog
  add constraint item_catalog_effect_type_check check (effect_type in (
    'none','draw_pack','grant_tokens','grant_card','grant_item',
    'random_reward','choose_reward','select_card'
  ));

create or replace function public.admin_save_item(
  p_item_id text,
  p_name text,
  p_icon text,
  p_description text,
  p_category text,
  p_effect_type text,
  p_effect_config jsonb,
  p_is_active boolean default true
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config jsonb := coalesce(p_effect_config,'{}'::jsonb);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以管理道具目录';
  end if;
  if nullif(btrim(p_item_id),'') is null or length(p_item_id)>80 then
    raise exception '道具编号无效';
  end if;
  if nullif(btrim(p_name),'') is null or length(p_name)>60 then
    raise exception '道具名称不能为空，且最多 60 个字符';
  end if;
  if p_category is null or p_category not in ('important','consumable') then
    raise exception '道具类别无效';
  end if;
  if p_category='important' and p_effect_type<>'none' then
    raise exception '重要道具暂不支持直接使用效果，请选择消耗品类别';
  end if;
  if p_effect_type is null or p_effect_type not in (
    'none','draw_pack','grant_tokens','grant_card','grant_item',
    'random_reward','choose_reward','select_card'
  ) then
    raise exception '暂不支持这种道具效果';
  end if;
  if jsonb_typeof(v_config)<>'object' then
    raise exception '效果配置格式错误';
  end if;

  if p_effect_type='draw_pack' then
    if nullif(v_config->>'pack_id','') is null
       or coalesce((v_config->>'pack_count')::integer,0) not between 1 and 10 then
      raise exception '抽卡效果需要指定卡包，数量为 1 至 10 包';
    end if;
  elsif p_effect_type='grant_tokens' then
    if coalesce((v_config->>'amount')::bigint,0)<=0 then
      raise exception '代币奖励数量必须大于 0';
    end if;
  elsif p_effect_type='grant_card' then
    if nullif(v_config->>'card_id','') is null
       or coalesce((v_config->>'amount')::bigint,0)<=0
       or coalesce((v_config->>'amount')::bigint,0)>2147483647 then
      raise exception '卡牌奖励需要指定卡牌编号和正整数数量';
    end if;
  elsif p_effect_type='grant_item' then
    if nullif(v_config->>'item_id','') is null
       or coalesce((v_config->>'amount')::bigint,0)<=0
       or coalesce((v_config->>'amount')::bigint,0)>2147483647 then
      raise exception '道具奖励需要指定道具编号和有效的正整数数量';
    end if;
  elsif p_effect_type in ('random_reward','choose_reward') then
    if coalesce(jsonb_typeof(v_config->'options'),'')<>'array'
       or coalesce(jsonb_array_length(v_config->'options'),0)<2
       or coalesce(jsonb_array_length(v_config->'options'),0)>(case when p_effect_type='random_reward' then 20 else 10 end) then
      raise exception '奖励选项数量不正确';
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_config->'options') as opt(value)
      where coalesce(opt.value->>'reward_type','') not in ('tokens','card','item')
         or coalesce((opt.value->>'amount')::bigint,0)<=0
         or (p_effect_type='random_reward' and coalesce((opt.value->>'weight')::numeric,0)<=0)
         or (opt.value->>'reward_type' in ('card','item') and coalesce((opt.value->>'amount')::bigint,0)>2147483647)
         or (opt.value->>'reward_type' in ('card','item')
             and nullif(opt.value->>'reward_id','') is null)
    ) then
      raise exception '奖励选项必须包含有效类型、数量及对应编号；随机奖励还需填写正数权重';
    end if;
  elsif p_effect_type='select_card' then
    if coalesce((v_config->>'rarity')::integer,0) not in (4,5) then
      raise exception '自选卷只能选择 4 星 SR 或 5 星 SSR';
    end if;
  end if;

  insert into public.item_catalog(
    item_id,name,icon,description,category,effect_type,effect_config,
    is_active,created_by,updated_at
  ) values (
    btrim(p_item_id),btrim(p_name),coalesce(nullif(btrim(p_icon),''),'🎁'),
    coalesce(p_description,''),p_category,p_effect_type,v_config,
    coalesce(p_is_active,true),auth.uid(),now()
  )
  on conflict(item_id) do update set
    name=excluded.name,
    icon=excluded.icon,
    description=excluded.description,
    category=excluded.category,
    effect_type=excluded.effect_type,
    effect_config=excluded.effect_config,
    is_active=excluded.is_active,
    updated_at=now();

  return btrim(p_item_id);
end;
$$;

revoke all on function public.admin_save_item(text,text,text,text,text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.admin_save_item(text,text,text,text,text,text,jsonb,boolean) to authenticated;

-- Seed the current SR/SSR card directory so select tickets cover all current card packs.
insert into public.draw_card_catalog(card_id,pack_id,rarity,is_alt,enabled) values
  ('card_001','pack_001',5,false,true),
  ('card_013','pack_001',4,false,true),
  ('card_014','pack_001',4,false,true),
  ('card_015','pack_001',4,false,true),
  ('card_016','pack_001',4,false,true),
  ('card_017','pack_001',4,false,true),
  ('card_018','pack_001',4,false,true),
  ('card_019','pack_001',5,false,true),
  ('card_020','pack_001',5,false,true),
  ('card_023','pack_002',4,false,true),
  ('card_024','pack_002',4,true,true),
  ('card_025','pack_002',5,false,true),
  ('card_026','pack_002',5,true,true),
  ('card_030','pack_003',4,false,true),
  ('card_031','pack_003',4,false,true),
  ('card_032','pack_003',4,false,true),
  ('card_033','pack_003',4,false,true),
  ('card_034','pack_003',5,false,true),
  ('card_035','pack_003',5,false,true),
  ('card_036','pack_003',5,true,true),
  ('card_040','pack_004',4,false,true),
  ('card_041','pack_004',4,false,true),
  ('card_042','pack_004',4,false,true),
  ('card_043','pack_004',4,false,true),
  ('card_044','pack_004',4,false,true),
  ('card_045','pack_004',5,false,true),
  ('card_046','pack_004',5,false,true),
  ('card_047','pack_004',5,true,true),
  ('card_051','pack_005',4,false,true),
  ('card_052','pack_005',4,true,true),
  ('card_053','pack_005',4,false,true),
  ('card_054','pack_005',4,true,true),
  ('card_055','pack_005',4,false,true),
  ('card_056','pack_005',4,false,true),
  ('card_057','pack_005',5,false,true),
  ('card_058','pack_005',5,false,true),
  ('card_062','pack_006',4,false,true),
  ('card_063','pack_006',4,true,true),
  ('card_064','pack_006',4,false,true),
  ('card_065','pack_006',4,false,true),
  ('card_066','pack_006',4,true,true),
  ('card_067','pack_006',4,false,true),
  ('card_068','pack_006',5,false,true),
  ('card_069','pack_006',5,false,true),
  ('card_080','pack_009',4,false,true),
  ('card_081','pack_009',4,false,true),
  ('card_082','pack_009',4,false,true),
  ('card_083','pack_009',4,false,true),
  ('card_084','pack_009',4,false,true),
  ('card_085','pack_009',4,false,true),
  ('card_086','pack_009',4,false,true),
  ('card_087','pack_009',5,false,true),
  ('card_088','pack_009',5,false,true),
  ('card_089','pack_009',5,false,true),
  ('card_097','pack_007',4,false,true),
  ('card_098','pack_007',4,false,true),
  ('card_099','pack_007',4,false,true),
  ('card_100','pack_007',4,false,true),
  ('card_101','pack_007',4,true,true),
  ('card_102','pack_007',5,false,true),
  ('card_103','pack_007',5,false,true),
  ('card_124','pack_008',4,false,true),
  ('card_125','pack_008',4,false,true),
  ('card_126','pack_008',4,false,true),
  ('card_127','pack_008',4,false,true),
  ('card_128','pack_008',4,false,true),
  ('card_129','pack_008',4,false,true),
  ('card_130','pack_008',5,false,true)
on conflict(card_id) do update set pack_id=excluded.pack_id,rarity=excluded.rarity,is_alt=excluded.is_alt,enabled=true;

create or replace function public.player_list_selectable_ticket_cards(p_rarity integer)
returns table(card_id text, rarity integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_rarity not in (4,5) then raise exception '卡牌星级无效'; end if;
  return query
    select c.card_id,c.rarity
    from public.draw_card_catalog c
    where c.enabled=true and c.is_alt=false and c.rarity=p_rarity
    order by c.card_id;
end;
$$;

create or replace function public.player_use_select_card_ticket(
  p_item_id text,
  p_card_id text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_item public.item_catalog%rowtype;
  v_rarity integer;
  v_quantity integer;
  v_balance bigint;
  v_existing_item text;
  v_existing_data jsonb;
  v_result jsonb;
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  if nullif(btrim(p_item_id),'') is null or nullif(btrim(p_card_id),'') is null or p_request_id is null then
    raise exception '道具、卡牌或请求编号缺失';
  end if;

  select tokens into v_balance from public.player_stats
  where user_id=v_user_id for update;
  if not found then raise exception '玩家资料尚未初始化，请重新登录'; end if;

  select item_id,result_data into v_existing_item,v_existing_data
  from public.consumable_use_history
  where user_id=v_user_id and request_id=p_request_id;
  if found then
    if v_existing_item<>p_item_id then raise exception '使用请求编号已用于其他道具'; end if;
    if v_existing_data->>'kind'<>'select_card' then
      raise exception '该请求编号已用于其他类型的道具操作';
    end if;
    return jsonb_build_object('item_id',p_item_id,'result',v_existing_data,'duplicate_request',true);
  end if;

  select * into v_item from public.item_catalog
  where item_id=p_item_id and is_active=true for share;
  if not found or v_item.category<>'consumable' or v_item.effect_type<>'select_card' then
    raise exception '这不是有效的自选卷';
  end if;
  v_rarity := (v_item.effect_config->>'rarity')::integer;
  if v_rarity not in (4,5) then raise exception '自选卷星级配置无效'; end if;

  if not exists(
    select 1 from public.draw_card_catalog c
    where c.card_id=p_card_id and c.enabled=true and c.is_alt=false and c.rarity=v_rarity
  ) then
    raise exception '所选卡牌不属于此自选卷的可选范围，或已停止开放';
  end if;

  select quantity into v_quantity from public.card_inventory
  where user_id=v_user_id and card_id=p_item_id for update;
  if not found or v_quantity<1 then raise exception '自选卷数量不足'; end if;

  insert into public.card_inventory(user_id,card_id,quantity,updated_at)
  values(v_user_id,p_card_id,1,now())
  on conflict(user_id,card_id) do update
    set quantity=public.card_inventory.quantity+1,updated_at=now();

  if v_quantity=1 then
    delete from public.card_inventory where user_id=v_user_id and card_id=p_item_id;
  else
    update public.card_inventory set quantity=quantity-1,updated_at=now()
    where user_id=v_user_id and card_id=p_item_id;
  end if;

  v_result := jsonb_build_object(
    'kind','select_card','reward_id',p_card_id,'amount',1,'rarity',v_rarity,
    'choice_label',case when v_rarity=4 then 'SR 自选卡牌' else 'SSR 自选卡牌' end
  );
  insert into public.consumable_use_history(user_id,request_id,item_id,result_cards,result_data)
  values(v_user_id,p_request_id,p_item_id,'[]'::jsonb,v_result);

  return jsonb_build_object('item_id',p_item_id,'result',v_result,'duplicate_request',false);
end;
$$;

revoke all on function public.player_list_selectable_ticket_cards(integer) from public,anon;
grant execute on function public.player_list_selectable_ticket_cards(integer) to authenticated;
revoke all on function public.player_use_select_card_ticket(text,text,uuid) from public,anon;
grant execute on function public.player_use_select_card_ticket(text,text,uuid) to authenticated;
