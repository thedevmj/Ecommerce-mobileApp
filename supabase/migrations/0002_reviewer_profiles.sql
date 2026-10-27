create or replace view public.reviewer_profiles as
select id, full_name, avatar_url
from public.profiles;

grant select on public.reviewer_profiles to anon, authenticated;

notify pgrst, 'reload schema';
