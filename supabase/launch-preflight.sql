-- ACG launch preflight (READ ONLY).
-- Run this before tonight-launch.sql. It does not modify any database object.
-- Send the complete result grid back for review.

with expected(table_name) as (
  values
    ('profiles'),('player_stats'),('token_transactions'),('card_inventory'),
    ('matches'),('match_results'),('achievements'),('player_achievements'),
    ('draw_card_catalog'),('card_draw_pools'),('card_draw_history')
),
table_report as (
  select
    'TABLE'::text as section,
    e.table_name as object_name,
    case
      when c.oid is null then 'MISSING'
      else 'exists; RLS='||c.relrowsecurity||'; FORCE RLS='||c.relforcerowsecurity
    end as details
  from expected e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
),
column_report as (
  select
    'COLUMN'::text as section,
    table_name||'.'||column_name as object_name,
    data_type||case when is_nullable='NO' then '; NOT NULL' else '; nullable' end as details
  from information_schema.columns
  where table_schema='public'
    and (
      (table_name='profiles' and column_name in ('id','username','created_at','is_admin','player_number'))
      or (table_name='card_inventory' and column_name in ('user_id','card_id','quantity','updated_at'))
      or (table_name='player_stats' and column_name in ('user_id','tokens','games_played','wins','losses'))
      or (table_name='matches' and column_name in ('id','created_by','created_at','winning_team'))
      or (table_name='match_results' and column_name in ('match_id','user_id','result','team'))
      or (table_name='achievements' and column_name in ('id','name','description','reward_tokens','is_active','condition_type','threshold','min_games'))
      or (table_name='player_achievements' and column_name in ('user_id','achievement_id'))
      or (table_name='token_transactions' and column_name in ('user_id','amount','reason','created_by'))
    )
),
function_report as (
  select
    'FUNCTION'::text as section,
    'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as object_name,
    case when p.prosecdef then 'SECURITY DEFINER' else 'invoker' end||
      '; owner='||pg_get_userbyid(p.proowner) as details
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('is_admin','admin_register_2v2_match','admin_grant_tokens','draw_one_card','admin_save_achievement')
),
auth_trigger_report as (
  select
    'AUTH_TRIGGER'::text as section,
    t.tgname as object_name,
    pg_get_triggerdef(t.oid)||E'\\nFUNCTION: '||pg_get_functiondef(t.tgfoid) as details
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='auth' and c.relname='users' and not t.tgisinternal
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
union all select * from auth_trigger_report
union all select * from policy_report
union all select * from constraint_report
order by section, object_name;
