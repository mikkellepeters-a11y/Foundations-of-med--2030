-- Module-scoped review architecture
-- Keeps Foundations and MSK review/analytics pools isolated while sharing the same tables.

alter table public.question_attempts
  add column if not exists module_key text;

alter table public.quiz_attempts
  add column if not exists module_key text;

alter table public.review_items
  add column if not exists module_key text;

-- Existing records predate module isolation and belong to the Foundations-era system.
update public.question_attempts
set module_key = 'foundations'
where module_key is null or btrim(module_key) = '';

update public.quiz_attempts
set module_key = 'foundations'
where module_key is null or btrim(module_key) = '';

update public.review_items
set module_key = 'foundations'
where module_key is null or btrim(module_key) = '';

alter table public.question_attempts
  alter column module_key set default 'foundations',
  alter column module_key set not null;

alter table public.quiz_attempts
  alter column module_key set default 'foundations',
  alter column module_key set not null;

alter table public.review_items
  alter column module_key set default 'foundations',
  alter column module_key set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'question_attempts_module_key_format_check'
      and conrelid = 'public.question_attempts'::regclass
  ) then
    alter table public.question_attempts
      add constraint question_attempts_module_key_format_check
      check (module_key ~ '^[a-z0-9][a-z0-9-]*$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'quiz_attempts_module_key_format_check'
      and conrelid = 'public.quiz_attempts'::regclass
  ) then
    alter table public.quiz_attempts
      add constraint quiz_attempts_module_key_format_check
      check (module_key ~ '^[a-z0-9][a-z0-9-]*$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'review_items_module_key_format_check'
      and conrelid = 'public.review_items'::regclass
  ) then
    alter table public.review_items
      add constraint review_items_module_key_format_check
      check (module_key ~ '^[a-z0-9][a-z0-9-]*$');
  end if;
end $$;

alter table public.review_items
  drop constraint if exists review_items_user_id_quiz_id_question_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'review_items_user_module_quiz_question_key'
      and conrelid = 'public.review_items'::regclass
  ) then
    alter table public.review_items
      add constraint review_items_user_module_quiz_question_key
      unique (user_id, module_key, quiz_id, question_id);
  end if;
end $$;

create index if not exists question_attempts_user_module_answered_idx
  on public.question_attempts (user_id, module_key, answered_at desc);

create index if not exists quiz_attempts_user_module_completed_idx
  on public.quiz_attempts (user_id, module_key, completed_at desc);

create index if not exists review_items_user_module_created_idx
  on public.review_items (user_id, module_key, created_at desc);

comment on column public.question_attempts.module_key is
  'Stable module scope such as foundations or msk. Used to keep review and analytics pools isolated.';
comment on column public.quiz_attempts.module_key is
  'Stable module scope such as foundations or msk. Used to keep module performance isolated.';
comment on column public.review_items.module_key is
  'Stable module scope. MSK review queries must explicitly use module_key = msk; Foundations uses foundations.';
