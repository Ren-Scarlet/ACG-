-- Add the populated Landorus pack (pack_005) to the draw system.
-- Safe/idempotent: only upserts this pack's catalog entries and its pool metadata.
-- Existing prices, rates, enabled state, player balances, inventory and history are preserved.

insert into public.draw_card_catalog(card_id,pack_id,rarity,is_alt,enabled)
values
  ('card_048','pack_005',3,false),
  ('card_049','pack_005',3,true),
  ('card_050','pack_005',3,false),
  ('card_051','pack_005',4,false),
  ('card_052','pack_005',4,true),
  ('card_053','pack_005',4,false),
  ('card_054','pack_005',4,true),
  ('card_055','pack_005',4,false),
  ('card_056','pack_005',4,false),
  ('card_057','pack_005',5,false),
  ('card_058','pack_005',5,false)
on conflict(card_id) do update
set pack_id=excluded.pack_id,
    rarity=excluded.rarity,
    is_alt=excluded.is_alt,
    enabled=true;

insert into public.card_draw_pools(pack_id,pack_name)
values ('pack_005','土地云')
on conflict(pack_id) do update
set pack_name=excluded.pack_name;
