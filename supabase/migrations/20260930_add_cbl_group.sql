-- CBL group/team selection for future leaderboard support.
-- Production schema was updated on 2026-09-30; this file records the change in source control.

alter table public.profiles
  add column if not exists cbl_group text;

alter table public.profiles
  drop constraint if exists profiles_cbl_group_check;

alter table public.profiles
  add constraint profiles_cbl_group_check
  check (
    cbl_group is null
    or cbl_group in (
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
      'AA','BB','CC','DD'
    )
  );
