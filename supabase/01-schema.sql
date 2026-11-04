-- =============================================================
-- G H S S PANDI — database schema
-- Run this file first in the Supabase SQL editor.
-- Roles and permissions are enforced here, never in the browser.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- enums (kept as text + checks for easy edits) ----------
do $$ begin
  create type public.app_role as enum ('student','teacher','parent','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('pending','active','disabled');
exception when duplicate_object then null; end $$;

-- ---------- profiles: one row per auth user ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null default '',
  role        public.app_role not null default 'student',
  phone       text not null default '',
  status      public.account_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- students ----------
create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid unique references public.profiles(id) on delete cascade,
  full_name     text not null,
  class         text not null,
  roll_no       text not null,
  admission_no  text,
  status        text not null default 'active' check (status in ('pending','active','left')),
  created_at    timestamptz not null default now()
);
-- partial index: a sign-up without a class/roll must not collide with another
create unique index if not exists students_class_roll_idx on public.students (class, roll_no)
  where class <> '' and roll_no <> '';

-- ---------- teachers ----------
create table if not exists public.teachers (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid unique references public.profiles(id) on delete cascade,
  full_name     text not null,
  employee_no   text unique,
  subject       text not null default '',
  designation   text not null default 'HSA',
  status        text not null default 'pending' check (status in ('pending','approved','rejected','disabled')),
  created_at    timestamptz not null default now()
);

-- ---------- parents ----------
create table if not exists public.parents (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles(id) on delete cascade,
  full_name   text not null,
  phone       text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- parent <-> student links (verified by the school) ----------
create table if not exists public.parent_student_links (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.parents(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  relationship text not null default 'Guardian',
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified_by  uuid references public.profiles(id),
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ---------- classes and teacher assignment ----------
create table if not exists public.class_rooms (
  id    text primary key,
  name  text not null
);

create table if not exists public.class_teachers (
  class_id   text not null references public.class_rooms(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  primary key (class_id, teacher_id)
);

-- ---------- notices ----------
create table if not exists public.notices (
  id           uuid primary key default gen_random_uuid(),
  title_en     text not null,
  title_ml     text not null default '',
  body_en      text not null default '',
  body_ml      text not null default '',
  category     text not null default 'general' check (category in ('general','admission','exam','event','holiday')),
  is_published boolean not null default true,
  is_pinned    boolean not null default false,
  author_id    uuid references public.profiles(id),
  author_name  text not null default 'School Office',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- examination results ----------
create table if not exists public.results (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid references public.students(id) on delete cascade,
  class             text not null,
  roll_no           text not null,
  exam_name         text not null,
  subject           text not null,
  marks             numeric(5,2) not null check (marks >= 0),
  max_marks         numeric(5,2) not null default 100 check (max_marks > 0),
  grade             text not null default '',
  published_by      uuid references public.profiles(id),
  published_by_name text not null default '',
  published_at      timestamptz not null default now(),
  check (marks <= max_marks),
  unique (class, roll_no, exam_name, subject)
);

create index if not exists results_lookup_idx on public.results (class, roll_no);
create index if not exists results_student_idx on public.results (student_id);

-- ---------- class group chat ----------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room        text not null references public.class_rooms(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null default '',
  sender_role public.app_role not null default 'student',
  body        text not null check (char_length(body) between 1 and 500),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists chat_room_idx on public.chat_messages (room, created_at desc);

create table if not exists public.chat_reports (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.chat_messages(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null default '',
  status      text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (message_id, reporter_id)
);

-- ---------- moderation history ----------
create table if not exists public.moderation_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles(id),
  actor_name text not null default '',
  action     text not null,
  target     text not null default '',
  details    text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- public content ----------
create table if not exists public.gallery_items (
  id         uuid primary key default gen_random_uuid(),
  title_en   text not null,
  title_ml   text not null default '',
  category   text not null default 'campus',
  src        text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id             uuid primary key default gen_random_uuid(),
  title_en       text not null,
  title_ml       text not null default '',
  description_en text not null default '',
  description_ml text not null default '',
  student_name   text not null default '',
  class_name     text not null default '',
  category       text not null default 'academic',
  level          text not null default 'School',
  event_date     date not null default current_date,
  icon           text not null default '🏆',
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- ---------- admission enquiries (public form) ----------
create table if not exists public.admission_enquiries (
  id           uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_name  text not null,
  phone        text not null,
  email        text,
  class        text not null,
  message      text,
  status       text not null default 'new' check (status in ('new','contacted','closed')),
  created_at   timestamptz not null default now()
);

-- ---------- create or update a profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role public.app_role;
  v_status  public.account_status;
begin
  meta_role := coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'student');
  -- a signup can never make itself an administrator
  if meta_role = 'admin' then meta_role := 'student'; end if;
  v_status := case when meta_role = 'teacher' then 'pending'::public.account_status
                   else 'active'::public.account_status end;

  insert into public.profiles (id, email, full_name, role, phone, status)
  values (new.id,
          lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          meta_role,
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          v_status)
  on conflict (id) do update
     set email = excluded.email,
         full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name),
         phone = coalesce(nullif(excluded.phone,''), public.profiles.phone);

  if meta_role = 'student' then
    insert into public.students (profile_id, full_name, class, roll_no, admission_no, status)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
            coalesce(new.raw_user_meta_data -> 'extra' ->> 'class', ''),
            coalesce(new.raw_user_meta_data -> 'extra' ->> 'roll_no', ''),
            new.raw_user_meta_data -> 'extra' ->> 'admission_no',
            'pending')
    on conflict (profile_id) do nothing;
  elsif meta_role = 'teacher' then
    insert into public.teachers (profile_id, full_name, employee_no, subject, designation, status)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'full_name', 'Teacher'),
            new.raw_user_meta_data -> 'extra' ->> 'employee_no',
            coalesce(new.raw_user_meta_data -> 'extra' ->> 'subject', ''),
            'HSA', 'pending')
    on conflict (profile_id) do nothing;
  elsif meta_role = 'parent' then
    insert into public.parents (profile_id, full_name, phone)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'full_name', 'Parent'),
            coalesce(new.raw_user_meta_data ->> 'phone', ''))
    on conflict (profile_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profile email in sync
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = lower(new.email), updated_at = now() where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- ---------- chat message attribution is server-side ----------
create or replace function public.set_chat_meta()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select full_name, role into p from public.profiles where id = new.sender_id;
  if p is null then raise exception 'unknown sender'; end if;
  new.sender_name := p.full_name;
  new.sender_role := p.role;
  new.hidden := false;
  return new;
end $$;

drop trigger if exists chat_meta on public.chat_messages;
create trigger chat_meta before insert on public.chat_messages
  for each row execute function public.set_chat_meta();

-- ---------- login gate: teacher accounts stay pending until approved ----------
create or replace function public.teacher_is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.teachers t on t.profile_id = p.id
    where p.id = auth.uid() and p.role = 'teacher' and p.status = 'active' and t.status = 'approved'
  );
$$;

-- realtime for chat
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; when others then null; end $$;
