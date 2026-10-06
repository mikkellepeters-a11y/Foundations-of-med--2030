create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.achievement_catalog (
  id text primary key,
  title text not null,
  icon text not null,
  module_key text
);

alter table public.achievement_catalog enable row level security;
revoke all on public.achievement_catalog from anon, authenticated;

insert into public.achievement_catalog (id,title,icon,module_key) values
('first-question','First Question','✦',null),
('warm-up','Warmed Up','🔥',null),
('century','Century Club','💯',null),
('deep-250','Deep in the Deck','📚',null),
('question-machine','Question Machine','⚙️',null),
('four-digits','Four Digits','🏆',null),
('oops-all-questions','Oops! All Questions','🫠',null),
('quiz-debut','Quiz Debut','▶',null),
('quiz-grinder','Quiz Grinder','🧠',null),
('quiz-veteran','Quiz Veteran','🎓',null),
('quiz-marathon','Marathon Scholar','🏁',null),
('could-have-been-anki','This Could''ve Been Anki','🃏',null),
('confidence-was-answer','Confidence Was the Answer','😎',null),
('professional-guesser','Professional Guesser','🎲',null),
('future-me-problem','Future Me''s Problem','📌',null),
('cbl-connected','CBL Connected','🤝',null),
('profile-complete','Profile Complete','✓',null),
('built-the-foundation','Built the Foundation','🏛️','foundations'),
('first-correct','Nailed It','✅',null),
('correct-100','Evidence-Based','🎯',null),
('correct-500','Clinical Momentum','🩺',null),
('called-it','Called It','🔒',null),
('locked-in','Locked In','🧠',null),
('hot-streak','Hot Streak','🔥',null),
('on-a-roll','On a Roll','🎳',null),
('diagnostic-accuracy','Diagnostic Accuracy','📈',null),
('quiz-goblin','Quiz Goblin','👹',null),
('touch-grass','Please Touch Grass','🌱',null),
('review-hoarder','Review Hoarder','🗂️',null),
('pcl-plugged-in','PCL Plugged In','🗣️',null),
('house-call','House Call','🏠',null),
('fully-assigned','Fully Assigned','🧾',null),
('msk-bone-zone','Welcome to the Bone Zone','🦴','msk'),
('msk-skin-game','Skin in the Game','🧴','msk'),
('msk-joint-effort','Joint Effort','🦿','msk'),
('msk-muscle-memory','Muscle Memory','💪','msk'),
('msk-no-bones-left','No Bones Left Unturned','🩻','msk'),
('msk-quiz-debut','MSK Debut','🩺','msk'),
('msk-ortho-mode','Ortho Mode Activated','🔨','msk'),
('msk-out-of-hand','This Is Getting Out of Hand','🖐️','msk'),
('msk-filed-pain','Filed Under: Pain','📌','msk'),
('msk-table-manners','Table Manners','🥼','msk'),
('msk-built-different','Built Different','🦴','msk')
on conflict (id) do update set
  title=excluded.title,
  icon=excluded.icon,
  module_key=excluded.module_key;

create table if not exists public.achievement_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievement_catalog(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  announce boolean not null default true,
  primary key (user_id, achievement_id)
);

alter table public.achievement_unlocks enable row level security;
grant select on public.achievement_unlocks to authenticated;
revoke insert, update, delete on public.achievement_unlocks from anon, authenticated;

drop policy if exists "Users can read own achievement unlocks" on public.achievement_unlocks;
create policy "Users can read own achievement unlocks"
on public.achievement_unlocks
for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.achievement_feed_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initialized_at timestamptz not null default now()
);

alter table public.achievement_feed_state enable row level security;
grant select on public.achievement_feed_state to authenticated;
revoke insert, update, delete on public.achievement_feed_state from anon, authenticated;

drop policy if exists "Users can read own achievement feed state" on public.achievement_feed_state;
create policy "Users can read own achievement feed state"
on public.achievement_feed_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.bulletin_achievement_feed (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  achievement_id text not null,
  achievement_title text not null,
  achievement_icon text not null,
  module_key text,
  unlocked_at timestamptz not null
);

alter table public.bulletin_achievement_feed enable row level security;
grant select on public.bulletin_achievement_feed to anon, authenticated;
revoke insert, update, delete on public.bulletin_achievement_feed from anon, authenticated;

drop policy if exists "Achievement feed is readable" on public.bulletin_achievement_feed;
create policy "Achievement feed is readable"
on public.bulletin_achievement_feed
for select
to anon, authenticated
using (true);

create index if not exists bulletin_achievement_feed_unlocked_idx
  on public.bulletin_achievement_feed (unlocked_at desc);

create or replace function private.publish_achievement_unlock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_icon text;
  v_module text;
  v_name text;
begin
  if new.announce is not true then
    return new;
  end if;

  select c.title,c.icon,c.module_key
    into v_title,v_icon,v_module
  from public.achievement_catalog c
  where c.id=new.achievement_id;

  select coalesce(nullif(btrim(p.display_name),''),'A MegaHub user')
    into v_name
  from public.profiles p
  where p.id=new.user_id;

  insert into public.bulletin_achievement_feed(
    display_name,achievement_id,achievement_title,achievement_icon,module_key,unlocked_at
  )
  values(
    coalesce(v_name,'A MegaHub user'),
    new.achievement_id,
    v_title,
    v_icon,
    v_module,
    new.unlocked_at
  );

  return new;
end;
$$;

revoke all on function private.publish_achievement_unlock() from public, anon, authenticated;

drop trigger if exists publish_achievement_unlock_after_insert on public.achievement_unlocks;
create trigger publish_achievement_unlock_after_insert
after insert on public.achievement_unlocks
for each row execute function private.publish_achievement_unlock();

create or replace function private.sync_achievements_for_user(p_user_id uuid, p_publish boolean default true)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_questions bigint := 0;
  v_quizzes bigint := 0;
  v_correct bigint := 0;
  v_confident_correct bigint := 0;
  v_confident_wrong bigint := 0;
  v_low_conf bigint := 0;
  v_reviews bigint := 0;
  v_msk_questions bigint := 0;
  v_msk_quizzes bigint := 0;
  v_msk_filed bigint := 0;
  v_best_streak integer := 0;
  v_streak integer := 0;
  v_new integer := 0;
  v_cbl text;
  v_anatomy text;
  v_pcl text;
  v_house text;
  v_display text;
  v_class_year integer;
  rec record;
begin
  if p_user_id is null then return 0; end if;

  select
    count(*),
    count(*) filter (where q.is_correct is true),
    count(*) filter (where lower(coalesce(q.confidence,''))='confident' and q.is_correct is true),
    count(*) filter (where lower(coalesce(q.confidence,''))='confident' and q.is_correct is not true),
    count(*) filter (where lower(coalesce(q.confidence,'')) in ('unsure','guessing')),
    count(*) filter (
      where lower(coalesce(q.module_key,''))='msk'
         or lower(coalesce(q.metadata->>'module','')) ~ '(musculoskeletal(-skin)?|msk-skin)'
    )
  into v_questions,v_correct,v_confident_correct,v_confident_wrong,v_low_conf,v_msk_questions
  from public.question_attempts q
  where q.user_id=p_user_id;

  select
    count(*),
    count(*) filter (
      where lower(coalesce(q.module_key,''))='msk'
         or lower(coalesce(q.metadata->>'module','')) ~ '(musculoskeletal(-skin)?|msk-skin)'
    )
  into v_quizzes,v_msk_quizzes
  from public.quiz_attempts q
  where q.user_id=p_user_id;

  select
    count(*),
    count(*) filter (
      where (
        lower(coalesce(r.module_key,''))='msk'
        or lower(coalesce(r.metadata->>'module','')) ~ '(musculoskeletal(-skin)?|msk-skin)'
      )
      and (
        coalesce(r.manually_filed,false)
        or 'filed'=any(coalesce(r.review_reasons,array[]::text[]))
      )
    )
  into v_reviews,v_msk_filed
  from public.review_items r
  where r.user_id=p_user_id;

  select p.cbl_group,p.anatomy_table,p.pcl_group,p.house,p.display_name,p.class_year
  into v_cbl,v_anatomy,v_pcl,v_house,v_display,v_class_year
  from public.profiles p
  where p.id=p_user_id;

  for rec in
    select q.is_correct
    from public.question_attempts q
    where q.user_id=p_user_id
    order by q.answered_at asc, q.id asc
  loop
    if rec.is_correct is true then
      v_streak := v_streak + 1;
      if v_streak > v_best_streak then v_best_streak := v_streak; end if;
    else
      v_streak := 0;
    end if;
  end loop;

  with earned(achievement_id,earned) as (
    values
      ('first-question', v_questions >= 1),
      ('warm-up', v_questions >= 50),
      ('century', v_questions >= 100),
      ('deep-250', v_questions >= 250),
      ('question-machine', v_questions >= 500),
      ('four-digits', v_questions >= 1000),
      ('oops-all-questions', v_questions >= 1500),
      ('quiz-debut', v_quizzes >= 1),
      ('quiz-grinder', v_quizzes >= 10),
      ('quiz-veteran', v_quizzes >= 25),
      ('quiz-marathon', v_quizzes >= 50),
      ('could-have-been-anki', v_quizzes >= 75),
      ('confidence-was-answer', v_confident_wrong >= 10),
      ('professional-guesser', v_low_conf >= 25),
      ('future-me-problem', v_reviews >= 25),
      ('cbl-connected', nullif(btrim(v_cbl),'') is not null),
      ('profile-complete', nullif(btrim(v_display),'') is not null and v_class_year is not null and nullif(btrim(v_cbl),'') is not null),
      ('built-the-foundation', now() >= timestamptz '2026-10-01 18:00:00+00'),
      ('first-correct', v_correct >= 1),
      ('correct-100', v_correct >= 100),
      ('correct-500', v_correct >= 500),
      ('called-it', v_confident_correct >= 25),
      ('locked-in', v_confident_correct >= 100),
      ('hot-streak', v_best_streak >= 5),
      ('on-a-roll', v_best_streak >= 10),
      ('diagnostic-accuracy', v_questions >= 100 and (v_correct::numeric / nullif(v_questions,0)) >= 0.80),
      ('quiz-goblin', v_quizzes >= 100),
      ('touch-grass', v_questions >= 2000),
      ('review-hoarder', v_reviews >= 50),
      ('pcl-plugged-in', nullif(btrim(v_pcl),'') is not null),
      ('house-call', nullif(btrim(v_house),'') is not null),
      ('fully-assigned', nullif(btrim(v_cbl),'') is not null and nullif(btrim(v_anatomy),'') is not null and nullif(btrim(v_pcl),'') is not null and nullif(btrim(v_house),'') is not null),
      ('msk-bone-zone', v_msk_questions >= 1),
      ('msk-skin-game', v_msk_questions >= 50),
      ('msk-joint-effort', v_msk_questions >= 100),
      ('msk-muscle-memory', v_msk_questions >= 250),
      ('msk-no-bones-left', v_msk_questions >= 500),
      ('msk-quiz-debut', v_msk_quizzes >= 1),
      ('msk-ortho-mode', v_msk_quizzes >= 10),
      ('msk-out-of-hand', v_msk_quizzes >= 25),
      ('msk-filed-pain', v_msk_filed >= 15),
      ('msk-table-manners', nullif(btrim(v_anatomy),'') is not null),
      ('msk-built-different', now() >= timestamptz '2026-12-11 05:00:00+00')
  )
  insert into public.achievement_unlocks(user_id,achievement_id,announce)
  select p_user_id,e.achievement_id,p_publish
  from earned e
  where e.earned
  on conflict (user_id,achievement_id) do nothing;

  get diagnostics v_new = row_count;

  insert into public.achievement_feed_state(user_id)
  values(p_user_id)
  on conflict (user_id) do nothing;

  return v_new;
end;
$$;

revoke all on function private.sync_achievements_for_user(uuid,boolean) from public, anon, authenticated;

create or replace function public.sync_my_achievements()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Authentication required'; end if;
  return private.sync_achievements_for_user(v_uid,true);
end;
$$;

revoke all on function public.sync_my_achievements() from public, anon;
grant execute on function public.sync_my_achievements() to authenticated;

create or replace function private.sync_achievements_from_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := coalesce(new.user_id, old.user_id);
  perform private.sync_achievements_for_user(v_uid,true);
  return coalesce(new,old);
end;
$$;

revoke all on function private.sync_achievements_from_activity() from public, anon, authenticated;

create or replace function private.sync_achievements_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.sync_achievements_for_user(new.id,true);
  return new;
end;
$$;

revoke all on function private.sync_achievements_from_profile() from public, anon, authenticated;

drop trigger if exists sync_achievements_after_quiz_attempt on public.quiz_attempts;
create trigger sync_achievements_after_quiz_attempt
after insert on public.quiz_attempts
for each row execute function private.sync_achievements_from_activity();

drop trigger if exists sync_achievements_after_review_insert on public.review_items;
create trigger sync_achievements_after_review_insert
after insert on public.review_items
for each row execute function private.sync_achievements_from_activity();

drop trigger if exists sync_achievements_after_review_update on public.review_items;
create trigger sync_achievements_after_review_update
after update of manually_filed,review_reasons,module_key on public.review_items
for each row execute function private.sync_achievements_from_activity();

drop trigger if exists sync_achievements_after_profile_insert on public.profiles;
create trigger sync_achievements_after_profile_insert
after insert on public.profiles
for each row execute function private.sync_achievements_from_profile();

drop trigger if exists sync_achievements_after_profile_groups on public.profiles;
create trigger sync_achievements_after_profile_groups
after update of display_name,class_year,cbl_group,anatomy_table,pcl_group,house on public.profiles
for each row execute function private.sync_achievements_from_profile();

do $$
declare
  v_user uuid;
begin
  for v_user in select p.id from public.profiles p loop
    perform private.sync_achievements_for_user(v_user,false);
  end loop;
end;
$$;
