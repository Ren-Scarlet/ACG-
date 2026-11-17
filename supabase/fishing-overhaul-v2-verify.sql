-- Read-only verification for Fishing V2. Run AFTER both V2 migrations.
-- Every statement is SELECT-only and does not modify player data.

select
  to_regclass('public.fishing_fish_catalog') as fish_catalog,
  to_regclass('public.fishing_locations_v2') as locations,
  to_regclass('public.fishing_weather_slots_v2') as weather_slots,
  to_regclass('public.fishing_fish_rules_v2') as fish_rules,
  to_regclass('public.fishing_special_bait_recipe') as special_bait_recipe,
  to_regclass('public.player_fishing_bait') as player_bait,
  to_regclass('public.player_fishbook') as fishbook,
  to_regclass('public.fishing_catches') as catches;

select
  count(*) as total_active_fish,
  count(*) filter (where is_hidden) as hidden_fish,
  count(*) filter (where size_small_min_cm is null
    or size_small_max_cm is null
    or size_medium_min_cm is null
    or size_medium_max_cm is null
    or size_large_min_cm is null
    or size_large_max_v2_cm is null) as fish_missing_size_ranges
from public.fishing_fish_catalog
where is_active;

select
  count(*) as active_locations
from public.fishing_locations_v2
where is_active;

-- Every ordinary bait must have at least one all-weather fish at each location.
-- This prevents a weather roll from making an entire bait unusable at a chosen spot.
select
  l.location_id,
  l.location_name,
  f.bait_id,
  count(*) filter (
    where cardinality(r.weather_ids)=0
      and cardinality(r.previous_weather_ids)=0
      and r.start_hour_local is null
  ) as all_weather_baseline_fish,
  count(*) filter (
    where cardinality(r.weather_ids)=0
      and cardinality(r.previous_weather_ids)=0
      and r.start_hour_local is null
  ) >= 1 as pool_ready
from public.fishing_locations_v2 l
cross join (values
  ('small_mixed_bait'),('medium_mixed_bait'),('large_mixed_bait')
) as b(bait_id)
left join public.fishing_fish_catalog f
  on f.bait_id=b.bait_id and f.is_active
left join public.fishing_fish_rules_v2 r
  on r.fish_id=f.fish_id and r.location_id=l.location_id
where l.is_active
group by l.location_id,l.location_name,f.bait_id,b.bait_id
order by l.sort_order,b.bait_id;

select
  count(*) as fish_with_encounter_rules,
  (select count(*) from public.fishing_fish_catalog where is_active) as active_fish,
  count(*) filter (where r.location_id is null) as rules_missing_location
from public.fishing_fish_catalog f
left join public.fishing_fish_rules_v2 r on r.fish_id=f.fish_id
where f.is_active;

select
  count(*) as scheduled_weather_slots,
  min(slot_start) as earliest_slot,
  max(slot_start) as latest_slot
from public.fishing_weather_slots_v2;

select
  product_id,
  product_name,
  is_active,
  stock_sold
from public.fishing_shop_catalog
where product_id in (
  'shop_small_bait_bundle',
  'shop_medium_bait_bundle',
  'shop_large_bait',
  'shop_mystery_bait'
)
order by product_id;

select
  count(*) as player_fishing_profiles,
  coalesce(sum(points),0) as total_existing_fishing_points,
  coalesce(sum(total_catches),0) as total_existing_catches
from public.player_fishing_stats;

select
  count(*) as existing_catch_records,
  count(distinct user_id) as players_with_catches
from public.fishing_catches;

select
  count(*) as existing_fishbook_entries,
  count(distinct user_id) as players_with_fishbook
from public.player_fishbook;

select
  count(*) filter (where record_reward_size_cm is not null) as fishbook_rows_with_record_reward_baseline,
  count(*) as total_fishbook_rows
from public.player_fishbook;

select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'fishing_start_cast_v2',
    'fishing_hook_cast_v2',
    'fishing_finish_reel_v2',
    'fishing_get_records_v2',
    'fishing_get_world_state_v2',
    'fishing_craft_special_bait',
    'fishing_admin_grant_special_bait'
  )
order by p.proname,arguments;
