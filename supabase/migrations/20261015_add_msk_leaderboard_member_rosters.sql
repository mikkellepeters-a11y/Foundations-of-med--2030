-- Minimal, authenticated-only group rosters for leaderboard hover details.
-- Shares display names only (no email, ID or contact information).
create or replace function public.get_msk_leaderboard_group_members()
returns table(group_type text,group_value text,members text[])
language sql stable security definer set search_path=public
as $$
with memberships as (
 select 'team'::text as kind, trim(cbl_group) as label, lower(trim(cbl_group)) as key, coalesce(nullif(trim(display_name),''),'Anonymous Student') as student
 from public.profiles where nullif(trim(cbl_group),'') is not null
 union all
 select 'house',trim(house),lower(trim(house)),coalesce(nullif(trim(display_name),''),'Anonymous Student')
 from public.profiles where nullif(trim(house),'') is not null
 union all
 select 'anatomy',trim(anatomy_table),lower(trim(anatomy_table)),coalesce(nullif(trim(display_name),''),'Anonymous Student')
 from public.profiles where nullif(trim(anatomy_table),'') is not null
)
select kind,min(label)::text,array_agg(student order by lower(student),student)::text[]
from memberships
group by kind,key
order by kind,min(label);
$$;
revoke all on function public.get_msk_leaderboard_group_members() from public;
revoke execute on function public.get_msk_leaderboard_group_members() from anon;
grant execute on function public.get_msk_leaderboard_group_members() to authenticated;