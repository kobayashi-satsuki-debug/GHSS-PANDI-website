/* =========================================================
   G H S S PANDI — PDF notes / resources
   Run AFTER 01-schema.sql … 07-ai-buddy.sql.
   Safe to run more than once.

   Teachers upload a PDF for one class and subject into the private
   "resources" storage bucket; the row in public.resources points at it.
   Students only ever read through short-lived signed URLs.
   ========================================================= */

create table if not exists public.resources (
  id            uuid primary key default gen_random_uuid(),
  class         text not null,
  subject       text not null,
  title         text not null,
  description   text not null default '',
  storage_path  text not null,
  file_name     text not null,
  file_size     bigint not null default 0,
  mime          text not null default 'application/pdf',
  uploaded_by   uuid references public.profiles(id) on delete set null,
  uploader_name text not null default '',
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists resources_class_idx on public.resources (class, subject, created_at desc);

alter table public.resources enable row level security;

-- attribution and path are set by the server, never trusted from the browser
create or replace function public.set_resource_meta()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_role public.app_role;
begin
  select full_name, role into v_name, v_role from public.profiles where id = auth.uid();
  if v_name is null then raise exception 'unknown uploader'; end if;
  if v_role not in ('teacher','admin') then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  new.uploaded_by := auth.uid();
  new.uploader_name := v_name;
  new.class := left(trim(new.class), 40);
  new.subject := left(trim(new.subject), 60);
  new.title := left(trim(new.title), 120);
  new.description := left(coalesce(new.description, ''), 500);
  if new.class = '' or new.subject = '' or new.title = '' then
    raise exception 'invalid_input';
  end if;
  return new;
end $$;

drop trigger if exists resources_meta on public.resources;
create trigger resources_meta before insert on public.resources
  for each row execute function public.set_resource_meta();

drop policy if exists resources_read on public.resources;
create policy resources_read on public.resources
  for select to authenticated
  using (is_published or public.is_staff());

drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
  for insert to authenticated
  with check (public.is_staff() and uploaded_by = auth.uid());

drop policy if exists resources_update on public.resources;
create policy resources_update on public.resources
  for update to authenticated
  using (public.is_staff() or uploaded_by = auth.uid())
  with check (public.is_staff() or uploaded_by = auth.uid());

drop policy if exists resources_delete on public.resources;
create policy resources_delete on public.resources
  for delete to authenticated
  using (public.is_staff() or uploaded_by = auth.uid());

grant select, insert, update, delete on public.resources to authenticated;
revoke all on public.resources from anon;

-- ---------- private storage bucket for the PDFs ---------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resources', 'resources', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = array['application/pdf'];

drop policy if exists "resources objects read" on storage.objects;
create policy "resources objects read" on storage.objects
  for select to authenticated
  using (bucket_id = 'resources');

drop policy if exists "resources objects insert" on storage.objects;
create policy "resources objects insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resources' and public.is_staff());

drop policy if exists "resources objects delete" on storage.objects;
create policy "resources objects delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resources' and public.is_staff());
