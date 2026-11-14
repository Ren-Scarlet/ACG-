-- ACG Player Center: automatic token rewards for newly unlocked achievements.
-- Run once in Supabase SQL Editor after player-center.sql.
-- Reward amounts intentionally default to 0 until the game economy is finalized.

alter table public.achievements
  add column if not exists reward_tokens bigint not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.achievements'::regclass
      and conname = 'achievements_reward_tokens_nonnegative'
  ) then
    alter table public.achievements
      add constraint achievements_reward_tokens_nonnegative
      check (reward_tokens >= 0);
  end if;
end;
$$;

create or replace function public.award_achievement_tokens()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward bigint;
  v_name text;
begin
  select reward_tokens, name
    into v_reward, v_name
  from public.achievements
  where id = new.achievement_id;

  if coalesce(v_reward, 0) > 0 then
    insert into public.player_stats (user_id, tokens, updated_at)
    values (new.user_id, v_reward, now())
    on conflict (user_id) do update
      set tokens = public.player_stats.tokens + excluded.tokens,
          updated_at = now();

    insert into public.token_transactions (user_id, amount, reason)
    values (new.user_id, v_reward, '成就奖励：' || coalesce(v_name, new.achievement_id));
  end if;

  return new;
end;
$$;

drop trigger if exists player_achievement_token_reward on public.player_achievements;
create trigger player_achievement_token_reward
after insert on public.player_achievements
for each row execute function public.award_achievement_tokens();

revoke all on function public.award_achievement_tokens() from public, anon, authenticated;
