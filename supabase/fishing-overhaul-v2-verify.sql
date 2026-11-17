-- Read-only single-result verification for Fishing V2.
-- Run AFTER the V2 install. This is ONE SELECT statement so SQL editors that
-- display only the final result set will still show every verification section.
with
objects as (
  select jsonb_build_object(
    'fish_catalog',to_regclass('public.fishing_fish_catalog'),
    'locations',to_regclass('public.fishing_locations_v2'),
    'weather_slots',to_regclass('public.fishing_weather_slots_v2'),
    'fish_rules',to_regclass('public.fishing_fish_rules_v2'),
    'special_bait_recipe',to_regclass('public.fishing_special_bait_recipe'),
    'player_bait',to_regclass('public.player_fishing_bait'),
    'fishbook',to_regclass('public.player_fishbook'),
    'catches',to_regclass('public.fishing_catches')
  ) as result
),
fish as (
  select jsonb_build_object(
    'total_v2_fish',count(*),
    'hidden_fish',count(*) filter(where is_hidden),
    'fish_missing_size_ranges',count(*) filter(where
      size_small_min_cm is null or size_small_max_cm is null
      or size_medium_min_cm is null or size_medium_max_cm is null
      or size_large_min_cm is null or size_large_max_v2_cm is null)
  ) as result
  from public.fishing_fish_catalog where v2_available
),
locations as (
  select jsonb_build_object('active_locations',count(*)) as result
  from public.fishing_locations_v2 where is_active
),
pools as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.location_id,x.bait_id),'[]'::jsonb) as result
  from (
    select l.location_id,l.location_name,b.bait_id,
      count(*) filter(where cardinality(r.weather_ids)=0
        and cardinality(r.previous_weather_ids)=0
        and r.start_hour_local is null) as all_weather_baseline_fish,
      count(*) filter(where cardinality(r.weather_ids)=0
        and cardinality(r.previous_weather_ids)=0
        and r.start_hour_local is null)>=1 as pool_ready
    from public.fishing_locations_v2 l
    cross join (values ('small_mixed_bait'),('medium_mixed_bait'),('large_mixed_bait')) b(bait_id)
    left join public.fishing_fish_catalog f
      on f.bait_id=b.bait_id and f.v2_available
    left join public.fishing_fish_rules_v2 r
      on r.fish_id=f.fish_id and r.location_id=l.location_id
    where l.is_active
    group by l.location_id,l.location_name,b.bait_id,l.sort_order
  ) x
),
rules as (
  select jsonb_build_object(
    'fish_with_encounter_rules',count(*),
    'active_fish',(select count(*) from public.fishing_fish_catalog where is_active),
    'rules_missing_location',count(*) filter(where r.location_id is null)
  ) as result
  from public.fishing_fish_catalog f
  left join public.fishing_fish_rules_v2 r on r.fish_id=f.fish_id
  where f.v2_available
),
weather as (
  select jsonb_build_object(
    'scheduled_weather_slots',count(*),
    'earliest_slot',min(slot_start),
    'latest_slot',max(slot_start)
  ) as result
  from public.fishing_weather_slots_v2
),
old_baits as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.product_id),'[]'::jsonb) as result
  from (
    select product_id,product_name,is_active,stock_sold
    from public.fishing_shop_catalog
    where product_id in ('shop_small_bait_bundle','shop_medium_bait_bundle','shop_large_bait','shop_mystery_bait')
  ) x
),
stats as (
  select jsonb_build_object(
    'player_fishing_profiles',count(*),
    'total_existing_fishing_points',coalesce(sum(points),0),
    'total_existing_catches',coalesce(sum(total_catches),0)
  ) as result
  from public.player_fishing_stats
),
catch_rows as (
  select jsonb_build_object(
    'existing_catch_records',count(*),
    'players_with_catches',count(distinct user_id)
  ) as result from public.fishing_catches
),
book_rows as (
  select jsonb_build_object(
    'existing_fishbook_entries',count(*),
    'players_with_fishbook',count(distinct user_id),
    'fishbook_rows_with_record_reward_baseline',count(*) filter(where record_reward_size_cm is not null)
  ) as result from public.player_fishbook
),
rpcs as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.proname,x.arguments),'[]'::jsonb) as result
  from (
    select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'fishing_start_cast_v2','fishing_hook_cast_v2','fishing_finish_reel_v2',
      'fishing_get_records_v2','fishing_get_world_state_v2',
      'fishing_craft_special_bait','fishing_admin_grant_special_bait'
    )
  ) x
)
select 'objects' as section,result from objects
union all select 'fish' ,result from fish
union all select 'locations',result from locations
union all select 'bait_location_pools',result from pools
union all select 'encounter_rules',result from rules
union all select 'weather_schedule',result from weather
union all select 'legacy_bait_shop_status',result from old_baits
union all select 'existing_player_fishing_stats',result from stats
union all select 'existing_catches',result from catch_rows
union all select 'existing_fishbook',result from book_rows
union all select 'v2_rpc_functions',result from rpcs;
