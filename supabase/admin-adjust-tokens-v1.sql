-- Administrator token adjustment: positive values grant, negative values deduct.
-- Run once in Supabase SQL Editor. Existing balances and transaction history are preserved.

create or replace function public.admin_adjust_tokens(
  p_user_id uuid,
  p_delta bigint,
  p_reason text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance bigint;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以调整玩家代币';
  end if;

  if p_user_id is null then
    raise exception '请选择玩家';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception '调整数量不能为 0';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 or length(trim(p_reason)) > 120 then
    raise exception '请填写 1–120 个字符的调整原因';
  end if;

  select tokens into v_balance
  from public.player_stats
  where user_id = p_user_id
  for update;

  if not found then
    raise exception '该玩家尚未初始化资料';
  end if;
  if p_delta < 0 and v_balance < abs(p_delta) then
    raise exception '玩家代币不足，当前余额 %，无法扣除 %', v_balance, abs(p_delta);
  end if;
  if p_delta > 0 and v_balance > 9223372036854775807 - p_delta then
    raise exception '代币余额超出可用范围';
  end if;

  update public.player_stats
  set tokens = tokens + p_delta,
      updated_at = now()
  where user_id = p_user_id
  returning tokens into v_balance;

  insert into public.token_transactions(user_id, amount, reason)
  values (
    p_user_id,
    p_delta,
    case when p_delta < 0 then '管理员扣除：' else '管理员发放：' end || trim(p_reason)
  );

  return v_balance;
end;
$$;

revoke all on function public.admin_adjust_tokens(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.admin_adjust_tokens(uuid, bigint, text) to authenticated;
