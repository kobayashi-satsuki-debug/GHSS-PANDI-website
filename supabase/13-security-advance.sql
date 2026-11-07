-- 13-security-advance.sql — harder server rules on top of 02 and 06.
-- Safe to re-run. Run after 06-security-hardening.sql.

-- ---------- 1. Nobody promotes themselves ----------
-- 02 pins the role in the update policy, but a signed-in user could still flip
-- their own status to 'active' (skipping office approval) or move another
-- person's row. The column grants in section 2 make this impossible from the
-- browser; this trigger is the second lock, in case a grant is loosened later.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;                                  -- service role and migrations
  end if;
  if coalesce(public.is_admin(), false) then
    return new;                                  -- office changes go through RPCs
  end if;
  if auth.uid() <> old.id then
    raise exception 'You may only change your own profile.' using errcode = '42501';
  end if;
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'Role, status and email are set by the school.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_columns_trg on public.profiles;
create trigger guard_profile_columns_trg
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

revoke all on function public.guard_profile_columns() from anon, authenticated, public;

-- ---------- 2. Column-level write access ----------
-- The browser never writes profiles directly, so signed-in users get the two
-- harmless columns and nothing else. Real changes run through the
-- security-definer RPCs in 03-rpc.sql, which are owned by the table owner.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Class records are teacher/RPC territory: a student who could edit their own
-- class and roll number would be reading another class's results.
do $$
declare t text;
begin
  foreach t in array array['students', 'teachers', 'parents']
  loop
    if exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = t) then
      execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- The AI nickname lives on students and is the one thing a student owns.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'students'
                and column_name = 'ai_nickname') then
    grant update (ai_nickname) on public.students to authenticated;
  end if;
end $$;

-- ---------- 3. No writes at all from the anonymous visitor ----------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'students', 'teachers', 'parents',
                           'parent_student_links', 'class_rooms', 'class_teachers',
                           'notices', 'results', 'chat_messages', 'chat_reports',
                           'moderation_log', 'gallery_items', 'achievements',
                           'admission_enquiries', 'resources', 'security_log']
  loop
    if exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = t) then
      execute format('revoke insert, update, delete on public.%I from anon', t);
    end if;
  end loop;
end $$;

-- ---------- 4. Every public table must have row level security on ----------
-- A table added later without RLS is readable by anyone holding the anon key.
do $$
declare r record;
begin
  for r in select tablename from pg_tables
            where schemaname = 'public' and not rowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    raise notice 'row level security enabled on public.%', r.tablename;
  end loop;
end $$;

-- ---------- 5. Audit every role and status change ----------
-- moderation_log covers chat and uploads; this adds account changes so the
-- office can answer "who made this person a teacher, and when?".
create or replace function public.log_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    insert into public.security_log(actor_id, actor_role, action, target, details)
    values (auth.uid(),
            (select role::text from public.profiles where id = auth.uid()),
            'account_change',
            coalesce(old.email, old.id::text),
            'role ' || old.role::text || ' -> ' || new.role::text ||
            ', status ' || old.status::text || ' -> ' || new.status::text);
  end if;
  return new;
end $$;

drop trigger if exists log_profile_change_trg on public.profiles;
create trigger log_profile_change_trg
  after update on public.profiles
  for each row execute function public.log_profile_change();

revoke all on function public.log_profile_change() from anon, authenticated, public;

-- ---------- 6. Report ----------
select 'columns a signed-in user may update on profiles' as check_name,
       coalesce(string_agg(column_name, ', ' order by column_name), 'none') as detail
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
union all
select 'public tables without row level security',
       coalesce((select string_agg(tablename, ', ') from pg_tables
                  where schemaname = 'public' and not rowsecurity), 'none')
union all
select 'account-change audit trigger',
       (select count(*)::text from pg_trigger where tgname = 'log_profile_change_trg')
union all
select 'profile guard trigger',
       (select count(*)::text from pg_trigger where tgname = 'guard_profile_columns_trg');
