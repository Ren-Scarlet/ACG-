-- Read-only preflight for Fishing V2.
-- Run BEFORE the two V2 migrations. This file does not modify anything.

select
  (to_regclass('public.profiles') is not null) as profiles_exists,
  (to_regclass('public.player_stats') is not null) as player_stats_exists,
  (to_regclass('public.card_inventory') is not null) as card_inventory_exists,
  (to_regclass('public.item_catalog') is not null) as item_catalog_exists,
  (to_regclass('public.fishing_bait_catalog') is not null) as fishing_bait_catalog_exists,
  (to_regclass('public.fishing_fish_catalog') is not null) as fishing_fish_catalog_exists,
  (to_regclass('public.player_fishing_bait') is not null) as player_fishing_bait_exists,
  (to_regclass('public.fishing_sessions') is not null) as fishing_sessions_exists,
  (to_regclass('public.fishing_catches') is not null) as fishing_catches_exists,
  (to_regclass('public.player_fishbook') is not null) as player_fishbook_exists,
  (to_regclass('public.fishing_shop_catalog') is not null) as fishing_shop_catalog_exists,
  (to_regclass('public.fishing_craft_history') is not null) as fishing_craft_history_exists,
  (to_regclass('public.fishing_achievements') is not null) as fishing_achievements_exists,
  (to_regclass('public.player_fishing_achievements') is not null) as player_fishing_achievements_exists,
  (to_regclass('public.player_fishing_stats') is not null) as player_fishing_stats_exists,
  (to_regclass('public.fishing_points_ledger') is not null) as fishing_points_ledger_exists,
  (to_regclass('public.draw_card_catalog') is not null) as draw_card_catalog_exists,
  (to_regprocedure('public.is_admin()') is not null) as is_admin_function_exists;

select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'fishing_start_cast',
    'fishing_hook_cast',
    'fishing_finish_reel',
    'fishing_get_dashboard',
    'fishing_craft_bait',
    'fishing_redeem_shop'
  )
order by p.proname,arguments;

select
  bait_id,bait_name,ingredient_count,distinct_ingredients,
  craftable,is_active
from public.fishing_bait_catalog
order by sort_order;

select
  fish_id,bait_id,fish_name,is_active
from public.fishing_fish_catalog
order by sort_order;

select
  count(*) as existing_fish_species,
  count(*) filter (where bait_id='small_mixed_bait') as small_bait_species,
  count(*) filter (where bait_id='medium_mixed_bait') as medium_bait_species,
  count(*) filter (where bait_id='large_mixed_bait') as large_bait_species,
  count(*) filter (where bait_id='unknown_mixed_bait') as special_bait_species
from public.fishing_fish_catalog
where is_active;

select
  count(*) as tree_fruit_catalog_count
from public.draw_card_catalog
where pack_id='pack_010' and enabled=true;

select
  count(*) as existing_player_fishing_profiles,
  coalesce(sum(points),0) as existing_fishing_points,
  coalesce(sum(total_catches),0) as existing_catches
from public.player_fishing_stats;

select
  count(*) as existing_fishbook_rows,
  count(distinct user_id) as players_with_fishbook
from public.player_fishbook;

select
  product_id,product_name,is_active,stock_sold
from public.fishing_shop_catalog
where product_id in (
  'shop_small_bait_bundle',
  'shop_medium_bait_bundle',
  'shop_large_bait',
  'shop_mystery_bait'
)
order by product_id;
