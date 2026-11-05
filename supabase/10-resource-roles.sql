-- =========================================================
-- G H S S PANDI — who may read the notes library
--   Run AFTER 09-resources.sql.
--   Safe to run more than once.
--
--   09 let any signed-in account read a published note, which included
--   parents. Notes are for students, teachers and staff only, so this file
--   narrows the read policies. Uploads stay staff-only (public.is_staff()).
-- =========================================================

create or replace function public.can_read_resources()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('student', 'teacher', 'admin')
  );
$$;

revoke all on function public.can_read_resources() from public;
grant execute on function public.can_read_resources() to authenticated;

drop policy if exists resources_read on public.resources;
create policy resources_read on public.resources
  for select to authenticated
  using (public.can_read_resources() and (is_published or public.is_staff()));

drop policy if exists "resources objects read" on storage.objects;
create policy "resources objects read" on storage.objects
  for select to authenticated
  using (bucket_id = 'resources' and public.can_read_resources());
