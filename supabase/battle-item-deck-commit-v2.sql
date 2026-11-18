-- Battle item rarity + tree fruit deck commitment V2. Apply in Supabase SQL Editor.
alter table public.battle_item_catalog add column if not exists item_class text not null default 'normal';
alter table public.battle_item_catalog drop constraint if exists battle_item_catalog_item_class_check;
alter table public.battle_item_catalog add constraint battle_item_catalog_item_class_check check(item_class in ('normal','important'));
create or replace function public.admin_sync_battle_item_catalog_v2(p_items jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
 if auth.uid() is null or not public.is_admin() then raise exception '只有管理员可以同步对战道具目录'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception '对战道具目录格式错误'; end if;
 if exists(select 1 from jsonb_to_recordset(p_items) x(card_id text,card_name text,item_class text) where coalesce(x.card_id,'')='' or coalesce(x.card_name,'')='' or coalesce(x.item_class,'normal') not in ('normal','important')) then raise exception '对战道具目录包含无效资料'; end if;
 insert into public.battle_item_catalog(card_id,card_name,item_class,enabled,updated_at) select x.card_id,x.card_name,coalesce(x.item_class,'normal'),true,now() from jsonb_to_recordset(p_items) x(card_id text,card_name text,item_class text) on conflict(card_id) do update set card_name=excluded.card_name,item_class=excluded.item_class,enabled=true,updated_at=now();
 update public.battle_item_catalog set enabled=false,updated_at=now() where card_id not in(select x.card_id from jsonb_to_recordset(p_items) x(card_id text,card_name text,item_class text));
 get diagnostics v_count=row_count; return v_count;
end; $$;
create or replace function public.commit_battle_item_deck_v2(p_request_id uuid,p_item_cards jsonb,p_berry_cards jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();v_all jsonb;v_old jsonb;v_item record;v_qty integer;v_bt integer;v_it integer;v_berry integer;
begin
 if v_user_id is null then raise exception '请先登录';end if;if p_request_id is null then raise exception '缺少提交编号';end if;
 if p_item_cards is null or jsonb_typeof(p_item_cards)<>'array' or p_berry_cards is null or jsonb_typeof(p_berry_cards)<>'array' then raise exception '构筑道具数据格式错误';end if;
 v_all:=p_item_cards||p_berry_cards;
 select coalesce(sum(quantity),0) into v_bt from jsonb_to_recordset(p_item_cards) x(card_id text,quantity integer);
 select coalesce(sum(quantity),0) into v_berry from jsonb_to_recordset(p_berry_cards) x(card_id text,quantity integer);
 if v_bt>3 then raise exception '普通与贵重对战道具合计最多构筑 3 个';end if;if v_berry>1 then raise exception '树果最多构筑 1 个';end if;
 perform 1 from public.profiles where id=v_user_id for update;
 select item_cards into v_old from public.battle_item_deck_commits where user_id=v_user_id and request_id=p_request_id;
 if found then if v_old<>v_all then raise exception '提交编号已用于另一套构筑';end if;return jsonb_build_object('committed',true,'duplicate_request',true,'items',v_old);end if;
 if exists(select 1 from jsonb_to_recordset(v_all) x(card_id text,quantity integer) where coalesce(card_id,'')='' or quantity is null or quantity<1) then raise exception '道具数量或编号无效';end if;
 if exists(select 1 from jsonb_to_recordset(v_all) x(card_id text,quantity integer) group by card_id having count(*)>1) then raise exception '道具数据有重复项目';end if;
 select coalesce(sum(x.quantity),0) into v_it from jsonb_to_recordset(p_item_cards) x(card_id text,quantity integer) join public.battle_item_catalog c on c.card_id=x.card_id and c.enabled where c.item_class='important';
 if v_it>1 then raise exception '贵重对战道具最多构筑 1 个';end if;
 for v_item in select x.card_id,x.quantity,c.item_class from jsonb_to_recordset(p_item_cards) x(card_id text,quantity integer) left join public.battle_item_catalog c on c.card_id=x.card_id and c.enabled order by x.card_id loop
  if v_item.item_class is null then raise exception '无效对战道具：%',v_item.card_id;end if;
  select quantity into v_qty from public.card_inventory where user_id=v_user_id and card_id=v_item.card_id for update;
  if not found or v_qty<v_item.quantity then raise exception '对战道具库存不足：%',v_item.card_id;end if;
 end loop;
 if exists(select 1 from jsonb_to_recordset(p_berry_cards) x(card_id text,quantity integer) left join public.draw_card_catalog d on d.card_id=x.card_id left join public.card_draw_pools p on p.pack_id=d.pack_id and p.draw_mode='uniform' where p.pack_id is null) then raise exception '构筑列表包含非树果卡牌';end if;
 for v_item in select x.card_id,x.quantity from jsonb_to_recordset(p_berry_cards) x(card_id text,quantity integer) order by x.card_id loop select quantity into v_qty from public.card_inventory where user_id=v_user_id and card_id=v_item.card_id for update;if not found or v_qty<v_item.quantity then raise exception '树果库存不足：%',v_item.card_id;end if;end loop;
 for v_item in select x.card_id,x.quantity from jsonb_to_recordset(p_item_cards) x(card_id text,quantity integer) join public.battle_item_catalog c on c.card_id=x.card_id and c.enabled and c.item_class='normal' order by x.card_id loop
  delete from public.card_inventory where user_id=v_user_id and card_id=v_item.card_id and quantity=v_item.quantity;
  update public.card_inventory set quantity=quantity-v_item.quantity,updated_at=now() where user_id=v_user_id and card_id=v_item.card_id and quantity>v_item.quantity;
 end loop;
 for v_item in select x.card_id,x.quantity from jsonb_to_recordset(p_berry_cards) x(card_id text,quantity integer) order by x.card_id loop
  delete from public.card_inventory where user_id=v_user_id and card_id=v_item.card_id and quantity=v_item.quantity;
  update public.card_inventory set quantity=quantity-v_item.quantity,updated_at=now() where user_id=v_user_id and card_id=v_item.card_id and quantity>v_item.quantity;
 end loop;
 insert into public.battle_item_deck_commits(user_id,request_id,item_cards) values(v_user_id,p_request_id,v_all);
 return jsonb_build_object('committed',true,'duplicate_request',false,'items',v_all);
end; $$;
revoke all on function public.admin_sync_battle_item_catalog_v2(jsonb) from public,anon,authenticated;
grant execute on function public.admin_sync_battle_item_catalog_v2(jsonb) to authenticated;
revoke all on function public.commit_battle_item_deck_v2(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.commit_battle_item_deck_v2(uuid,jsonb,jsonb) to authenticated;
