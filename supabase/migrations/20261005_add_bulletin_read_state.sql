alter table public.profiles
add column if not exists last_bulletin_read_id text;

comment on column public.profiles.last_bulletin_read_id
is 'Newest MegaHub bulletin/developer post ID the user has opened.';
