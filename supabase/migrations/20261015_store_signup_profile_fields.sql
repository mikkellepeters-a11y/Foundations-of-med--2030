-- Save sign-up profile fields immediately, including when email confirmation is enabled.
-- Existing users and their preferences are not changed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_year text := nullif(btrim(m->>'class_year'),'');
  chosen_name text := nullif(left(btrim(m->>'display_name'),60),'');
  new_year integer;
begin
  if raw_year ~ '^[0-9]{4}$' and raw_year::integer between 2020 and 2100 then
    new_year := raw_year::integer;
  end if;
  insert into public.profiles (id,display_name,class_year,cbl_group,anatomy_table,pcl_group,house)
  values (
    new.id,
    coalesce(chosen_name,public.generate_medical_screen_name(new.id)),
    new_year,
    case when upper(btrim(m->>'cbl_group')) ~ '^(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|AA|BB|CC|DD)$' then upper(btrim(m->>'cbl_group')) else null end,
    case when btrim(m->>'anatomy_table') ~ '^([1-9]|[12][0-9]|30)$' then btrim(m->>'anatomy_table') else null end,
    case when btrim(m->>'pcl_group') ~ '^([1-9]|[1-5][0-9]|6[0-6])$' then btrim(m->>'pcl_group') else null end,
    case when upper(btrim(m->>'house')) ~ '^[A-N]$' then upper(btrim(m->>'house')) else null end
  ) on conflict (id) do nothing;
  return new;
end;
$$;