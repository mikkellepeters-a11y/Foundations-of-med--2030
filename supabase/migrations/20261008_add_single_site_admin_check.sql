-- Restrict site admin privileges to the owner's authenticated account.
-- Uses the verified auth identity, not an editable display name or profile row.
create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from auth.users as u
    where u.id = (select auth.uid())
      and lower(u.email) = 'mikkellepeters@gmail.com'
  );
$fn$;
revoke all on function public.is_site_admin() from public;
revoke all on function public.is_site_admin() from anon;
grant execute on function public.is_site_admin() to authenticated;
