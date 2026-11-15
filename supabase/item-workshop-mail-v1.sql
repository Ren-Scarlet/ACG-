-- ACG Card Hub: reusable item workshop and in-app mailbox v1.
-- Run once in Supabase SQL Editor after tree-fruit-ticket-v1.sql.
-- Existing card inventory, token ledger, card draw rules and legacy ticket history are preserved.

-- ---------------------------------------------------------------------------
-- 1. Reusable item catalogue. Items share card_inventory so there is one
--    inventory ledger for cards, berries and items.
-- ---------------------------------------------------------------------------

create table if not exists public.item_catalog (
  item_id text primary key,
  name text not null check (length(btrim(name)) between 1 and 60),
  icon text not null default '🎁',
  description text not null default '',
  category text not null check (category in ('important','consumable')),
  effect_type text not null check (effect_type in (
    'none','draw_pack','grant_tokens','grant_card','grant_item','random_reward','choose_reward'
  )),
  effect_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_catalog_effect_config_object check (jsonb_typeof(effect_config) = 'object')
);

alter table public.item_catalog enable row level security;
drop policy if exists item_catalog_read_active on public.item_catalog;
create policy item_catalog_read_active on public.item_catalog
  for select to authenticated
  using (is_active = true or public.is_admin());
revoke all on public.item_catalog from anon, authenticated;
grant select on public.item_catalog to authenticated;

-- Migrate the existing tree-fruit ticket into the reusable catalogue.
insert into public.item_catalog(
  item_id,name,icon,description,category,effect_type,effect_config,is_active
) values (
  'consumable_tree_fruit_ticket',
  '树果卷',
  '🎟️',
  '使用后免费抽取一次树果包，获得 5 颗随机树果。',
  'consumable',
  'draw_pack',
  '{"pack_id":"pack_010","pack_count":1}'::jsonb,
  true
)
on conflict (item_id) do update
set name=excluded.name,
    icon=excluded.icon,
    description=excluded.description,
    category=excluded.category,
    effect_type=excluded.effect_type,
    effect_config=excluded.effect_config,
    is_active=true,
    updated_at=now();

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
  if p_effect_type is null or p_effect_type not in ('none','draw_pack','grant_tokens','grant_card','grant_item','random_reward','choose_reward') then
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
       or coalesce(jsonb_array_length(v_config->'options'),0)>case when p_effect_type='random_reward' then 20 else 10 end then
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

-- ---------------------------------------------------------------------------
-- 2. Generic consumable executor. Each use is atomic and request-idempotent.
--    The existing consumable_use_history table also preserves old ticket uses.
-- ---------------------------------------------------------------------------

alter table public.consumable_use_history
  add column if not exists result_data jsonb not null default '{}'::jsonb;

drop function if exists public.use_inventory_item(text,uuid);
create function public.use_inventory_item(
  p_item_id text,
  p_request_id uuid,
  p_choice_index integer default null
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
  if not found or v_quantity<1 then raise exception '道具数量不足，无法使用'; end if;

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
    v_card_count := v_pack_count*5;

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
    v_amount := (v_item.effect_config->>'amount')::bigint;
    update public.player_stats
    set tokens=tokens+v_amount,updated_at=now()
    where user_id=v_user_id returning tokens into v_balance;
    insert into public.token_transactions(user_id,amount,reason)
    values(v_user_id,v_amount,'道具使用：'||v_item.name);
    v_result := jsonb_build_object('kind','tokens','amount',v_amount);

  elsif v_item.effect_type='grant_card' then
    v_reward_id := v_item.effect_config->>'card_id';
    v_amount := (v_item.effect_config->>'amount')::bigint;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_user_id,v_reward_id,v_amount::integer,now())
    on conflict(user_id,card_id) do update
      set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    v_result := jsonb_build_object('kind','card','reward_id',v_reward_id,'amount',v_amount);

  elsif v_item.effect_type='grant_item' then
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

  if v_quantity=1 then
    delete from public.card_inventory
    where user_id=v_user_id and card_id=p_item_id;
  else
    update public.card_inventory
    set quantity=quantity-1,updated_at=now()
    where user_id=v_user_id and card_id=p_item_id;
  end if;

  insert into public.consumable_use_history(user_id,request_id,item_id,result_cards,result_data)
  values(v_user_id,p_request_id,p_item_id,v_cards,v_result);

  select tokens into v_balance from public.player_stats where user_id=v_user_id;
  return jsonb_build_object(
    'item_id',p_item_id,'cards',v_cards,'result',v_result,
    'remaining_tokens',v_balance,'duplicate_request',false
  );
end;
$$;

revoke all on function public.use_inventory_item(text,uuid,integer) from public,anon;
grant execute on function public.use_inventory_item(text,uuid,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Internal mailbox. Sending creates a fixed recipient snapshot. Rewards are
--    not credited until that recipient explicitly claims the message.
-- ---------------------------------------------------------------------------

create table if not exists public.mail_messages (
  id bigint generated by default as identity primary key,
  title text not null check (length(btrim(title)) between 1 and 100),
  body text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.mail_recipients (
  mail_id bigint not null references public.mail_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  claimed_at timestamptz,
  primary key(mail_id,user_id)
);

create table if not exists public.mail_attachments (
  id bigint generated by default as identity primary key,
  mail_id bigint not null references public.mail_messages(id) on delete cascade,
  reward_type text not null check (reward_type in ('tokens','card','item')),
  reward_id text,
  amount bigint not null check (amount>0),
  sort_order integer not null default 0,
  constraint mail_attachment_target_check check (
    (reward_type='tokens' and reward_id is null)
    or (reward_type in ('card','item') and nullif(btrim(reward_id),'') is not null)
  )
);

create index if not exists mail_recipients_user_created_idx
  on public.mail_recipients(user_id,mail_id desc);
create index if not exists mail_attachments_mail_idx
  on public.mail_attachments(mail_id,sort_order,id);

alter table public.mail_messages enable row level security;
alter table public.mail_recipients enable row level security;
alter table public.mail_attachments enable row level security;
revoke all on public.mail_messages from public,anon,authenticated;
revoke all on public.mail_recipients from public,anon,authenticated;
revoke all on public.mail_attachments from public,anon,authenticated;

create or replace function public.admin_send_mail(
  p_title text,
  p_body text,
  p_target_type text,
  p_user_ids uuid[],
  p_attachments jsonb,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mail_id bigint;
  v_recipient_count integer;
  v_attachment jsonb;
  v_type text;
  v_reward_id text;
  v_amount bigint;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以发送邮件';
  end if;
  if nullif(btrim(p_title),'') is null or length(p_title)>100 then
    raise exception '邮件标题不能为空，且最多 100 个字符';
  end if;
  if p_target_type is null or p_target_type not in ('all','selected') then
    raise exception '收件人范围无效';
  end if;
  if p_target_type='selected' and coalesce(cardinality(p_user_ids),0)=0 then
    raise exception '请至少选择一名收件人';
  end if;
  if p_target_type='selected' and (
    select count(distinct x) from unnest(p_user_ids) as selected(x)
  )<>(select count(*) from unnest(p_user_ids)) then
    raise exception '收件人列表中存在重复账号';
  end if;
  if p_target_type='selected' and (
    select count(*) from public.profiles where id=any(p_user_ids)
  )<>cardinality(p_user_ids) then
    raise exception '部分收件人账号不存在';
  end if;
  if coalesce(jsonb_typeof(p_attachments),'')<>'array' or coalesce(jsonb_array_length(p_attachments),0)=0
     or coalesce(jsonb_array_length(p_attachments),0)>30 then
    raise exception '每封邮件需要 1 至 30 项奖励附件';
  end if;
  if p_expires_at is not null and p_expires_at<=now() then
    raise exception '邮件过期时间必须晚于当前时间';
  end if;

  for v_attachment in select value from jsonb_array_elements(p_attachments) loop
    v_type := v_attachment->>'reward_type';
    v_reward_id := nullif(v_attachment->>'reward_id','');
    v_amount := (v_attachment->>'amount')::bigint;
    if v_type not in ('tokens','card','item') or v_amount is null or v_amount<=0
       or (v_type in ('card','item') and v_amount>2147483647) then
      raise exception '邮件附件类型或数量无效';
    end if;
    if v_type='tokens' and v_reward_id is not null then
      raise exception '代币附件不需要填写奖励编号';
    end if;
    if v_type='card' and v_reward_id is null then
      raise exception '卡牌附件缺少卡牌编号';
    end if;
    if v_type='item' and (v_reward_id is null or not exists(
      select 1 from public.item_catalog where item_id=v_reward_id and is_active=true
    )) then
      raise exception '邮件中的道具不存在或已停用';
    end if;
  end loop;

  insert into public.mail_messages(title,body,created_by,expires_at)
  values(btrim(p_title),coalesce(p_body,''),auth.uid(),p_expires_at)
  returning id into v_mail_id;

  if p_target_type='all' then
    insert into public.mail_recipients(mail_id,user_id)
    select v_mail_id,id from public.profiles;
  else
    insert into public.mail_recipients(mail_id,user_id)
    select v_mail_id,x from unnest(p_user_ids) as selected(x);
  end if;
  get diagnostics v_recipient_count = row_count;

  insert into public.mail_attachments(mail_id,reward_type,reward_id,amount,sort_order)
  select v_mail_id,
         value->>'reward_type',
         nullif(value->>'reward_id',''),
         (value->>'amount')::bigint,
         ordinality::integer
  from jsonb_array_elements(p_attachments) with ordinality as attachments(value,ordinality);

  return jsonb_build_object(
    'mail_id',v_mail_id,'recipient_count',v_recipient_count,
    'attachment_count',jsonb_array_length(p_attachments)
  );
end;
$$;

create or replace function public.admin_list_mail()
returns table(
  mail_id bigint,
  title text,
  created_at timestamptz,
  expires_at timestamptz,
  recipient_count bigint,
  claimed_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以查看邮件发送记录';
  end if;
  return query
  select m.id,m.title,m.created_at,m.expires_at,
         count(r.user_id),
         count(r.user_id) filter(where r.claimed_at is not null)
  from public.mail_messages m
  left join public.mail_recipients r on r.mail_id=m.id
  group by m.id
  order by m.created_at desc
  limit 50;
end;
$$;

create or replace function public.player_list_mail()
returns table(
  mail_id bigint,
  title text,
  body text,
  created_at timestamptz,
  expires_at timestamptz,
  read_at timestamptz,
  claimed_at timestamptz,
  attachments jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  return query
  select m.id,m.title,m.body,m.created_at,m.expires_at,r.read_at,r.claimed_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'reward_type',a.reward_type,'reward_id',a.reward_id,'amount',a.amount
      ) order by a.sort_order,a.id)
      from public.mail_attachments a where a.mail_id=m.id
    ),'[]'::jsonb)
  from public.mail_recipients r
  join public.mail_messages m on m.id=r.mail_id
  where r.user_id=v_user_id
  order by m.created_at desc,m.id desc;
end;
$$;

create or replace function public.player_mark_mail_read(p_mail_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  update public.mail_recipients
  set read_at=coalesce(read_at,now())
  where mail_id=p_mail_id and user_id=auth.uid();
  if not found then raise exception '找不到这封邮件'; end if;
end;
$$;

create or replace function public.player_claim_mail(p_mail_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_claimed_at timestamptz;
  v_title text;
  v_expires_at timestamptz;
  v_attachment record;
  v_count integer := 0;
  v_balance bigint;
begin
  if v_user_id is null then raise exception '请先登录'; end if;
  select r.claimed_at,m.title,m.expires_at
    into v_claimed_at,v_title,v_expires_at
  from public.mail_recipients r
  join public.mail_messages m on m.id=r.mail_id
  where r.mail_id=p_mail_id and r.user_id=v_user_id
  for update of r;
  if not found then raise exception '找不到这封邮件'; end if;
  if v_claimed_at is not null then
    return jsonb_build_object('claimed',false,'already_claimed',true);
  end if;
  if v_expires_at is not null and v_expires_at<=now() then
    raise exception '这封邮件已过期，无法领取';
  end if;

  -- The recipient row lock makes the complete reward bundle single-claim.
  for v_attachment in
    select reward_type,reward_id,amount
    from public.mail_attachments
    where mail_id=p_mail_id
    order by sort_order,id
  loop
    if v_attachment.reward_type='tokens' then
      update public.player_stats
      set tokens=tokens+v_attachment.amount,updated_at=now()
      where user_id=v_user_id returning tokens into v_balance;
      if not found then raise exception '玩家资料尚未初始化，无法领取代币'; end if;
      insert into public.token_transactions(user_id,amount,reason)
      values(v_user_id,v_attachment.amount,'邮件奖励：'||v_title);
    else
      if v_attachment.reward_type='item' and not exists(
        select 1 from public.item_catalog
        where item_id=v_attachment.reward_id
      ) then
        raise exception '邮件奖励道具资料不存在，请联系管理员';
      end if;
      insert into public.card_inventory(user_id,card_id,quantity,updated_at)
      values(v_user_id,v_attachment.reward_id,v_attachment.amount::integer,now())
      on conflict(user_id,card_id) do update
        set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
    end if;
    v_count:=v_count+1;
  end loop;

  update public.mail_recipients
  set claimed_at=now(),read_at=coalesce(read_at,now())
  where mail_id=p_mail_id and user_id=v_user_id;

  select tokens into v_balance from public.player_stats where user_id=v_user_id;
  return jsonb_build_object(
    'claimed',true,'already_claimed',false,
    'attachment_count',v_count,'remaining_tokens',v_balance
  );
end;
$$;

revoke all on function public.admin_send_mail(text,text,text,uuid[],jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_list_mail() from public,anon,authenticated;
revoke all on function public.player_list_mail() from public,anon,authenticated;
revoke all on function public.player_mark_mail_read(bigint) from public,anon,authenticated;
revoke all on function public.player_claim_mail(bigint) from public,anon,authenticated;

grant execute on function public.admin_send_mail(text,text,text,uuid[],jsonb,timestamptz) to authenticated;
grant execute on function public.admin_list_mail() to authenticated;
grant execute on function public.player_list_mail() to authenticated;
grant execute on function public.player_mark_mail_read(bigint) to authenticated;
grant execute on function public.player_claim_mail(bigint) to authenticated;
