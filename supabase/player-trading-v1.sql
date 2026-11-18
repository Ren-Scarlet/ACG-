-- ACG player trading v1
-- Only normal cards (rarity pools), battle items, and tree fruits (uniform pools) are tradable.
-- Install once in Supabase SQL Editor. Adds tables/functions only; existing inventories are preserved.

create table if not exists public.player_trade_offers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  give_items jsonb not null,
  want_items jsonb not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint player_trade_distinct_users check (sender_id <> recipient_id),
  constraint player_trade_arrays check (jsonb_typeof(give_items)='array' and jsonb_typeof(want_items)='array')
);
create index if not exists player_trade_sender_created_idx on public.player_trade_offers(sender_id,created_at desc);
create index if not exists player_trade_recipient_created_idx on public.player_trade_offers(recipient_id,created_at desc);
alter table public.player_trade_offers enable row level security;
drop policy if exists player_trade_participant_read on public.player_trade_offers;
create policy player_trade_participant_read on public.player_trade_offers
for select to authenticated using (auth.uid()=sender_id or auth.uid()=recipient_id);
revoke all on public.player_trade_offers from anon,authenticated;
grant select on public.player_trade_offers to authenticated;

create or replace function public.trade_validate_items(p_items jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>30 then
    raise exception '每一方至少选择 1 种物品，单笔最多选择 30 种';
  end if;
  if exists(select 1 from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    where coalesce(trim(x.card_id),'')='' or x.quantity is null or x.quantity<1 or x.quantity>999) then
    raise exception '交易物品或数量无效';
  end if;
  if exists(select 1 from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    group by x.card_id having count(*)>1) then
    raise exception '交易清单中存在重复物品';
  end if;
  if exists(
    select 1 from jsonb_to_recordset(p_items) as x(card_id text,quantity integer)
    left join public.draw_card_catalog c on c.card_id=x.card_id
    left join public.card_draw_pools p on p.pack_id=c.pack_id
    where c.card_id is null or p.draw_mode not in ('rarity','battle_item','uniform')
  ) then raise exception '只能交换普通卡牌、对战道具和树果'; end if;
end;
$$;

create or replace function public.trade_create_offer(p_recipient_public_id text,p_give_items jsonb,p_want_items jsonb)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_sender uuid:=auth.uid(); v_recipient uuid; v_offer uuid; v_item record; v_owned integer; v_locked_rows integer;
begin
  if v_sender is null then raise exception '请先登录'; end if;
  if nullif(trim(p_recipient_public_id),'') is null then raise exception '请输入交易对象的玩家 ID'; end if;
  select p.id into v_recipient
  from public.profiles p left join public.player_registry r on r.player_number=p.player_number
  where lower(coalesce(r.display_name,p.username))=lower(trim(p_recipient_public_id))
     or lower(coalesce(p.player_number,''))=lower(trim(p_recipient_public_id)) limit 1;
  if v_recipient is null then raise exception '没有找到这个玩家'; end if;
  if v_recipient=v_sender then raise exception '不能与自己交易'; end if;
  perform public.trade_validate_items(p_give_items);
  perform public.trade_validate_items(p_want_items);
  perform 1 from public.player_stats where user_id=v_sender for update;
  get diagnostics v_locked_rows=row_count;
  if v_locked_rows<>1 then raise exception '玩家资料尚未初始化，请重新登录'; end if;
  for v_item in select x.card_id,x.quantity from jsonb_to_recordset(p_give_items) as x(card_id text,quantity integer) order by x.card_id loop
    select quantity into v_owned from public.card_inventory where user_id=v_sender and card_id=v_item.card_id for update;
    if coalesce(v_owned,0)<v_item.quantity then raise exception '你的物品库存不足：%',v_item.card_id; end if;
  end loop;
  insert into public.player_trade_offers(sender_id,recipient_id,give_items,want_items)
  values(v_sender,v_recipient,p_give_items,p_want_items) returning id into v_offer;
  return v_offer;
end;
$$;

create or replace function public.trade_list_my_offers()
returns table(id uuid,sender_id uuid,recipient_id uuid,sender_name text,recipient_name text,
  give_items jsonb,want_items jsonb,status text,created_at timestamptz)
language sql security definer set search_path = ''
as $$
  select o.id,o.sender_id,o.recipient_id,coalesce(sr.display_name,sp.username,'玩家'),
    coalesce(rr.display_name,rp.username,'玩家'),o.give_items,o.want_items,o.status,o.created_at
  from public.player_trade_offers o
  left join public.profiles sp on sp.id=o.sender_id left join public.player_registry sr on sr.player_number=sp.player_number
  left join public.profiles rp on rp.id=o.recipient_id left join public.player_registry rr on rr.player_number=rp.player_number
  where auth.uid()=o.sender_id or auth.uid()=o.recipient_id
  order by o.created_at desc limit 100;
$$;

create or replace function public.trade_respond_offer(p_offer_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid:=auth.uid(); v_offer public.player_trade_offers%rowtype; v_item record; v_qty integer; v_locked_rows integer;
begin
  if v_user is null then raise exception '请先登录'; end if;
  select * into v_offer from public.player_trade_offers where id=p_offer_id for update;
  if not found then raise exception '交易不存在'; end if;
  if v_offer.status<>'pending' then raise exception '这笔交易已处理'; end if;
  if not p_accept then
    if v_user<>v_offer.recipient_id then raise exception '只有接收方可以拒绝交易'; end if;
    update public.player_trade_offers set status='rejected',responded_at=now() where id=p_offer_id;
    return jsonb_build_object('status','rejected');
  end if;
  if v_user<>v_offer.recipient_id then raise exception '只有接收方可以确认交易'; end if;

  perform 1 from public.player_stats where user_id in (v_offer.sender_id,v_offer.recipient_id) order by user_id for update;
  get diagnostics v_locked_rows=row_count;
  if v_locked_rows<>2 then raise exception '交易玩家资料异常，请联系管理员'; end if;
  perform public.trade_validate_items(v_offer.give_items);
  perform public.trade_validate_items(v_offer.want_items);

  for v_item in
    select x.card_id,x.quantity,v_offer.sender_id as owner_id from jsonb_to_recordset(v_offer.give_items) as x(card_id text,quantity integer)
    union all
    select x.card_id,x.quantity,v_offer.recipient_id from jsonb_to_recordset(v_offer.want_items) as x(card_id text,quantity integer)
    order by card_id,owner_id
  loop
    select quantity into v_qty from public.card_inventory where user_id=v_item.owner_id and card_id=v_item.card_id for update;
    if coalesce(v_qty,0)<v_item.quantity then raise exception '交易失败：一方库存不足（%），双方物品均未转移',v_item.card_id; end if;
  end loop;

  for v_item in
    select x.card_id,x.quantity,v_offer.sender_id as owner_id from jsonb_to_recordset(v_offer.give_items) as x(card_id text,quantity integer)
    union all
    select x.card_id,x.quantity,v_offer.recipient_id from jsonb_to_recordset(v_offer.want_items) as x(card_id text,quantity integer)
    order by card_id,owner_id
  loop
    update public.card_inventory set quantity=quantity-v_item.quantity,updated_at=now()
    where user_id=v_item.owner_id and card_id=v_item.card_id;
    delete from public.card_inventory where user_id=v_item.owner_id and card_id=v_item.card_id and quantity<=0;
  end loop;

  for v_item in
    select x.card_id,x.quantity,v_offer.recipient_id as owner_id from jsonb_to_recordset(v_offer.give_items) as x(card_id text,quantity integer)
    union all
    select x.card_id,x.quantity,v_offer.sender_id from jsonb_to_recordset(v_offer.want_items) as x(card_id text,quantity integer)
    order by card_id,owner_id
  loop
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(v_item.owner_id,v_item.card_id,v_item.quantity,now())
    on conflict(user_id,card_id) do update set quantity=public.card_inventory.quantity+excluded.quantity,updated_at=now();
  end loop;
  update public.player_trade_offers set status='accepted',responded_at=now() where id=p_offer_id;
  return jsonb_build_object('status','accepted');
end;
$$;

create or replace function public.trade_cancel_offer(p_offer_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.player_trade_offers set status='cancelled',responded_at=now()
  where id=p_offer_id and sender_id=auth.uid() and status='pending';
  if not found then raise exception '交易不存在、已处理，或你没有权限取消'; end if;
end;
$$;

revoke all on function public.trade_validate_items(jsonb) from public,anon,authenticated;
revoke all on function public.trade_create_offer(text,jsonb,jsonb) from public,anon;
revoke all on function public.trade_list_my_offers() from public,anon;
revoke all on function public.trade_respond_offer(uuid,boolean) from public,anon;
revoke all on function public.trade_cancel_offer(uuid) from public,anon;
grant execute on function public.trade_create_offer(text,jsonb,jsonb) to authenticated;
grant execute on function public.trade_list_my_offers() to authenticated;
grant execute on function public.trade_respond_offer(uuid,boolean) to authenticated;
grant execute on function public.trade_cancel_offer(uuid) to authenticated;
