-- ACG launch preflight (READ ONLY).
-- Run this before tonight-launch.sql. It does not modify any database object.
-- Send the complete result grid back for review.

with expected_tables(table_name) as (
  values
    ('profiles'),('player_stats'),('token_transactions'),('card_inventory'),
    ('matches'),('match_results'),('achievements'),('player_achievements'),
    ('draw_card_catalog'),('card_draw_pools'),('card_draw_history')
),
table_report as (
  select
    'TABLE'::text as section,
    e.table_name as object_name,
    case when c.oid is null then 'MISSING'
      else 'exists; RLS='||c.relrowsecurity||'; FORCE RLS='||c.relforcerowsecurity
    end as details
  from expected_tables e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
),
expected_columns(table_name,column_name,required_now) as (
  values
    ('profiles','id',true),('profiles','username',true),('profiles','created_at',true),('profiles','is_admin',true),('profiles','player_number',false),
    ('card_inventory','user_id',true),('card_inventory','card_id',true),('card_inventory','quantity',true),('card_inventory','updated_at',true),
    ('player_stats','user_id',true),('player_stats','tokens',true),('player_stats','games_played',true),('player_stats','wins',true),('player_stats','losses',true),
    ('matches','id',true),('matches','created_by',true),('matches','created_at',true),('matches','winning_team',false),
    ('match_results','match_id',true),('match_results','user_id',true),('match_results','result',true),('match_results','team',false),
    ('achievements','id',true),('achievements','name',true),('achievements','description',true),('achievements','reward_tokens',true),('achievements','is_active',true),('achievements','condition_type',true),('achievements','threshold',true),('achievements','min_games',true),
    ('player_achievements','user_id',true),('player_achievements','achievement_id',true),
    ('token_transactions','user_id',true),('token_transactions','amount',true),('token_transactions','reason',true)
),
column_report as (
  select
    'COLUMN'::text as section,
    e.table_name||'.'||e.column_name as object_name,
    case when c.column_name is null
      then 'MISSING'||case when e.required_now then ' (required before launch)' else ' (expected from earlier migration)' end
      else c.data_type||case when c.is_nullable='NO' then '; NOT NULL' else '; nullable' end
    end as details
  from expected_columns e
  left join information_schema.columns c
    on c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
),
function_report as (
  select
    'FUNCTION'::text as section,
    'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as object_name,
    case when p.prosecdef then 'SECURITY DEFINER' else 'invoker' end||
      '; owner='||pg_get_userbyid(p.proowner)||chr(10)||pg_get_functiondef(p.oid) as details
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('is_admin','admin_register_2v2_match','admin_grant_tokens','draw_one_card','admin_save_achievement')
),
required_function_report as (
  select
    'FUNCTION'::text as section,
    'public.'||required.required_name as object_name,
    'MISSING: required for launch' as details
  from (values ('is_admin'),('admin_register_2v2_match'),('admin_grant_tokens')) required(required_name)
  where not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=required.required_name
  )
),
auth_trigger_report as (
  select
    'AUTH_TRIGGER'::text as section,
    t.tgname as object_name,
    pg_get_triggerdef(t.oid)||chr(10)||'FUNCTION: '||pg_get_functiondef(t.tgfoid) as details
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='auth' and c.relname='users' and not t.tgisinternal
  union all
  select 'AUTH_TRIGGER','auth.users','MISSING: no user-profile trigger found'
  where not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='auth' and c.relname='users' and not t.tgisinternal
  )
),
policy_report as (
  select
    'POLICY'::text as section,
    tablename||'.'||policyname as object_name,
    'command='||cmd||'; roles='||array_to_string(roles,',')||
      '; using='||coalesce(qual,'<none>')||
      '; check='||coalesce(with_check,'<none>') as details
  from pg_policies
  where schemaname='public'
),
constraint_report as (
  select
    'CONSTRAINT'::text as section,
    conrelid::regclass::text||'.'||conname as object_name,
    pg_get_constraintdef(oid) as details
  from pg_constraint
  where connamespace='public'::regnamespace
    and conrelid::regclass::text in (
      'profiles','card_inventory','player_stats','token_transactions',
      'matches','match_results','achievements','player_achievements'
    )
)
select * from table_report
union all select * from column_report
union all select * from function_report
union all select * from required_function_report
union all select * from auth_trigger_report
union all select * from policy_report
union all select * from constraint_report
order by section, object_name;
