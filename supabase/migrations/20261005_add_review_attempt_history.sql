-- Smart Review attempt history
-- Keeps review-session performance separate from original quiz attempts.

create table if not exists public.review_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_item_id uuid references public.review_items(id) on delete set null,
  module_key text not null,
  quiz_id text not null,
  question_id text not null,
  selected_answer text,
  correct_answer text,
  is_correct boolean not null,
  confidence text,
  session_token text not null,
  review_stage_before integer not null default 0,
  review_stage_after integer not null default 0,
  status_before text,
  status_after text,
  reviewed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint review_attempts_module_key_format_check check (module_key ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint review_attempts_stages_nonnegative_check check (review_stage_before >= 0 and review_stage_after >= 0)
);

create index if not exists review_attempts_user_module_reviewed_idx
  on public.review_attempts (user_id, module_key, reviewed_at desc);
create index if not exists review_attempts_user_question_idx
  on public.review_attempts (user_id, module_key, quiz_id, question_id, reviewed_at desc);
create index if not exists review_attempts_session_idx
  on public.review_attempts (user_id, session_token, reviewed_at);

alter table public.review_attempts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='review_attempts' and policyname='Users can read own review attempts'
  ) then
    create policy "Users can read own review attempts"
      on public.review_attempts for select
      using ((select auth.uid()) = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='review_attempts' and policyname='Users can insert own review attempts'
  ) then
    create policy "Users can insert own review attempts"
      on public.review_attempts for insert
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

comment on table public.review_attempts is
  'Immutable history of attempts made inside Smart Review sessions. Kept separate from original question_attempts.';
comment on column public.review_attempts.session_token is
  'Client-generated token grouping attempts from the same review session.';
