-- Admin-only recipient directory for the mail composer.
-- Run once in Supabase SQL Editor after item-workshop-mail-v1.sql.

create or replace function public.admin_list_mail_recipients()
returns table(id uuid, username text, player_number text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '只有管理员可以读取收件人名单';
  end if;

  return query
  select p.id, p.username::text, p.player_number::text
  from public.profiles p
  order by p.username;
end;
$$;

revoke all on function public.admin_list_mail_recipients() from public, anon, authenticated;
grant execute on function public.admin_list_mail_recipients() to authenticated;
