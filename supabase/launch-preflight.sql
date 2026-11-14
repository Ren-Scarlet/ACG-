-- ACG launch preflight: READ-ONLY database posture report.
-- Safe to run after migrations; this query does not modify tables, data, or policies.
-- Returns one row with a JSON report.

with expected_tables(table_name) as (
  values
    ('profiles'),('player_stats'),('token_transactions'),('card_inventory'),
    ('matches'),('match_results'),('achievements'),('player_achievements'),
    ('draw_card_catalog'),('card_draw_pools'),('card_draw_history'),
    ('player_registry'),('legacy_card_collections'),('legacy_collection_imports'),
    ('card_inventory_adjustments'),('battle_item_catalog'),('battle_item_deck_commits')
),
expected_columns(table_name,column_name) as (
  values
    ('profiles','id'),('profiles','username'),('profiles','created_at'),
    ('profiles','is_admin'),('profiles','player_number'),
    ('profiles','selected_title'),('profiles','selected_badges'),
    ('card_inventory','user_id'),('card_inventory','card_id'),
    ('card_inventory','quantity'),('card_inventory','updated_at'),
    ('player_stats','user_id'),('player_stats','tokens'),
    ('player_stats','games_played'),('player_stats','wins'),
    ('player_stats','losses'),('player_stats','updated_at'),
    ('matches','id'),('matches','created_by'),('matches','created_at'),
    ('matches','winning_team'),
    ('match_results','match_id'),('match_results','user_id'),
    ('match_results','result'),('match_results','team'),
    ('achievements','id'),('achievements','name'),('achievements','description'),
    ('achievements','reward_tokens'),('achievements','is_active'),
    ('achievements','condition_type'),('achievements','threshold'),
    ('achievements','min_games'),
    ('player_achievements','user_id'),('player_achievements','achievement_id'),
    ('token_transactions','user_id'),('token_transactions','amount'),
    ('token_transactions','reason'),
    ('player_registry','player_number'),('player_registry','display_name'),
    ('player_registry','assigned_user_id'),
    ('legacy_card_collections','player_number'),('legacy_card_collections','card_id'),
    ('legacy_card_collections','quantity'),
    ('legacy_collection_imports','player_number'),('legacy_collection_imports','imported_at'),
    ('card_inventory_adjustments','user_id'),('card_inventory_adjustments','card_id'),
    ('card_inventory_adjustments','delta'),('card_inventory_adjustments','reason'),
    ('card_inventory_adjustments','adjusted_by'),
    ('battle_item_catalog','card_id'),('battle_item_catalog','card_name'),
    ('battle_item_catalog','enabled'),
    ('battle_item_deck_commits','user_id'),('battle_item_deck_commits','request_id'),
    ('battle_item_deck_commits','item_cards')
),
table_status as (
  select e.table_name,
         c.oid is not null as object_exists,
         coalesce(c.relrowsecurity,false) as rls_enabled,
         coalesce(c.relforcerowsecurity,false) as force_rls
  from expected_tables e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c
    on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
),
missing_columns as (
  select e.table_name||'.'||e.column_name as column_name
  from expected_columns e
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public'
      and c.table_name=e.table_name
      and c.column_name=e.column_name
  )
),
function_status as (
  select required.function_name,
         exists (
           select 1
           from pg_proc p
           join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname=required.function_name
         ) as function_exists
  from (values
    ('is_admin'),
    ('admin_list_player_accounts'),
    ('admin_list_player_registry'),
    ('admin_assign_player_number'),
    ('admin_adjust_card_inventory'),
    ('admin_sync_battle_item_catalog'),
    ('commit_battle_item_deck'),
    ('admin_register_2v2_match'),
    ('admin_correct_2v2_match'),
    ('admin_grant_tokens'),
    ('draw_one_card'),
    ('admin_save_achievement'),
    ('save_profile_display')
  ) required(function_name)
),
auth_triggers as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'trigger',t.tgname,
    'function',p.proname
  ) order by t.tgname),'[]'::jsonb) as items
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  join pg_proc p on p.oid=t.tgfoid
  where n.nspname='auth' and c.relname='users' and not t.tgisinternal
),
policy_report as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table',tablename,
    'policy',policyname,
    'command',cmd,
    'roles',roles,
    'using',qual,
    'with_check',with_check
  ) order by tablename,policyname),'[]'::jsonb) as items
  from pg_policies
  where schemaname='public'
)
select jsonb_pretty(jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object(
      'name',table_name,
      'exists',object_exists,
      'RLS_enabled',rls_enabled,
      'force_RLS',force_rls
    ) order by table_name)
    from table_status
  ),
  'missing_required_columns',
    coalesce((select jsonb_agg(column_name order by column_name) from missing_columns),'[]'::jsonb),
  'functions', (
    select jsonb_object_agg(function_name,function_exists order by function_name)
    from function_status
  ),
  'auth_users_triggers', (select items from auth_triggers),
  'public_policies', (select items from policy_report)
)) as report;
