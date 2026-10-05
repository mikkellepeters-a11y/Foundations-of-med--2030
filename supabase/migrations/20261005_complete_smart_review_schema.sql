-- Complete Smart Review schema
-- Adds the persistent fields needed for Filed for Review, repeated misses,
-- confidence-based review, spaced review, mastery, and MSK-only filtering.

alter table public.review_items
  add column if not exists review_reasons text[] not null default '{}',
  add column if not exists status text not null default 'active',
  add column if not exists manually_filed boolean not null default false,
  add column if not exists miss_count integer not null default 0,
  add column if not exists correct_streak integer not null default 0,
  add column if not exists review_attempts integer not null default 0,
  add column if not exists review_stage integer not null default 0,
  add column if not exists last_confidence text,
  add column if not exists last_result_correct boolean,
  add column if not exists first_flagged_at timestamptz,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists next_due_at timestamptz,
  add column if not exists mastered_at timestamptz,
  add column if not exists week text,
  add column if not exists lecture text,
  add column if not exists topic text,
  add column if not exists difficulty text,
  add column if not exists question_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.question_attempts
  add column if not exists week text,
  add column if not exists lecture text;

-- Existing review_items were created by the legacy manual "Filed for Review" action.
update public.review_items
set manually_filed = true,
    review_reasons = case
      when not ('filed' = any(review_reasons)) then array_append(review_reasons,'filed')
      else review_reasons
    end,
    first_flagged_at = coalesce(first_flagged_at, created_at)
where manually_filed = false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='review_items_status_check'
      and conrelid='public.review_items'::regclass
  ) then
    alter table public.review_items
      add constraint review_items_status_check
      check (status in ('active','improving','mastered','archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='review_items_counts_nonnegative_check'
      and conrelid='public.review_items'::regclass
  ) then
    alter table public.review_items
      add constraint review_items_counts_nonnegative_check
      check (miss_count >= 0 and correct_streak >= 0 and review_attempts >= 0 and review_stage >= 0);
  end if;
end $$;

create index if not exists review_items_user_module_status_idx
  on public.review_items (user_id,module_key,status);

create index if not exists review_items_user_module_due_idx
  on public.review_items (user_id,module_key,next_due_at)
  where status in ('active','improving');

create index if not exists review_items_user_module_week_idx
  on public.review_items (user_id,module_key,week);

create index if not exists review_items_user_module_topic_idx
  on public.review_items (user_id,module_key,topic);

create index if not exists question_attempts_user_module_week_idx
  on public.question_attempts (user_id,module_key,week);

create index if not exists question_attempts_user_module_lecture_idx
  on public.question_attempts (user_id,module_key,lecture);

create or replace function public.set_review_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists review_items_set_updated_at on public.review_items;
create trigger review_items_set_updated_at
before update on public.review_items
for each row execute function public.set_review_item_updated_at();

comment on column public.review_items.review_reasons is
  'One or more reason slugs, e.g. filed, repeatedly_missed, confidently_wrong, low_confidence. Due status is derived from next_due_at rather than stored here.';
comment on column public.review_items.status is
  'Lifecycle state: active, improving, mastered, or archived.';
comment on column public.review_items.manually_filed is
  'True when the learner explicitly filed the question. Manual items should not auto-clear unless the user opts in.';
comment on column public.review_items.review_stage is
  'Spaced-review stage used to choose the next interval.';
comment on column public.review_items.question_snapshot is
  'Lightweight review payload such as stem, choices, answer, and explanation, captured when the item enters review.';
