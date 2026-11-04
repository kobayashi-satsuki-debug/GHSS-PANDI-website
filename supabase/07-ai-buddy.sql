/* =========================================================
   G H S S PANDI — student AI study buddy
   Run AFTER 06-security-hardening.sql. Safe to run again.
   A student picks a nickname for their assistant; messages are
   stored per student and readable only by that student, their
   class teachers and admins.
   ========================================================= */

alter table public.students add column if not exists ai_nickname text;

create or replace function public.my_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where profile_id = auth.uid();
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'students_ai_nickname_chk'
  ) then
    alter table public.students
      add constraint students_ai_nickname_chk
      check (ai_nickname is null or char_length(ai_nickname) between 2 and 24);
  end if;
end $$;

create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_student_idx
  on public.ai_messages (student_id, created_at desc);

alter table public.ai_messages enable row level security;

drop policy if exists ai_messages_read_own on public.ai_messages;
create policy ai_messages_read_own on public.ai_messages
  for select to authenticated
  using (
    student_id = public.my_student_id()
    or public.is_admin()
    or exists (
      select 1 from public.students s
       where s.id = ai_messages.student_id and public.teaches_class(s.class)
    )
  );

drop policy if exists ai_messages_write_own on public.ai_messages;
create policy ai_messages_write_own on public.ai_messages
  for insert to authenticated
  with check (student_id = public.my_student_id());

-- a student cannot delete or rewrite the transcript
revoke update, delete on public.ai_messages from anon, authenticated;

-- ---------- flood control ----------
create or replace function public.ai_message_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.take_rate_limit('ai:' || new.student_id::text, 60, 3600) then
    raise exception 'rate_limited' using errcode = '42901';
  end if;
  return new;
end $$;

drop trigger if exists ai_messages_guard on public.ai_messages;
create trigger ai_messages_guard before insert on public.ai_messages
  for each row execute function public.ai_message_guard();

-- ---------- the nickname ----------
create or replace function public.set_ai_nickname(p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_student uuid := public.my_student_id();
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_student is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  if char_length(v_name) < 2 then raise exception 'nickname_short'; end if;
  if char_length(v_name) > 24 then raise exception 'nickname_long'; end if;
  if v_name ~ '[<>{}\[\]|\\/@#$%^&*+=~`]' then raise exception 'nickname_chars'; end if;
  if v_name ~ '[[:cntrl:]]' then raise exception 'nickname_chars'; end if;

  update public.students set ai_nickname = v_name where id = v_student;
  return v_name;
end $$;

-- ---------- reading and writing the conversation -------------
create or replace function public.ai_history(p_limit int default 40)
returns table (role text, content text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.role, m.content, m.created_at
    from public.ai_messages m
   where m.student_id = public.my_student_id()
   order by m.created_at desc
   limit greatest(1, least(coalesce(p_limit, 40), 100));
$$;

create or replace function public.log_ai_message(p_role text, p_content text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_student uuid := public.my_student_id(); v_id uuid;
begin
  if v_student is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_role not in ('user', 'assistant') then raise exception 'bad_role'; end if;
  if char_length(trim(coalesce(p_content, ''))) = 0 then raise exception 'empty_message'; end if;

  insert into public.ai_messages (student_id, role, content)
  values (v_student, p_role, left(p_content, 2000))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.set_ai_nickname(text) from public, anon, authenticated;
revoke all on function public.ai_history(int) from public, anon, authenticated;
revoke all on function public.log_ai_message(text, text) from public, anon, authenticated;
grant execute on function public.set_ai_nickname(text) to authenticated;
grant execute on function public.ai_history(int) to authenticated;
grant execute on function public.log_ai_message(text, text) to authenticated;
