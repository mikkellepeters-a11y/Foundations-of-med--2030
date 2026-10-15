create or replace function public.get_admin_student_statistics()
returns table (
  student_id uuid, display_name text, class_year integer, cbl_group text, anatomy_table text, pcl_group text, house text,
  joined_at timestamptz, questions_answered bigint, correct_answers bigint, quiz_attempts bigint, achievements bigint,
  foundations_questions bigint, msk_questions bigint, foundations_points bigint, msk_points bigint, last_activity timestamptz
)
language plpgsql stable security definer set search_path=public
as $$
begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return query
 with q as (
  select qa.user_id,count(*)::bigint n,count(*) filter(where qa.is_correct=true)::bigint correct,
  count(*) filter(where lower(coalesce(qa.module_key,''))='foundations')::bigint foundations_n,
  count(*) filter(where lower(coalesce(qa.module_key,'')) in ('msk','musculoskeletal-skin','musculoskeletal_skin','musculoskeletal skin'))::bigint msk_n,
  coalesce(sum(case when lower(coalesce(qa.module_key,''))='foundations' then case when regexp_replace(lower(coalesce(qa.difficulty,'')),'[^a-z0-9]+','','g') like '%step1%' then 3 when lower(coalesce(qa.difficulty,'')) like '%intermediate%' then 2 else 1 end else 0 end),0)::bigint foundations_pts,
  coalesce(sum(case when lower(coalesce(qa.module_key,'')) in ('msk','musculoskeletal-skin','musculoskeletal_skin','musculoskeletal skin') then case when regexp_replace(lower(coalesce(qa.difficulty,'')),'[^a-z0-9]+','','g') like '%step1%' then 3 when lower(coalesce(qa.difficulty,'')) like '%intermediate%' then 2 else 1 end else 0 end),0)::bigint msk_pts,
  max(qa.answered_at) last_q from public.question_attempts qa group by qa.user_id
 ), quizzes as (select user_id,count(*)::bigint n,max(completed_at) last_quiz from public.quiz_attempts group by user_id),
 ach as (select user_id,count(distinct achievement_id)::bigint n from public.achievement_unlocks group by user_id)
 select p.id,coalesce(nullif(trim(p.display_name),''),'MegaHub User'),p.class_year,p.cbl_group,p.anatomy_table,p.pcl_group,p.house,p.created_at,
 coalesce(q.n,0),coalesce(q.correct,0),coalesce(quizzes.n,0),coalesce(ach.n,0),coalesce(q.foundations_n,0),coalesce(q.msk_n,0),coalesce(q.foundations_pts,0),coalesce(q.msk_pts,0),
 greatest(q.last_q,quizzes.last_quiz)
 from public.profiles p left join q on q.user_id=p.id left join quizzes on quizzes.user_id=p.id left join ach on ach.user_id=p.id
 order by coalesce(q.n,0) desc,p.display_name;
end;
$$;
revoke all on function public.get_admin_student_statistics() from public;
revoke execute on function public.get_admin_student_statistics() from anon;
grant execute on function public.get_admin_student_statistics() to authenticated;