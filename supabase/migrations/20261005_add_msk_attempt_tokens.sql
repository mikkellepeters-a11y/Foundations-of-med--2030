-- Idempotency support for future MSK quiz tracking.
-- Historical rows remain valid because attempt_token is nullable.

alter table public.question_attempts
  add column if not exists attempt_token text;

alter table public.quiz_attempts
  add column if not exists attempt_token text;

comment on column public.question_attempts.attempt_token is
  'Client-generated token identifying one quiz attempt. Used to prevent duplicate question submissions within the same attempt.';

comment on column public.quiz_attempts.attempt_token is
  'Client-generated token identifying one quiz attempt. Used to prevent duplicate quiz-completion rows.';

create unique index if not exists question_attempts_user_module_quiz_token_question_uidx
  on public.question_attempts (user_id, module_key, quiz_id, attempt_token, question_id)
  where attempt_token is not null;

create unique index if not exists quiz_attempts_user_module_quiz_token_uidx
  on public.quiz_attempts (user_id, module_key, quiz_id, attempt_token)
  where attempt_token is not null;
