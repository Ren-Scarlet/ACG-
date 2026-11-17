-- Fishing V2 permission hotfix
-- The fish catalogue RLS policy checks whether the authenticated user has
-- discovered a fish. Grant SELECT while the existing own-row RLS policy
-- (player_fishbook_own_read) continues to restrict visible rows to auth.uid().
begin;
grant select on public.player_fishbook to authenticated;
commit;
