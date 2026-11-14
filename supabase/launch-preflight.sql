-- ACG launch preflight: compact, READ-ONLY report.
-- Run this in Supabase SQL Editor. It returns ONE ROW / ONE CELL (report).
-- Copy the report cell and send it back. No database objects or data are changed.

with expected_tables(table_name) as (
  values
    ('profiles'),('player_stats'),('token_transactions'),('card_inventory'),
    ('matches'),('match_results'),('achievements'),('player_achievements'),
    ('draw_card_catalog'),('card_draw_pools'),('card_draw_history')
),
expected_columns(table_name,column_name) as (
  values
    ('profiles','id'),('profiles','username'),('profiles','created_at'),('profiles','is_admin'),
    ('card_inventory','user_id'),('card_inventory','card_id'),('card_inventory','quantity'),
    ('player_stats','user_id'),('player_stats','tokens'),('player_stats','games_played'),
    ('player_stats','wins'),('player_stats','losses'),
    ('matches','id'),('matches','created_by'),('matches','created_at'),
    ('match_results','match_id'),('match_results','user_id'),('match_results','result'),
    ('achievements','id'),('achievements','name'),('achievements','description'),
    ('achievements','reward_tokens'),('achievements','is_active'),('achievements','condition_type'),
    ('achievements','threshold'),('achievements','min_games'),
    ('player_achievements','user_id'),('player_achievements','achievement_id'),
    ('token_transactions','user_id'),('token_transactions','amount'),('token_transactions','reason')
),
table_status as (
  select e.table_name,
         c.oid is not null as exists,
         coalesce(c.relrowsecurity,false) as rls_enabled,
         coalesce(c.relforcerowsecurity,false) as force_rls
  from expected_tables e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
),
missing_columns as (
  select e.table_name||'.'||e.column_name as column_name
  from expected_columns e
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
  )
),
function_status as (
  select required.function_name,
         exists (
           select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname=required.function_name
         ) as exists
  from (values
    ('is_admin'),('admin_register_2v2_match'),('admin_grant_tokens'),
    ('draw_one_card'),('admin_save_achievement')
  ) required(function_name)
),
auth_triggers as (
  select jsonb_agg(jsonb_build_object(
    'trigger',t.tgname,
    'function',p.proname
  ) order by t.tgname) as items
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  join pg_proc p on p.oid=t.tgfoid
  where n.nspname='auth' and c.relname='users' and not t.tgisinternal
),
policy_counts as (
  select tablename,count(*)::int as policies
  from pg_policies
  where schemaname='public'
  group by tablename
)
select jsonb_pretty(jsonb_build_object(
  'tables', (select jsonb_agg(jsonb_build_object(
      'name',table_name,'exists',exists,'RLS',rls_enabled,'force_RLS',force_rls
    ) order by table_name) from table_status),
  'missing_required_columns', coalesce((select jsonb_agg(column_name order by column_name) from missing_columns),'[]'::jsonb),
  'functions', (select jsonb_object_agg(function_name,exists order by function_name) from function_status),
  'auth_user_triggers', coalesce((select items from auth_triggers),'[]'::jsonb),
  'policy_counts_by_table', coalesce((
    select jsonb_object_agg(tablename,policies order by tablename) from policy_counts
  ),'{}'::jsonb)
)) as report;
