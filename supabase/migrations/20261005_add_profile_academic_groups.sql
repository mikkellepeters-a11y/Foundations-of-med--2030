alter table public.profiles
  add column if not exists anatomy_table text,
  add column if not exists pcl_group text,
  add column if not exists house text;

create or replace function public.get_my_group_members()
returns table(
  group_type text,
  group_value text,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select id, anatomy_table, pcl_group, house
    from public.profiles
    where id = auth.uid()
  )
  select
    'anatomy_table'::text as group_type,
    trim(me.anatomy_table)::text as group_value,
    coalesce(nullif(trim(p.display_name), ''), 'MegaHub User')::text as display_name
  from me
  join public.profiles p
    on p.id <> me.id
   and nullif(trim(me.anatomy_table), '') is not null
   and lower(trim(p.anatomy_table)) = lower(trim(me.anatomy_table))
  where nullif(trim(p.anatomy_table), '') is not null

  union all

  select
    'pcl_group'::text,
    trim(me.pcl_group)::text,
    coalesce(nullif(trim(p.display_name), ''), 'MegaHub User')::text
  from me
  join public.profiles p
    on p.id <> me.id
   and nullif(trim(me.pcl_group), '') is not null
   and lower(trim(p.pcl_group)) = lower(trim(me.pcl_group))
  where nullif(trim(p.pcl_group), '') is not null

  union all

  select
    'house'::text,
    trim(me.house)::text,
    coalesce(nullif(trim(p.display_name), ''), 'MegaHub User')::text
  from me
  join public.profiles p
    on p.id <> me.id
   and nullif(trim(me.house), '') is not null
   and lower(trim(p.house)) = lower(trim(me.house))
  where nullif(trim(p.house), '') is not null

  order by group_type, display_name;
$$;

revoke all on function public.get_my_group_members() from public;
grant execute on function public.get_my_group_members() to authenticated;
