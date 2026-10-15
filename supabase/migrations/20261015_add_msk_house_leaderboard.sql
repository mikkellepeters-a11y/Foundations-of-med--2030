-- MSK House leaderboard: participation points grouped by profile.house.
-- Run this migration in Supabase SQL editor before using the House tab.
create or replace function public.get_msk_house_leaderboard()
returns table(
  rank bigint,
  house text,
  member_count bigint,
  questions_answered bigint,
  points bigint,
  is_current_house boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      lower(trim(p.house)) as house_key,
      min(trim(p.house)) as house_label,
      count(distinct p.id)::bigint as member_count,
      count(qa.id)::bigint as questions_answered,
      coalesce(sum(
        case
          when qa.id is null then 0
          when regexp_replace(lower(coalesce(qa.difficulty,'')), '[^a-z0-9]+','','g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty,'')) like '%intermediate%' then 2
          else 1
        end
      ),0)::bigint as points
    from public.profiles p
    left join public.question_attempts qa
      on qa.user_id = p.id
     and lower(coalesce(qa.module_key,'')) in ('msk','musculoskeletal-skin','musculoskeletal_skin','musculoskeletal skin')
    where nullif(trim(p.house),'') is not null
    group by lower(trim(p.house))
  ), my_house as (
    select lower(trim(house)) as house_key from public.profiles where id = auth.uid()
  )
  select
    dense_rank() over (order by s.points desc, s.questions_answered desc) as rank,
    s.house_label::text as house,
    s.member_count,
    s.questions_answered,
    s.points,
    exists(select 1 from my_house m where m.house_key=s.house_key) as is_current_house
  from scored s
  order by rank, s.house_label;
$$;
revoke all on function public.get_msk_house_leaderboard() from public;
revoke execute on function public.get_msk_house_leaderboard() from anon;
grant execute on function public.get_msk_house_leaderboard() to authenticated;
