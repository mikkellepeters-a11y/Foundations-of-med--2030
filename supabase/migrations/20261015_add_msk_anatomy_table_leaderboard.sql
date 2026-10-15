-- Anatomy Table competition in the MSK module.
-- Include only explicitly identifiable anatomy attempts; unlabeled subjects are excluded.
create or replace function public.get_msk_anatomy_table_leaderboard()
returns table (
  rank bigint,
  anatomy_table text,
  member_count bigint,
  questions_answered bigint,
  points bigint,
  is_current_table boolean
)
language sql stable security definer set search_path = public
as $$
with labeled as (
 select qa.*,
  lower(coalesce(qa.topic,'')) as topic_label,
  lower(coalesce(qa.quiz_id,'')) as quiz_label,
  lower(coalesce(qa.lecture,'')) as lecture_label,
  lower(coalesce(qa.week,'')) as week_label,
  lower(coalesce(qa.metadata->>'category','')) as category_label,
  lower(coalesce(qa.metadata->>'subject','')) as subject_label
 from public.question_attempts qa
 where lower(coalesce(qa.module_key,'')) in ('msk','musculoskeletal-skin','musculoskeletal_skin','musculoskeletal skin')
),
anatomy_attempts as (
 select * from labeled
 where 
  category_label in ('anatomy','gross anatomy') or subject_label in ('anatomy','gross anatomy')
  or quiz_label like '%gross-anatomy%' or quiz_label like '%anatomy%'
  or topic_label ~ '(anatom|vertebr|spinal nerve|nerve ram|dorsal root|ventral root|cervical plexus|brachial plexus|pectoral region|axilla|cubital fossa|shoulder|posterior arm|anterior arm|muscle attach|dermatome|myotome|lymphatic drainage|arterial supply|venous drainage|scapul|humer|clavicle|forearm)'
  or (week_label ~ '(^|[^0-9])13([^0-9]|$)' and (topic_label ~ '^lecture ?7$' or lecture_label ~ '^lecture ?7$'))
  or (week_label ~ '(^|[^0-9])14([^0-9]|$)' and (topic_label ~ '^lecture ?(1|2|7)$' or lecture_label ~ '^lecture ?(1|2|7)$'))
),
scores as (
 select lower(trim(p.anatomy_table)) as group_key,
        min(trim(p.anatomy_table)) as group_name,
        count(distinct p.id)::bigint as member_count,
        count(qa.id)::bigint as questions_answered,
        coalesce(sum(case
          when qa.id is null then 0
          when regexp_replace(lower(coalesce(qa.difficulty,'')), '[^a-z0-9]+','','g') like '%step1%' then 3
          when lower(coalesce(qa.difficulty,'')) like '%intermediate%' then 2
          else 1 end),0)::bigint as points
 from public.profiles p
 left join anatomy_attempts qa on qa.user_id=p.id
 where nullif(trim(p.anatomy_table),'') is not null
 group by lower(trim(p.anatomy_table))
), me as (
 select lower(trim(p.anatomy_table)) as group_key from public.profiles p where p.id=auth.uid()
)
select dense_rank() over(order by s.points desc,s.questions_answered desc)::bigint as rank,
       s.group_name::text as anatomy_table,s.member_count,s.questions_answered,s.points,
       exists(select 1 from me where me.group_key=s.group_key) as is_current_table
from scores s
order by rank,s.group_name;
$$;
revoke all on function public.get_msk_anatomy_table_leaderboard() from public;
revoke execute on function public.get_msk_anatomy_table_leaderboard() from anon;
grant execute on function public.get_msk_anatomy_table_leaderboard() to authenticated;