-- Harden Foundations/MSK module isolation at the database leaderboard boundary.
-- Exact module_key checks prevent activity from one module from contributing to the other.

create or replace function public.get_foundations_individual_leaderboard()
returns table (
  rank bigint,
  display_name text,
  cbl_group text,
  questions_answered bigint,
  points bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      qa.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Anonymous Student') as display_name,
      nullif(trim(p.cbl_group), '') as cbl_group,
      count(*)::bigint as questions_answered,
      sum(
        case
          when regexp_replace(lower(coalesce(qa.difficulty, '')), '[^a-z0-9]+', '', 'g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty, '')) like '%intermediate%' then 2
          else 1
        end
      )::bigint as points
    from public.question_attempts qa
    join public.quiz_catalog qc on qc.id = qa.quiz_id
    join public.profiles p on p.id = qa.user_id
    where qa.module_key = 'foundations'
      and qc.module = 'Foundations of Medicine'
    group by qa.user_id, p.display_name, p.cbl_group
  )
  select
    dense_rank() over (order by s.points desc, s.questions_answered desc) as rank,
    s.display_name,
    s.cbl_group,
    s.questions_answered,
    s.points,
    (s.user_id = auth.uid()) as is_current_user
  from scored s
  order by rank, s.display_name;
$$;

create or replace function public.get_foundations_team_leaderboard()
returns table (
  rank bigint,
  team text,
  member_count bigint,
  questions_answered bigint,
  points bigint,
  is_current_team boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with team_members as (
    select trim(p.cbl_group) as team, count(*)::bigint as member_count
    from public.profiles p
    where nullif(trim(p.cbl_group), '') is not null
    group by trim(p.cbl_group)
  ),
  team_scores as (
    select
      trim(p.cbl_group) as team,
      count(*)::bigint as questions_answered,
      sum(
        case
          when regexp_replace(lower(coalesce(qa.difficulty, '')), '[^a-z0-9]+', '', 'g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty, '')) like '%intermediate%' then 2
          else 1
        end
      )::bigint as points
    from public.question_attempts qa
    join public.quiz_catalog qc on qc.id = qa.quiz_id
    join public.profiles p on p.id = qa.user_id
    where qa.module_key = 'foundations'
      and qc.module = 'Foundations of Medicine'
      and nullif(trim(p.cbl_group), '') is not null
    group by trim(p.cbl_group)
  ),
  current_team as (
    select nullif(trim(p.cbl_group), '') as team
    from public.profiles p
    where p.id = auth.uid()
  ),
  combined as (
    select
      tm.team,
      tm.member_count,
      coalesce(ts.questions_answered, 0)::bigint as questions_answered,
      coalesce(ts.points, 0)::bigint as points
    from team_members tm
    left join team_scores ts on ts.team = tm.team
  )
  select
    dense_rank() over (order by c.points desc, c.questions_answered desc) as rank,
    c.team,
    c.member_count,
    c.questions_answered,
    c.points,
    exists(select 1 from current_team ct where ct.team = c.team) as is_current_team
  from combined c
  order by rank, c.team;
$$;

create or replace function public.get_msk_individual_leaderboard()
returns table(
  rank bigint,
  display_name text,
  cbl_group text,
  questions_answered bigint,
  points bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with user_scores as (
    select
      p.id as user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Anonymous Student') as display_name,
      nullif(trim(p.cbl_group), '') as cbl_group,
      count(qa.id)::bigint as questions_answered,
      coalesce(sum(
        case
          when qa.id is null then 0
          when regexp_replace(lower(coalesce(qa.difficulty, '')), '[^a-z0-9]+', '', 'g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty, '')) like '%intermediate%' then 2
          else 1
        end
      ), 0)::bigint as points
    from public.profiles p
    left join public.question_attempts qa
      on qa.user_id = p.id
     and qa.module_key = 'msk'
    group by p.id, p.display_name, p.cbl_group
  )
  select
    dense_rank() over (order by s.points desc, s.questions_answered desc) as rank,
    s.display_name,
    s.cbl_group,
    s.questions_answered,
    s.points,
    (s.user_id = auth.uid()) as is_current_user
  from user_scores s
  order by rank, s.display_name;
$$;

create or replace function public.get_msk_team_leaderboard()
returns table(
  rank bigint,
  team text,
  member_count bigint,
  questions_answered bigint,
  points bigint,
  is_current_team boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with team_members as (
    select
      trim(p.cbl_group) as team,
      count(*)::bigint as member_count
    from public.profiles p
    where nullif(trim(p.cbl_group), '') is not null
    group by trim(p.cbl_group)
  ),
  team_scores as (
    select
      trim(p.cbl_group) as team,
      count(qa.id)::bigint as questions_answered,
      coalesce(sum(
        case
          when qa.id is null then 0
          when regexp_replace(lower(coalesce(qa.difficulty, '')), '[^a-z0-9]+', '', 'g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty, '')) like '%intermediate%' then 2
          else 1
        end
      ), 0)::bigint as points
    from public.profiles p
    left join public.question_attempts qa
      on qa.user_id = p.id
     and qa.module_key = 'msk'
    where nullif(trim(p.cbl_group), '') is not null
    group by trim(p.cbl_group)
  ),
  current_team as (
    select nullif(trim(p.cbl_group), '') as team
    from public.profiles p
    where p.id = auth.uid()
  ),
  combined as (
    select
      tm.team,
      tm.member_count,
      coalesce(ts.questions_answered, 0)::bigint as questions_answered,
      coalesce(ts.points, 0)::bigint as points
    from team_members tm
    left join team_scores ts on ts.team = tm.team
  )
  select
    dense_rank() over (order by c.points desc, c.questions_answered desc) as rank,
    c.team,
    c.member_count,
    c.questions_answered,
    c.points,
    exists(select 1 from current_team ct where ct.team = c.team) as is_current_team
  from combined c
  order by rank, c.team;
$$;

revoke all on function public.get_foundations_individual_leaderboard() from public;
revoke all on function public.get_foundations_individual_leaderboard() from anon;
grant execute on function public.get_foundations_individual_leaderboard() to authenticated;

revoke all on function public.get_foundations_team_leaderboard() from public;
revoke all on function public.get_foundations_team_leaderboard() from anon;
grant execute on function public.get_foundations_team_leaderboard() to authenticated;

revoke all on function public.get_msk_individual_leaderboard() from public;
revoke all on function public.get_msk_individual_leaderboard() from anon;
grant execute on function public.get_msk_individual_leaderboard() to authenticated;

revoke all on function public.get_msk_team_leaderboard() from public;
revoke all on function public.get_msk_team_leaderboard() from anon;
grant execute on function public.get_msk_team_leaderboard() to authenticated;
