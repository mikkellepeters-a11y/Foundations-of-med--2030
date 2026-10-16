create table if not exists public.msk_feedback_survey_202610 (
 response_token uuid primary key,
 features text[] not null default '{}',
 preparedness smallint not null check(preparedness between 1 and 5),
 score_impact smallint not null check(score_impact between 1 and 5),
 submitted_at timestamptz not null default now(),
 constraint msk_survey_features_valid check(features <@ array['lecture_companions','factoids','anki','practice_quizzes','gross_anatomy','drug_hub','pathology_hub','smart_review','notebook','cbl_resources','leaderboard','none']::text[])
);
alter table public.msk_feedback_survey_202610 enable row level security;
revoke all on public.msk_feedback_survey_202610 from anon,authenticated;
create or replace function public.submit_msk_feedback_survey(p_token uuid,p_features text[],p_preparedness integer,p_score_impact integer)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if now() >= timestamptz '2026-10-21 00:00:00-04' then return false; end if;
 if p_token is null or p_preparedness not between 1 and 5 or p_score_impact not between 1 and 5
 or p_features is null or cardinality(p_features)>12
 or not(p_features <@ array['lecture_companions','factoids','anki','practice_quizzes','gross_anatomy','drug_hub','pathology_hub','smart_review','notebook','cbl_resources','leaderboard','none']::text[])
 or ('none'=any(p_features) and cardinality(p_features)>1) then
   raise exception 'Invalid survey response';
 end if;
 insert into public.msk_feedback_survey_202610(response_token,features,preparedness,score_impact)
 values(p_token,array(select distinct unnest(p_features)),p_preparedness,p_score_impact)
 on conflict(response_token) do nothing;
 return true;
end;$$;
revoke all on function public.submit_msk_feedback_survey(uuid,text[],integer,integer) from public;
grant execute on function public.submit_msk_feedback_survey(uuid,text[],integer,integer) to anon,authenticated;
create or replace function public.get_admin_msk_survey_results()
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 select jsonb_build_object(
 'responses',count(*),
 'average_preparedness',round(avg(preparedness)::numeric,2),
 'average_score_impact',round(avg(score_impact)::numeric,2),
 'feature_counts',(select coalesce(jsonb_object_agg(feature,n),'{}'::jsonb) from (select feature,count(*) n from public.msk_feedback_survey_202610 s cross join lateral unnest(s.features) feature group by feature) t),
 'preparedness_counts',(select coalesce(jsonb_object_agg(preparedness,n),'{}'::jsonb) from (select preparedness,count(*) n from public.msk_feedback_survey_202610 group by preparedness) t),
 'score_impact_counts',(select coalesce(jsonb_object_agg(score_impact,n),'{}'::jsonb) from (select score_impact,count(*) n from public.msk_feedback_survey_202610 group by score_impact) t)
 ) into result from public.msk_feedback_survey_202610;
 return result;
end;$$;
revoke all on function public.get_admin_msk_survey_results() from public;
grant execute on function public.get_admin_msk_survey_results() to authenticated;