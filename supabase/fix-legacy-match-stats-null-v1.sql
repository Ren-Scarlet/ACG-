-- Fix NULL legacy totals when a player has no imported historical row.
-- Safe to run once or repeatedly. Does not modify match history or player totals directly.

create or replace function public.recalculate_player_stats(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_games bigint;
  v_wins bigint;
  v_losses bigint;
  v_legacy_wins bigint := 0;
  v_legacy_losses bigint := 0;
begin
  -- Scalar subqueries always produce one row; missing legacy data becomes zero.
  select
    coalesce((select h.wins from public.player_legacy_match_totals h where h.user_id = p_user_id), 0),
    coalesce((select h.losses from public.player_legacy_match_totals h where h.user_id = p_user_id), 0)
  into v_legacy_wins, v_legacy_losses;

  select
    count(*)::bigint,
    count(*) filter (where result = 'win')::bigint,
    count(*) filter (where result = 'loss')::bigint
  into v_games, v_wins, v_losses
  from public.match_results
  where user_id = p_user_id;

  v_wins := coalesce(v_wins, 0) + v_legacy_wins;
  v_losses := coalesce(v_losses, 0) + v_legacy_losses;
  v_games := coalesce(v_games, 0) + v_legacy_wins + v_legacy_losses;

  insert into public.player_stats (user_id, games_played, wins, losses, updated_at)
  values (p_user_id, v_games, v_wins, v_losses, now())
  on conflict (user_id) do update
    set games_played = excluded.games_played,
        wins = excluded.wins,
        losses = excluded.losses,
        updated_at = now();
end;
$$;
