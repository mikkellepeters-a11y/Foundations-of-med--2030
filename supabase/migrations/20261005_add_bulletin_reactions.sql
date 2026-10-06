create table if not exists public.bulletin_reactions (
  post_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('🩺','🧠','💊','🧬','🩻','❤️')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

alter table public.bulletin_reactions enable row level security;

grant select, insert, delete on public.bulletin_reactions to authenticated;

drop policy if exists "Users can read own bulletin reactions" on public.bulletin_reactions;
create policy "Users can read own bulletin reactions"
on public.bulletin_reactions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own bulletin reactions" on public.bulletin_reactions;
create policy "Users can add own bulletin reactions"
on public.bulletin_reactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own bulletin reactions" on public.bulletin_reactions;
create policy "Users can remove own bulletin reactions"
on public.bulletin_reactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.bulletin_reaction_counts (
  post_id text not null,
  reaction text not null check (reaction in ('🩺','🧠','💊','🧬','🩻','❤️')),
  reaction_count integer not null default 0 check (reaction_count >= 0),
  primary key (post_id, reaction)
);

alter table public.bulletin_reaction_counts enable row level security;

grant select on public.bulletin_reaction_counts to anon, authenticated;

drop policy if exists "Bulletin reaction counts are readable" on public.bulletin_reaction_counts;
create policy "Bulletin reaction counts are readable"
on public.bulletin_reaction_counts
for select
to anon, authenticated
using (true);

create or replace function public.sync_bulletin_reaction_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.bulletin_reaction_counts(post_id, reaction, reaction_count)
    values (new.post_id, new.reaction, 1)
    on conflict (post_id, reaction)
    do update set reaction_count = public.bulletin_reaction_counts.reaction_count + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update public.bulletin_reaction_counts
    set reaction_count = greatest(reaction_count - 1, 0)
    where post_id = old.post_id
      and reaction = old.reaction;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function public.sync_bulletin_reaction_count() from public, anon, authenticated;

drop trigger if exists sync_bulletin_reaction_count_after_insert on public.bulletin_reactions;
create trigger sync_bulletin_reaction_count_after_insert
after insert on public.bulletin_reactions
for each row execute function public.sync_bulletin_reaction_count();

drop trigger if exists sync_bulletin_reaction_count_after_delete on public.bulletin_reactions;
create trigger sync_bulletin_reaction_count_after_delete
after delete on public.bulletin_reactions
for each row execute function public.sync_bulletin_reaction_count();
