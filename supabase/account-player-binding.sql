-- ACG account binding and legacy collection migration.
-- Run this file once in Supabase SQL Editor. Safe to run again.
-- Players register normally; an administrator assigns each account its existing P001-style number.
-- The assignment and legacy inventory import happen in one database transaction.

alter table public.profiles
  add column if not exists player_number text;

create unique index if not exists profiles_player_number_unique
  on public.profiles(player_number)
  where player_number is not null;

alter table public.profiles
  drop constraint if exists profiles_player_number_format_check;

alter table public.profiles
  add constraint profiles_player_number_format_check
  check (player_number is null or player_number ~ '^P[0-9]{3}$');

create table if not exists public.player_registry (
  player_number text primary key
    check (player_number ~ '^P[0-9]{3}$'),
  display_name text not null,
  assigned_user_id uuid unique references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.legacy_card_collections (
  player_number text not null references public.player_registry(player_number) on delete cascade,
  card_id text not null,
  quantity integer not null check (quantity > 0),
  primary key (player_number, card_id)
);

create table if not exists public.legacy_collection_imports (
  player_number text primary key references public.player_registry(player_number) on delete cascade,
  imported_at timestamptz not null default now()
);

insert into public.player_registry(player_number, display_name) values
  ('P001','妹红'),
  ('P002','远坂葵'),
  ('P003','千代守'),
  ('P004','天子'),
  ('P005','路过'),
  ('P006','库拉'),
  ('P007','好吃'),
  ('P008','清野'),
  ('P009','蓝水'),
  ('P010','凉心'),
  ('P011','耳聋'),
  ('P012','浅夏')
on conflict (player_number) do update
  set display_name = excluded.display_name;

-- Snapshot of data/collections.json at migration time.
-- These rows are imported once per player when that player's account is bound.
insert into public.legacy_card_collections(player_number, card_id, quantity) values
  ('P001','card_019',2),
  ('P001','card_010',2),
  ('P002','card_020',1),
  ('P002','card_017',1),
  ('P002','card_011',3),
  ('P002','card_002',3)
on conflict (player_number, card_id) do update
  set quantity = excluded.quantity;

alter table public.player_registry enable row level security;
alter table public.legacy_card_collections enable row level security;
alter table public.legacy_collection_imports enable row level security;

revoke all on public.player_registry from anon, authenticated;
revoke all on public.legacy_card_collections from anon, authenticated;
revoke all on public.legacy_collection_imports from anon, authenticated;

create or replace function public.admin_list_player_accounts()
returns table(
  user_id uuid,
  username text,
  player_number text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以查看玩家账号绑定';
  end if;

  return query
    select p.id, p.username, p.player_number, p.created_at
    from public.profiles p
    order by p.created_at, p.username;
end;
$$;

create or replace function public.admin_list_player_registry()
returns table(
  player_number text,
  display_name text,
  assigned_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以查看玩家编号';
  end if;

  return query
    select r.player_number, r.display_name, r.assigned_user_id
    from public.player_registry r
    order by r.player_number;
end;
$$;

create or replace function public.admin_assign_player_number(
  p_user_id uuid,
  p_player_number text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_number text;
  v_assigned_user uuid;
  v_rows integer := 0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以分配玩家编号';
  end if;
  if p_user_id is null or p_player_number is null
     or p_player_number !~ '^P[0-9]{3}$' then
    raise exception '玩家账号或玩家编号无效';
  end if;

  select p.player_number into v_existing_number
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    raise exception '玩家账号不存在';
  end if;

  if v_existing_number is not null and v_existing_number <> p_player_number then
    raise exception '该账号已经绑定 %，如需更正请联系数据库管理员处理', v_existing_number;
  end if;

  select r.assigned_user_id into v_assigned_user
  from public.player_registry r
  where r.player_number = p_player_number
  for update;

  if not found then
    raise exception '这个玩家编号不存在';
  end if;

  if v_assigned_user is not null and v_assigned_user <> p_user_id then
    raise exception '这个玩家编号已经绑定到其他账号';
  end if;

  update public.profiles
  set player_number = p_player_number
  where id = p_user_id;

  update public.player_registry
  set assigned_user_id = p_user_id
  where player_number = p_player_number;

  insert into public.card_inventory(user_id, card_id, quantity, updated_at)
  select p_user_id, legacy.card_id, legacy.quantity, now()
  from public.legacy_card_collections legacy
  where legacy.player_number = p_player_number
    and not exists (
      select 1 from public.legacy_collection_imports imported
      where imported.player_number = p_player_number
    )
  on conflict (user_id, card_id) do update
    set quantity = public.card_inventory.quantity + excluded.quantity,
        updated_at = now();

  get diagnostics v_rows = row_count;

  insert into public.legacy_collection_imports(player_number)
  values (p_player_number)
  on conflict (player_number) do nothing;

  return v_rows;
end;
$$;

create table if not exists public.card_inventory_adjustments (
  id bigint generated by default as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id text not null,
  delta integer not null check (delta <> 0),
  reason text not null,
  adjusted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.card_inventory_adjustments enable row level security;
revoke all on public.card_inventory_adjustments from anon, authenticated;

create or replace function public.admin_adjust_card_inventory(
  p_user_id uuid,
  p_card_id text,
  p_delta integer,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_quantity integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以调整玩家收藏';
  end if;
  if p_user_id is null or not exists(select 1 from public.profiles where id = p_user_id) then
    raise exception '玩家账号不存在';
  end if;
  if p_card_id is null or length(trim(p_card_id)) = 0
     or p_delta is null or p_delta = 0
     or p_reason is null or length(trim(p_reason)) = 0 then
    raise exception '卡牌、调整数量和原因均为必填项';
  end if;

  select quantity into v_current
  from public.card_inventory
  where user_id=p_user_id and card_id=trim(p_card_id)
  for update;

  if not found then
    if p_delta < 0 then
      raise exception '库存不足，不能扣除这么多数量';
    end if;
    insert into public.card_inventory(user_id,card_id,quantity,updated_at)
    values(p_user_id,trim(p_card_id),p_delta,now());
    v_quantity := p_delta;
  else
    v_quantity := v_current + p_delta;
    if v_quantity < 0 then
      raise exception '库存不足，不能扣除这么多数量';
    elsif v_quantity = 0 then
      delete from public.card_inventory
      where user_id=p_user_id and card_id=trim(p_card_id);
    else
      update public.card_inventory
      set quantity=v_quantity,updated_at=now()
      where user_id=p_user_id and card_id=trim(p_card_id);
    end if;
  end if;

  insert into public.card_inventory_adjustments(user_id,card_id,delta,reason,adjusted_by)
  values(p_user_id,trim(p_card_id),p_delta,trim(p_reason),auth.uid());

  return v_quantity;
end;
$$

revoke all on function public.admin_list_player_accounts() from public, anon, authenticated;
revoke all on function public.admin_list_player_registry() from public, anon, authenticated;
revoke all on function public.admin_assign_player_number(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_adjust_card_inventory(uuid, text, integer, text) from public, anon, authenticated;

grant execute on function public.admin_list_player_accounts() to authenticated;
grant execute on function public.admin_list_player_registry() to authenticated;
grant execute on function public.admin_assign_player_number(uuid, text) to authenticated;
grant execute on function public.admin_adjust_card_inventory(uuid, text, integer, text) to authenticated;
