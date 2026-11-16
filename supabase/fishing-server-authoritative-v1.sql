-- Server-authoritative hook and reel timing for Fishing System v1.
-- Apply after fishing-system-v1.sql. Client-supplied success flags and scores
-- are no longer accepted; the database clock determines the outcome.

alter table public.fishing_sessions
  add column if not exists reel_started_at timestamptz;

create or replace function public.fishing_hook_cast(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.fishing_sessions%rowtype;
  v_now timestamptz;
  v_bite_at timestamptz;
  v_started timestamptz;
  v_elapsed integer;
begin
  if v_user is null then raise exception '请先登录'; end if;
  if p_session_id is null then raise exception '钓鱼记录编号缺失'; end if;

  select * into v_session from public.fishing_sessions
  where id=p_session_id and user_id=v_user for update;
  if not found then raise exception '找不到这次钓鱼记录'; end if;

  if v_session.status<>'waiting' then
    return jsonb_build_object('status',v_session.status,'duplicate_request',true);
  end if;

  v_now:=clock_timestamp();
  v_bite_at:=v_session.created_at+(v_session.bite_after_ms::text||' milliseconds')::interval;

  if v_now<v_bite_at then
    raise exception '鱼还没有咬钩，请稍等片刻再提竿';
  end if;

  -- Give normal browser/network latency a generous reaction window.
  if v_now>v_bite_at+interval '12 seconds' then
    update public.fishing_sessions set status='escaped',resolved_at=v_now
    where id=p_session_id;
    return jsonb_build_object('status','escaped','duplicate_request',false);
  end if;

  if v_session.reel_started_at is null then
    update public.fishing_sessions set reel_started_at=v_now
    where id=p_session_id returning reel_started_at into v_started;
  else
    v_started:=v_session.reel_started_at;
  end if;

  v_elapsed:=greatest(0,floor(extract(epoch from (v_now-v_started))*1000)::integer);
  return jsonb_build_object(
    'status','reeling',
    'reel_duration_ms',1700,
    'reel_elapsed_ms',v_elapsed,
    'zone_start_pct',40,
    'zone_width_pct',20,
    'duplicate_request',v_session.reel_started_at is not null
  );
end;
$$;

create or replace function public.fishing_finish_reel(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid:=auth.uid();
  v_session public.fishing_sessions%rowtype;
  v_fish public.fishing_fish_catalog%rowtype;
  v_distinct integer;
  v_elapsed_ms integer;
  v_phase numeric;
  v_needle numeric;
  v_score integer;
  v_caught boolean;
begin
  if v_user is null then raise exception '请先登录'; end if;
  if p_session_id is null then raise exception '钓鱼记录编号缺失'; end if;

  select * into v_session from public.fishing_sessions
  where id=p_session_id and user_id=v_user for update;
  if not found then raise exception '找不到这次钓鱼记录'; end if;

  if v_session.status<>'waiting' then
    return jsonb_build_object('status',v_session.status,'duplicate_request',true);
  end if;
  if v_session.reel_started_at is null then
    raise exception '请先完成提竿';
  end if;

  -- The database clock, not a client-provided boolean or score, decides where
  -- the moving needle is when the finish request reaches the server.
  v_elapsed_ms:=greatest(0,floor(extract(epoch from (clock_timestamp()-v_session.reel_started_at))*1000)::integer);
  v_phase:=mod(v_elapsed_ms,1700)::numeric/1700;
  v_needle:=case when v_phase<0.5 then v_phase*200 else (1-v_phase)*200 end;
  v_score:=greatest(0,least(100,round(100-abs(v_needle-50)*2)::integer));
  v_caught:=v_needle between 40 and 60;

  if not v_caught then
    update public.fishing_sessions set status='escaped',resolved_at=clock_timestamp()
    where id=p_session_id;
    return jsonb_build_object('status','escaped','action_score',v_score,'duplicate_request',false);
  end if;

  select * into v_fish from public.fishing_fish_catalog where fish_id=v_session.fish_id;
  if not found then raise exception '鱼类资料不存在，无法结算'; end if;

  update public.fishing_sessions set status='caught',resolved_at=clock_timestamp()
  where id=p_session_id;

  insert into public.fishing_catches(user_id,fish_id,bait_id,size_tier,size_cm,points_awarded)
  values(v_user,v_session.fish_id,v_session.bait_id,v_session.size_tier,
    v_session.size_cm,v_session.points_awarded);

  insert into public.player_fishbook(user_id,fish_id,catch_count,best_size_cm,best_points)
  values(v_user,v_session.fish_id,1,v_session.size_cm,v_session.points_awarded)
  on conflict(user_id,fish_id) do update set
    catch_count=public.player_fishbook.catch_count+1,
    best_size_cm=case
      when excluded.best_size_cm is null then public.player_fishbook.best_size_cm
      when public.player_fishbook.best_size_cm is null then excluded.best_size_cm
      else greatest(public.player_fishbook.best_size_cm,excluded.best_size_cm) end,
    best_points=greatest(public.player_fishbook.best_points,excluded.best_points);

  insert into public.player_fishing_stats(user_id,points,total_catches,largest_fish_cm,updated_at)
  values(v_user,v_session.points_awarded,1,v_session.size_cm,clock_timestamp())
  on conflict(user_id) do update set
    points=public.player_fishing_stats.points+excluded.points,
    total_catches=public.player_fishing_stats.total_catches+1,
    largest_fish_cm=case
      when excluded.largest_fish_cm is null then public.player_fishing_stats.largest_fish_cm
      when public.player_fishing_stats.largest_fish_cm is null then excluded.largest_fish_cm
      else greatest(public.player_fishing_stats.largest_fish_cm,excluded.largest_fish_cm) end,
    updated_at=clock_timestamp();

  insert into public.fishing_points_ledger(user_id,amount,reason)
  values(v_user,v_session.points_awarded,'钓获：'||v_fish.fish_name);

  select count(*) into v_distinct from public.player_fishbook where user_id=v_user;
  update public.player_fishing_stats set distinct_fish=v_distinct where user_id=v_user;

  insert into public.player_fishing_achievements(user_id,achievement_id)
  select v_user,a.achievement_id from public.fishing_achievements a
  where a.is_active and (
    (a.condition_type='catches' and (select total_catches from public.player_fishing_stats where user_id=v_user)>=a.threshold)
    or (a.condition_type='points' and (select points from public.player_fishing_stats where user_id=v_user)>=a.threshold)
    or (a.condition_type='distinct_fish' and v_distinct>=a.threshold)
    or (a.condition_type='large_fish' and v_session.size_tier='large' and a.threshold<=1)
    or (a.condition_type='specific_fish' and a.fish_id=v_session.fish_id)
  ) on conflict(user_id,achievement_id) do nothing;

  return jsonb_build_object(
    'status','caught',
    'fish_id',v_session.fish_id,
    'fish_name',v_fish.fish_name,
    'size_tier',v_session.size_tier,
    'size_cm',v_session.size_cm,
    'size_label',case
      when v_session.size_tier='small' then '≤'||v_fish.small_max_cm||'cm'
      when v_session.size_tier='medium' and v_session.size_cm is not null then v_session.size_cm||'cm'
      when v_session.size_tier='medium' then v_fish.medium_cm||'cm'
      else '≥'||v_fish.large_min_cm||'cm' end,
    'points_awarded',v_session.points_awarded,
    'action_score',v_score,
    'duplicate_request',false
  );
end;
$$;

-- Disable the old insecure RPC signature permanently for authenticated clients.
revoke all on function public.fishing_resolve_cast(uuid,boolean,integer) from public,anon,authenticated;
revoke all on function public.fishing_hook_cast(uuid) from public,anon,authenticated;
revoke all on function public.fishing_finish_reel(uuid) from public,anon,authenticated;
grant execute on function public.fishing_hook_cast(uuid) to authenticated;
grant execute on function public.fishing_finish_reel(uuid) to authenticated;
