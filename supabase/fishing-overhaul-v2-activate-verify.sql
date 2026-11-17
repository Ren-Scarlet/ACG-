-- Read-only verification for the final Fishing V2 activation step.
select
  has_function_privilege(
    'authenticated',
    'public.fishing_start_cast(text,uuid)'::regprocedure,
    'EXECUTE'
  ) as legacy_cast_still_executable,
  has_function_privilege(
    'authenticated',
    'public.fishing_start_cast_v2(text,uuid,text)'::regprocedure,
    'EXECUTE'
  ) as v2_cast_executable,
  has_function_privilege(
    'authenticated',
    'public.fishing_hook_cast_v2(uuid)'::regprocedure,
    'EXECUTE'
  ) as v2_hook_executable,
  has_function_privilege(
    'authenticated',
    'public.fishing_finish_reel_v2(uuid)'::regprocedure,
    'EXECUTE'
  ) as v2_finish_executable;

select product_id,product_name,is_active,stock_sold
from public.fishing_shop_catalog
where product_id in (
  'shop_small_bait_bundle',
  'shop_medium_bait_bundle',
  'shop_large_bait',
  'shop_mystery_bait'
)
order by product_id;

select
  count(*) as v2_available_fish,
  count(*) filter (where is_active) as active_fish,
  count(*) filter (where is_hidden) as hidden_fish
from public.fishing_fish_catalog
where v2_available=true;
