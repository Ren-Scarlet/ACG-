-- Final activation step for Fishing V2.
-- Run ONLY AFTER the V2 frontend has been deployed and its smoke tests pass.
-- This short finalizer closes the legacy unlimited-bait purchase/cast entry points.
begin;

-- The old hook/finish functions are intentionally retained so V1 sessions that
-- were already in progress can finish; only new V1 casts are blocked.
revoke all on function public.fishing_start_cast(text,uuid)
  from public,anon,authenticated;

-- Preserve purchase/redemption history and existing bait inventories.
update public.fishing_shop_catalog
set is_active=false
where product_id in (
  'shop_small_bait_bundle',
  'shop_medium_bait_bundle',
  'shop_large_bait',
  'shop_mystery_bait'
);

commit;
