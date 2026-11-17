-- ACG Fishing V2 active-session recovery patch.
-- Apply AFTER fishing-overhaul-v2-engine.sql on an already installed V2 database.
-- This patch only adds a caller-scoped read RPC; it does not alter fish, bait, points or catches.

begin;

create or replace function public.fishing_get_active_session_v2()
returns jsonb
language plpgsql
security definer
set search_path=''
as $active_session_v2$
declare
 v_user uuid:=auth.uid();
 v_session public.fishing_sessions%rowtype;
 v_now timestamptz;
 v_bite_at timestamptz;
 v_elapsed integer;
begin
 if v_user is null then raise exception '请先登录'; end if;
 select * into v_session
 from public.fishing_sessions
 where user_id=v_user and status='waiting'
 order by created_at desc
 limit 1;
 if not found then return jsonb_build_object('active',false); end if;

 v_now:=clock_timestamp();
 v_bite_at:=v_session.created_at+
   (v_session.bite_after_ms::text||' milliseconds')::interval;

 if v_session.reel_started_at is null and v_now>v_bite_at+interval '12 seconds' then
   update public.fishing_sessions
   set status='escaped',resolved_at=v_now
   where id=v_session.id and user_id=v_user and status='waiting';
   return jsonb_build_object('active',false,'expired',true,'status','escaped');
 end if;
 if v_session.reel_started_at is not null
    and v_session.reel_started_at<v_now-interval '60 seconds' then
   update public.fishing_sessions
   set status='escaped',resolved_at=v_now
   where id=v_session.id and user_id=v_user and status='waiting';
   return jsonb_build_object('active',false,'expired',true,'status','escaped');
 end if;

 v_elapsed:=case when v_session.reel_started_at is null then 0
   else greatest(0,floor(extract(epoch from (v_now-v_session.reel_started_at))*1000)::integer)
   end;
 return jsonb_build_object(
   'active',true,
   'session_id',v_session.id,
   'status',v_session.status,
   'bite_after_ms',v_session.bite_after_ms,
   'bite_remaining_ms',greatest(0,floor(extract(epoch from (v_bite_at-v_now))*1000)::integer),
   'reel_started',v_session.reel_started_at is not null,
   'reel_elapsed_ms',v_elapsed,
   'phase_offset',v_session.reel_phase_offset,
   'reel_duration_ms',3000,
   'zone_start_pct',30,
   'zone_width_pct',40
 );
end;
$active_session_v2$;

revoke all on function public.fishing_get_active_session_v2() from public,anon,authenticated;
grant execute on function public.fishing_get_active_session_v2() to authenticated;

commit;
