-- ACG Fishing V2 engine
-- Apply AFTER fishing-overhaul-v2.sql.
-- Additive and isolated to fishing tables/RPCs plus three dedicated item_catalog rows.
-- Existing player balances, inventory, catches, fishbook and redemption history are retained.

begin;

do $engine_preflight$
begin
  if to_regclass('public.fishing_fish_rules_v2') is null
     or to_regclass('public.fishing_sessions') is null
     or to_regclass('public.player_stats') is null
     or to_regclass('public.player_fishing_bait') is null
     or to_regclass('public.fishing_craft_history') is null
     or to_regclass('public.item_catalog') is null
     or to_regclass('public.card_inventory') is null
     or to_regclass('public.fishing_achievements') is null
     or to_regclass('public.player_fishing_achievements') is null
     or to_regclass('public.player_fishing_stats') is null
     or to_regclass('public.fishing_catches') is null
     or to_regclass('public.player_fishbook') is null
     or to_regclass('public.fishing_points_ledger') is null
     or to_regclass('public.profiles') is null
     or to_regprocedure('public.is_admin()') is null then
    raise exception 'Fishing V2 engine prerequisite missing. Apply the documented fishing and item-workshop migrations first; no V2 engine changes were applied.';
  end if;
end
$engine_preflight$;

alter table public.fishing_fish_rules_v2
  add column if not exists size_shift_to_large numeric(5,2) not null default 0
    check(size_shift_to_large between -20 and 20);

-- Weather-favored species shift a small part of the size roll toward large fish.
-- Every identifier below exists in the V2 catalogue; the old draft contained
-- several placeholder IDs that silently matched no fish.
update public.fishing_fish_rules_v2 set size_shift_to_large=5
where fish_id in ('amber_loach','reed_whisker','rainbell_fish','ironback_sturgeon','whitewater_salmon');
update public.fishing_fish_rules_v2 set size_shift_to_large=10
where fish_id in ('stormscale_pike','thunder_crown_eel','ichigaya_fish_king_king','old_lake_dragon');
update public.fishing_fish_rules_v2 set size_shift_to_large=5
where fish_id in ('rare_treasure_trout','mistfin_trout','peerless_crucian',
                  'ichigaya_fish_king','fog_veil_koi','abyssal_manta','aurora_ray');
update public.fishing_fish_rules_v2 set size_shift_to_large=5
where fish_id in ('cobalt_tuna','whitewater_salmon');

alter table public.fishing_sessions
  add column if not exists weather_size_shift numeric(5,2) not null default 0,
  add column if not exists location_id text not null default 'qinglan_lake',
  add column if not exists weather_id text not null default 'sunny',
  add column if not exists reel_phase_offset numeric(8,6) not null default 0,
  add column if not exists action_score integer,
  add column if not exists base_points integer not null default 0,
  add column if not exists is_first_discovery boolean not null default false,
  add column if not exists is_size_record boolean not null default false;

alter table public.player_fishbook
  add column if not exists record_reward_size_cm numeric(7,2);
update public.player_fishbook
set record_reward_size_cm=best_size_cm
where record_reward_size_cm is null and best_size_cm is not null;

alter table public.fishing_catches
  add column if not exists action_score integer,
  add column if not exists weather_id text,
  add column if not exists location_id text,
  add column if not exists is_first_discovery boolean not null default false,
  add column if not exists is_size_record boolean not null default false;

alter table public.fishing_achievements
  add column if not exists reward_bait_id text references public.fishing_bait_catalog(bait_id),
  add column if not exists reward_bait_quantity integer not null default 0;

-- Do not expose undiscovered hidden fish through the direct catalogue query.
drop policy if exists fishing_fish_catalog_read on public.fishing_fish_catalog;
create policy fishing_fish_catalog_read on public.fishing_fish_catalog
 for select to authenticated
 using (
   ((is_active or v2_available) and not is_hidden)
   or public.is_admin()
   or exists (
     select 1 from public.player_fishbook b
     where b.user_id=auth.uid() and b.fish_id=fishing_fish_catalog.fish_id
   )
 );

-- Rare materials are normal inventory items, so existing mail/event/admin
-- reward workflows can grant them without touching the card collection.
insert into public.item_catalog
 (item_id,name,icon,description,category,effect_type,effect_config,is_active)
values
 ('fishing_ancient_scale','古代鱼鳞','🐉','调配特殊鱼饵的稀有材料。','important','none','{}'::jsonb,true),
 ('fishing_moon_pearl','月光珍珠','🌙','调配特殊鱼饵的稀有材料。','important','none','{}'::jsonb,true),
 ('fishing_storm_core','风暴核心','⚡','调配特殊鱼饵的稀有材料。','important','none','{}'::jsonb,true)
on conflict(item_id) do update set
 name=excluded.name,icon=excluded.icon,description=excluded.description,
 category=excluded.category,effect_type='none',effect_config='{}'::jsonb,
 is_active=true,updated_at=now();

create table if not exists public.fishing_special_bait_recipe (
 material_item_id text primary key references public.item_catalog(item_id),
 quantity integer not null check(quantity>0)
);
insert into public.fishing_special_bait_recipe(material_item_id,quantity)
values ('fishing_ancient_scale',1),('fishing_moon_pearl',1),('fishing_storm_core',1)
on conflict(material_item_id) do update set quantity=excluded.quantity;

alter table public.fishing_special_bait_recipe enable row level security;
revoke all on public.fishing_special_bait_recipe from public,anon,authenticated;

-- Craft one special bait from three distinct rare materials. Serialized by the
-- player's existing stats row and idempotent by request id.
create or replace function public.fishing_craft_special_bait(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $engine_fn_1$
declare
 v_user uuid:=auth.uid();
 v_material record;
 v_qty integer;
 v_balance integer;
 v_existing public.fishing_craft_history%rowtype;
begin
 if v_user is null then raise exception '请先登录'; end if;
 if p_request_id is null then raise exception '合成请求编号缺失'; end if;
 perform 1 from public.player_stats where user_id=v_user for update;
 if not found then raise exception '玩家资料尚未初始化'; end if;

 select * into v_existing from public.fishing_craft_history
 where user_id=v_user and request_id=p_request_id;
 if found then
   if v_existing.bait_id<>'unknown_mixed_bait' then
     raise exception '该请求编号已用于其他合成';
   end if;
   select quantity into v_balance from public.player_fishing_bait
   where user_id=v_user and bait_id='unknown_mixed_bait';
   return jsonb_build_object('bait_id','unknown_mixed_bait','quantity',v_existing.quantity,
     'bait_balance',coalesce(v_balance,0),'duplicate_request',true);
 end if;

 for v_material in
   select material_item_id,quantity from public.fishing_special_bait_recipe
   order by material_item_id
 loop
   select quantity into v_qty from public.card_inventory
   where user_id=v_user and card_id=v_material.material_item_id for update;
   if not found or v_qty<v_material.quantity then
     raise exception '特殊鱼饵材料不足：%',v_material.material_item_id;
   end if;
 end loop;

 for v_material in
   select material_item_id,quantity from public.fishing_special_bait_recipe
   order by material_item_id
 loop
   delete from public.card_inventory
   where user_id=v_user and card_id=v_material.material_item_id
     and quantity=v_material.quantity;
   if not found then
     update public.card_inventory
     set quantity=quantity-v_material.quantity,updated_at=now()
     where user_id=v_user and card_id=v_material.material_item_id
       and quantity>v_material.quantity;
   end if;
 end loop;

 insert into public.player_fishing_bait(user_id,bait_id,quantity,updated_at)
 values(v_user,'unknown_mixed_bait',1,now())
 on conflict(user_id,bait_id) do update
 set quantity=public.player_fishing_bait.quantity+1,updated_at=now()
 returning quantity into v_balance;

 insert into public.fishing_craft_history(user_id,request_id,bait_id,ingredients,quantity)
 select v_user,p_request_id,'unknown_mixed_bait',
   array_agg(material_item_id order by material_item_id),1
 from public.fishing_special_bait_recipe;

 return jsonb_build_object('bait_id','unknown_mixed_bait','quantity',1,
   'bait_balance',v_balance,'duplicate_request',false);
end;
$engine_fn_1$;

-- Achievement reward hook: special bait is granted once, in the same transaction
-- that unlocks the achievement. Event/admin rewards use the RPC below.
create or replace function public.fishing_grant_achievement_bait()
returns trigger
language plpgsql
security definer
set search_path=''
as $engine_fn_2$
declare v_bait text; v_amount integer;
begin
 select reward_bait_id,reward_bait_quantity into v_bait,v_amount
 from public.fishing_achievements where achievement_id=new.achievement_id;
 if v_bait is not null and v_amount>0 then
   insert into public.player_fishing_bait(user_id,bait_id,quantity,updated_at)
   values(new.user_id,v_bait,v_amount,now())
   on conflict(user_id,bait_id) do update
   set quantity=public.player_fishing_bait.quantity+excluded.quantity,
       updated_at=now();
 end if;
 return new;
end;
$engine_fn_2$;
drop trigger if exists fishing_achievement_bait_reward on public.player_fishing_achievements;
create trigger fishing_achievement_bait_reward
after insert on public.player_fishing_achievements
for each row execute function public.fishing_grant_achievement_bait();

insert into public.fishing_achievements
 (achievement_id,name,description,condition_type,threshold,fish_id,reward_points,
  reward_bait_id,reward_bait_quantity,is_active,sort_order)
values
 ('fish_20','鱼群学者','在鱼类图鉴中发现 20 种不同的鱼。','distinct_fish',20,null,250,null,0,true,80),
 ('fish_30','水域博物家','在鱼类图鉴中发现 30 种不同的鱼。','distinct_fish',30,null,500,null,0,true,81),
 ('fish_36','全域钓鱼名人','发现全部 36 种鱼类，包含隐藏鱼。','distinct_fish',36,null,1000,null,0,true,82),
 ('hidden_discovery_1','神秘鱼讯','首次发现一条隐藏鱼种，获得 1 个特殊鱼饵。','specific_fish',1,'rainbow_phantom',0,'unknown_mixed_bait',1,true,90),
 ('hidden_discovery_2','深水秘藏','发现深水中的传说鱼种，获得 2 个特殊鱼饵。','specific_fish',1,'old_lake_dragon',0,'unknown_mixed_bait',2,true,91)
on conflict(achievement_id) do update set
 name=excluded.name,description=excluded.description,condition_type=excluded.condition_type,
 threshold=excluded.threshold,fish_id=excluded.fish_id,reward_points=excluded.reward_points,
 reward_bait_id=excluded.reward_bait_id,reward_bait_quantity=excluded.reward_bait_quantity,
 is_active=true,sort_order=excluded.sort_order;

update public.fishing_achievements
set description='在鱼类图鉴中发现 10 种不同的鱼。'
where achievement_id='fish_10';

-- Keep an audit trail for event/admin special-bait grants.
create table if not exists public.fishing_special_bait_grants (
 id bigint generated by default as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 granted_by uuid not null references public.profiles(id),
 quantity integer not null check(quantity between 1 and 20),
 reason text not null,
 created_at timestamptz not null default now()
);
create index if not exists fishing_special_bait_grants_user_idx
 on public.fishing_special_bait_grants(user_id,created_at desc);
alter table public.fishing_special_bait_grants enable row level security;
revoke all on public.fishing_special_bait_grants from public,anon,authenticated;

create or replace function public.fishing_admin_grant_special_bait(
 p_user_id uuid,p_quantity integer,p_reason text
)
returns integer
language plpgsql
security definer
set search_path=''
as $engine_fn_3$
declare v_balance integer;
begin
 if auth.uid() is null or not public.is_admin() then
   raise exception '只有管理员可以发放活动鱼饵';
 end if;
 if p_user_id is null or p_quantity is null or p_quantity not between 1 and 20
    or nullif(btrim(p_reason),'') is null then
   raise exception '发放参数无效';
 end if;
 insert into public.player_fishing_bait(user_id,bait_id,quantity,updated_at)
 values(p_user_id,'unknown_mixed_bait',p_quantity,now())
 on conflict(user_id,bait_id) do update
 set quantity=public.player_fishing_bait.quantity+excluded.quantity,updated_at=now()
 returning quantity into v_balance;

 insert into public.fishing_special_bait_grants(user_id,granted_by,quantity,reason)
 values(p_user_id,auth.uid(),p_quantity,btrim(p_reason));
 return v_balance;
end;
$engine_fn_3$;

-- Server-side cast. Every eligible fish must satisfy its location, weather,
-- previous-weather, local-time and prerequisite-fish conditions.
create or replace function public.fishing_start_cast_v2(
 p_bait_id text,p_request_id uuid,p_location_id text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $engine_fn_4$
declare
 v_user uuid:=auth.uid();
 v_existing public.fishing_sessions%rowtype;
 v_bait public.fishing_bait_catalog%rowtype;
 v_fish public.fishing_fish_catalog%rowtype;
 v_world jsonb;
 v_weather text;
 v_previous text;
 v_location text;
 v_hour integer;
 v_bait_qty integer;
 v_session public.fishing_sessions%rowtype;
 v_weather_shift numeric(5,2):=0;
begin
 if v_user is null then raise exception '请先登录'; end if;
 if p_request_id is null then raise exception '抛竿请求编号缺失'; end if;
 v_location:=coalesce(nullif(p_location_id,''),'qinglan_lake');
 if not exists(select 1 from public.fishing_locations_v2
   where location_id=v_location and is_active) then
   raise exception '钓点不存在或暂未开放';
 end if;

 perform 1 from public.player_stats where user_id=v_user for update;
 if not found then raise exception '玩家资料尚未初始化'; end if;

 update public.fishing_sessions
 set status='escaped',resolved_at=clock_timestamp()
 where user_id=v_user and status='waiting'
   and created_at<clock_timestamp()-interval '10 minutes';

 select * into v_existing from public.fishing_sessions
 where user_id=v_user and request_id=p_request_id;
 if found then
   if v_existing.bait_id<>p_bait_id or v_existing.location_id<>v_location then
     raise exception '请求编号已用于其他钓鱼操作';
   end if;
   return jsonb_build_object('session_id',v_existing.id,'status',v_existing.status,
     'bite_after_ms',v_existing.bite_after_ms,'duplicate_request',true);
 end if;

 select * into v_bait from public.fishing_bait_catalog
 where bait_id=p_bait_id and is_active=true;
 if not found then raise exception '鱼饵不存在或已停用'; end if;

 select quantity into v_bait_qty from public.player_fishing_bait
 where user_id=v_user and bait_id=p_bait_id for update;
 if not found or v_bait_qty<1 then raise exception '鱼饵数量不足'; end if;

 v_world:=public.fishing_get_world_state_v2();
 v_weather:=v_world->>'weather_id';
 v_previous:=v_world->>'previous_weather_id';
 v_hour:=extract(hour from (clock_timestamp() at time zone 'Asia/Shanghai'))::integer;

 select f,r.size_shift_to_large into v_fish,v_weather_shift
 from public.fishing_fish_catalog f
 join public.fishing_fish_rules_v2 r on r.fish_id=f.fish_id
 where f.v2_available and f.bait_id=p_bait_id
   and r.location_id=v_location
   and (cardinality(r.weather_ids)=0 or v_weather=any(r.weather_ids))
   and (cardinality(r.previous_weather_ids)=0 or v_previous=any(r.previous_weather_ids))
   and (
     r.start_hour_local is null
     or (r.end_hour_local is null and v_hour=r.start_hour_local)
     or (r.start_hour_local<=r.end_hour_local and v_hour between r.start_hour_local and r.end_hour_local)
     or (r.start_hour_local>r.end_hour_local and
         (v_hour>=r.start_hour_local or v_hour<=r.end_hour_local))
   )
   and (r.required_fish_id is null or exists(
     select 1 from public.player_fishbook b
     where b.user_id=v_user and b.fish_id=r.required_fish_id
   ))
 order by (-ln(greatest(random(),0.000001)) /
   greatest(f.appearance_weight*r.catch_weight,0.0001))
 limit 1;

 if not found then
   raise exception '当前钓点与天气下没有这种鱼饵对应的鱼讯，请换个钓点或等待天气变化';
 end if;

 if v_bait_qty=1 then
   delete from public.player_fishing_bait
   where user_id=v_user and bait_id=p_bait_id;
 else
   update public.player_fishing_bait
   set quantity=quantity-1,updated_at=now()
   where user_id=v_user and bait_id=p_bait_id;
 end if;

 insert into public.fishing_sessions
  (user_id,request_id,bait_id,fish_id,size_tier,size_cm,points_awarded,
   bite_after_ms,location_id,weather_id,base_points,weather_size_shift)
 values(v_user,p_request_id,p_bait_id,v_fish.fish_id,'small',null,0,
   1800+floor(random()*4200)::integer,v_location,v_weather,0,v_weather_shift)
 returning * into v_session;

 return jsonb_build_object(
   'session_id',v_session.id,'status',v_session.status,
   'bite_after_ms',v_session.bite_after_ms,'duplicate_request',false,
   'weather',v_world,'location_id',v_location,
   'fish_hint',case when v_fish.is_hidden then '鱼线另一端传来奇异的震动……' else null end
 );
end;
$engine_fn_4$;

-- A random server-signed phase offset is stored on the session. The browser may
-- animate it for feedback, but cannot submit a score or a catch result.
create or replace function public.fishing_hook_cast_v2(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $engine_fn_5$
declare
 v_user uuid:=auth.uid();
 v_session public.fishing_sessions%rowtype;
 v_now timestamptz;
 v_bite_at timestamptz;
 v_started timestamptz;
 v_elapsed integer;
 v_offset numeric;
begin
 if v_user is null then raise exception '请先登录'; end if;
 if p_session_id is null then raise exception '钓鱼记录编号缺失'; end if;
 select * into v_session from public.fishing_sessions
 where id=p_session_id and user_id=v_user for update;
 if not found then raise exception '找不到这次钓鱼记录'; end if;
 if v_session.status<>'waiting' then
   return jsonb_build_object('status',v_session.status,'duplicate_request',true);
 end if;
 v_now:=clock_timestamp();
 v_bite_at:=v_session.created_at+(v_session.bite_after_ms::text||' milliseconds')::interval;
 if v_now<v_bite_at then raise exception '鱼还没有咬钩，请稍等片刻再提竿'; end if;
 if v_now>v_bite_at+interval '12 seconds' then
   update public.fishing_sessions set status='escaped',resolved_at=v_now
   where id=p_session_id;
   return jsonb_build_object('status','escaped','duplicate_request',false);
 end if;
 if v_session.reel_started_at is null then
   v_offset:=random();
   update public.fishing_sessions
   set reel_started_at=v_now,reel_phase_offset=v_offset
   where id=p_session_id returning reel_started_at,reel_phase_offset
   into v_started,v_offset;
 else
   v_started:=v_session.reel_started_at;
   v_offset:=v_session.reel_phase_offset;
 end if;
 v_elapsed:=greatest(0,floor(extract(epoch from (v_now-v_started))*1000)::integer);
 return jsonb_build_object('status','reeling','reel_duration_ms',3000,
   'reel_elapsed_ms',v_elapsed,'phase_offset',v_offset,
   'zone_start_pct',30,'zone_width_pct',40,
   'duplicate_request',v_session.reel_started_at is not null);
end;
$engine_fn_5$;

-- The server calculates score and size; no client-supplied score or success flag.
create or replace function public.fishing_finish_reel_v2(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $engine_fn_6$
declare
 v_user uuid:=auth.uid();
 v_session public.fishing_sessions%rowtype;
 v_fish public.fishing_fish_catalog%rowtype;
 v_best numeric(7,2);
 v_first boolean;
 v_record boolean;
 v_elapsed integer;
 v_phase numeric;
 v_needle numeric;
 v_score integer;
 v_small numeric;
 v_medium numeric;
 v_large numeric;
 v_roll numeric;
 v_tier text;
 v_min numeric;
 v_max numeric;
 v_size numeric(7,2);
 v_base integer;
 v_skill numeric;
 v_transfer numeric;
 v_multiplier numeric;
 v_award integer;
 v_distinct integer;
begin
 if v_user is null then raise exception '请先登录'; end if;
 if p_session_id is null then raise exception '钓鱼记录编号缺失'; end if;
 select * into v_session from public.fishing_sessions
 where id=p_session_id and user_id=v_user for update;
 if not found then raise exception '找不到这次钓鱼记录'; end if;
 if v_session.status='escaped' then
   return jsonb_build_object('status','escaped','duplicate_request',true);
 elsif v_session.status='caught' then
   select * into v_fish from public.fishing_fish_catalog where fish_id=v_session.fish_id;
   return jsonb_build_object(
     'status','caught','fish_id',v_session.fish_id,'fish_name',v_fish.fish_name,
     'size_tier',v_session.size_tier,'size_cm',v_session.size_cm,
     'size_label',v_session.size_cm||' cm（'||case v_session.size_tier
       when 'small' then '小型' when 'medium' then '中型' else '大型' end||'）',
     'points_awarded',v_session.points_awarded,'base_points',v_session.base_points,
     'action_score',v_session.action_score,
     'is_first_discovery',v_session.is_first_discovery,
     'is_size_record',v_session.is_size_record,
     'weather_id',v_session.weather_id,'location_id',v_session.location_id,
     'duplicate_request',true
   );
 end if;
 if v_session.reel_started_at is null then raise exception '请先完成提竿'; end if;

 v_elapsed:=greatest(0,floor(extract(epoch from
   (clock_timestamp()-v_session.reel_started_at))*1000)::integer);
 v_phase:=mod(v_elapsed,3000)::numeric/3000;
 v_phase:=mod(v_phase+v_session.reel_phase_offset,1);
 v_needle:=case when v_phase<0.5 then v_phase*200 else (1-v_phase)*200 end;
 v_score:=greatest(0,least(100,round(100-abs(v_needle-50)*2)::integer));

 if v_score<60 then
   update public.fishing_sessions
   set status='escaped',action_score=v_score,resolved_at=clock_timestamp()
   where id=p_session_id;
   return jsonb_build_object('status','escaped','action_score',v_score,'duplicate_request',false);
 end if;

 select * into v_fish from public.fishing_fish_catalog
 where fish_id=v_session.fish_id;
 if not found then raise exception '鱼类资料不存在，无法结算'; end if;

 case v_session.bait_id
  when 'small_mixed_bait' then v_small:=70;v_medium:=25;v_large:=5;
  when 'medium_mixed_bait' then v_small:=40;v_medium:=45;v_large:=15;
  when 'large_mixed_bait' then v_small:=20;v_medium:=50;v_large:=30;
  else v_small:=10;v_medium:=45;v_large:=45;
 end case;
 -- Weather can move up to ten percentage points from small to large catches.
 v_small:=v_small-v_session.weather_size_shift;
 v_large:=v_large+v_session.weather_size_shift;

 v_skill:=case when v_score>=98 then 0.05 when v_score>=90 then 0.04
               when v_score>=75 then 0.02 else 0 end;
 if v_score>=98 then
   v_transfer:=least(v_small,25);v_small:=v_small-v_transfer;v_large:=v_large+v_transfer;
 elsif v_score>=90 then
   v_transfer:=least(v_small,15);v_small:=v_small-v_transfer;v_large:=v_large+v_transfer;
 elsif v_score>=75 then
   v_transfer:=least(v_small,10);v_small:=v_small-v_transfer;v_medium:=v_medium+v_transfer;
 end if;
 if round(v_small+v_medium+v_large,2)<>100
    or least(v_small,v_medium,v_large)<0 then
   raise exception '尺寸概率配置错误';
 end if;

 v_roll:=random()*100;
 if v_roll<v_small then v_tier:='small';
 elsif v_roll<v_small+v_medium then v_tier:='medium';
 else v_tier:='large'; end if;

 if v_tier='small' then
   v_min:=coalesce(v_fish.size_small_min_cm,v_fish.small_max_cm);
   v_max:=coalesce(v_fish.size_small_max_cm,v_fish.small_max_cm);
   v_base:=v_fish.small_points;
 elsif v_tier='medium' then
   v_min:=coalesce(v_fish.size_medium_min_cm,v_fish.medium_cm);
   v_max:=coalesce(v_fish.size_medium_max_cm,v_fish.medium_cm);
   v_base:=v_fish.medium_points;
 else
   v_min:=coalesce(v_fish.size_large_min_cm,v_fish.large_min_cm);
   v_max:=coalesce(v_fish.size_large_max_v2_cm,v_fish.large_max_cm,v_fish.large_min_cm);
   v_base:=v_fish.large_points;
 end if;
 if v_min is null or v_max is null or v_max<v_min then
   raise exception '鱼类尺寸区间配置错误：%',v_fish.fish_id;
 end if;
 v_size:=round((v_min+random()*(v_max-v_min))::numeric,2);

 select record_reward_size_cm into v_best from public.player_fishbook
 where user_id=v_user and fish_id=v_fish.fish_id for update;
 v_first:=not found;
 v_record:=not v_first and
   (v_best is null or v_size>=v_best+greatest(1,v_best*0.05));
 v_multiplier:=case when v_first then 3 when v_record then 2 else 0.2 end;
 v_award:=greatest(0,floor(v_base*v_multiplier*(1+v_skill))::integer);

 update public.fishing_sessions
 set status='caught',size_tier=v_tier,size_cm=v_size,base_points=v_base,
     points_awarded=v_award,action_score=v_score,
     is_first_discovery=v_first,is_size_record=v_record,
     resolved_at=clock_timestamp()
 where id=p_session_id;

 insert into public.fishing_catches
  (user_id,fish_id,bait_id,size_tier,size_cm,points_awarded,action_score,
   weather_id,location_id,is_first_discovery,is_size_record)
 values(v_user,v_fish.fish_id,v_session.bait_id,v_tier,v_size,v_award,v_score,
   v_session.weather_id,v_session.location_id,v_first,v_record);

 insert into public.player_fishbook(user_id,fish_id,catch_count,best_size_cm,best_points,record_reward_size_cm)
 values(v_user,v_fish.fish_id,1,v_size,v_award,v_size)
 on conflict(user_id,fish_id) do update set
   catch_count=public.player_fishbook.catch_count+1,
   best_size_cm=greatest(coalesce(public.player_fishbook.best_size_cm,0),excluded.best_size_cm),
   record_reward_size_cm=case when v_record then excluded.best_size_cm
     else coalesce(public.player_fishbook.record_reward_size_cm,excluded.best_size_cm) end,
   best_points=greatest(public.player_fishbook.best_points,excluded.best_points);

 insert into public.player_fishing_stats(user_id,points,total_catches,largest_fish_cm,updated_at)
 values(v_user,v_award,1,v_size,clock_timestamp())
 on conflict(user_id) do update set
   points=public.player_fishing_stats.points+excluded.points,
   total_catches=public.player_fishing_stats.total_catches+1,
   largest_fish_cm=greatest(coalesce(public.player_fishing_stats.largest_fish_cm,0),excluded.largest_fish_cm),
   updated_at=clock_timestamp();

 insert into public.fishing_points_ledger(user_id,amount,reason)
 values(v_user,v_award,
   case when v_first then '首次发现：' when v_record then '尺寸纪录：' else '重复钓获：' end||v_fish.fish_name);

 select count(*) into v_distinct from public.player_fishbook where user_id=v_user;
 update public.player_fishing_stats set distinct_fish=v_distinct where user_id=v_user;

 insert into public.player_fishing_achievements(user_id,achievement_id)
 select v_user,a.achievement_id from public.fishing_achievements a
 where a.is_active and (
   (a.condition_type='catches' and
     (select total_catches from public.player_fishing_stats where user_id=v_user)>=a.threshold)
   or (a.condition_type='points' and
     (select points from public.player_fishing_stats where user_id=v_user)>=a.threshold)
   or (a.condition_type='distinct_fish' and v_distinct>=a.threshold)
   or (a.condition_type='large_fish' and v_tier='large' and a.threshold<=1)
   or (a.condition_type='specific_fish' and a.fish_id=v_fish.fish_id)
 ) on conflict(user_id,achievement_id) do nothing;

 return jsonb_build_object(
   'status','caught','fish_id',v_fish.fish_id,'fish_name',v_fish.fish_name,
   'size_tier',v_tier,'size_cm',v_size,
   'size_label',v_size||' cm（'||case v_tier when 'small' then '小型'
     when 'medium' then '中型' else '大型' end||'）',
   'points_awarded',v_award,'base_points',v_base,'action_score',v_score,
   'is_first_discovery',v_first,'is_size_record',v_record,
   'weather_id',v_session.weather_id,'location_id',v_session.location_id,
   'duplicate_request',false
 );
end;
$engine_fn_6$;

-- Global record values are aggregated server-side; no player IDs are exposed.
create or replace function public.fishing_get_records_v2()
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
 v_user uuid:=auth.uid();
 v_records jsonb;
begin
 if v_user is null then raise exception '请先登录'; end if;
 select coalesce(jsonb_agg(record_row order by record_row->>'fish_id'),'[]'::jsonb)
 into v_records
 from (
   select jsonb_build_object(
     'fish_id',c.fish_id,
     'global_best_size_cm',max(c.size_cm),
     'record_catches',count(*)
   ) as record_row
   from public.fishing_catches c
   join public.fishing_fish_catalog f on f.fish_id=c.fish_id
   where c.size_cm is not null
     and (not f.is_hidden or exists(
       select 1 from public.player_fishbook b
       where b.user_id=v_user and b.fish_id=f.fish_id
     ))
   group by c.fish_id
 ) records;
 return v_records;
end;
$function$;

-- The existing dashboard signature and keys are preserved. Weather/forecast and
-- location data are fetched through fishing_get_world_state_v2().
-- Legacy V1 cast and bait-shop entry points stay enabled during the staged rollout.
-- They are disabled only by fishing-overhaul-v2-activate.sql after the V2 page is live.

revoke all on function public.fishing_craft_special_bait(uuid) from public,anon,authenticated;
revoke all on function public.fishing_start_cast_v2(text,uuid,text) from public,anon,authenticated;
revoke all on function public.fishing_hook_cast_v2(uuid) from public,anon,authenticated;
revoke all on function public.fishing_finish_reel_v2(uuid) from public,anon,authenticated;
revoke all on function public.fishing_get_world_state_v2() from public,anon,authenticated;
revoke all on function public.fishing_get_records_v2() from public,anon,authenticated;
revoke all on function public.fishing_craft_special_bait(uuid) from public,anon,authenticated;
revoke all on function public.fishing_admin_grant_special_bait(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.fishing_craft_special_bait(uuid) to authenticated;
grant execute on function public.fishing_start_cast_v2(text,uuid,text) to authenticated;
grant execute on function public.fishing_hook_cast_v2(uuid) to authenticated;
grant execute on function public.fishing_finish_reel_v2(uuid) to authenticated;
grant execute on function public.fishing_get_world_state_v2() to authenticated;
grant execute on function public.fishing_get_records_v2() to authenticated;
grant execute on function public.fishing_admin_grant_special_bait(uuid,integer,text) to authenticated;

commit;
