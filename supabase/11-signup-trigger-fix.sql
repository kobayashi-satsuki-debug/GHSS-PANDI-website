-- =============================================================
-- G H S S PANDI — fix "Database error saving new user"
-- Run this in the Supabase SQL editor AFTER 01-schema.sql.
-- Safe to re-run.
--
-- Supabase returns "Database error saving new user" (HTTP 500) whenever the
-- trigger on auth.users raises. Before this file, one bad child row (a
-- duplicate class + roll number, a role value that is not in the enum, a
-- missing table) aborted the whole sign-up. The trigger now refuses to fail:
-- it writes the profile, and any problem with the optional student / teacher /
-- parent row is logged as a warning instead of blocking the account.
-- =============================================================

-- 1. Fail loudly and helpfully if the base schema was never applied.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'profiles table is missing — run supabase/01-schema.sql first, then this file';
  end if;
end $$;

-- 2. Make sure every role the site sends exists in the enum.
do $$
begin
  if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                  where t.typname = 'app_role' and e.enumlabel = 'parent') then
    alter type public.app_role add value if not exists 'parent';
  end if;
  if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                  where t.typname = 'app_role' and e.enumlabel = 'admin') then
    alter type public.app_role add value if not exists 'admin';
  end if;
end $$;

-- 3. The trigger itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  v_role    public.app_role;
  v_status  public.account_status;
  v_email   text := lower(coalesce(new.email, ''));
  v_name    text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  v_phone   text := coalesce(new.raw_user_meta_data ->> 'phone', '');
begin
  -- Anything that is not one of the three public roles becomes a student.
  meta_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'student'));
  if meta_role not in ('student', 'teacher', 'parent') then
    meta_role := 'student';
  end if;
  v_role := meta_role::public.app_role;
  v_status := case when v_role = 'teacher'
                   then 'pending'::public.account_status
                   else 'active'::public.account_status end;
  if v_role = 'teacher' and meta_role <> 'teacher' then
    v_status := 'active'::public.account_status;
  end if;

  insert into public.profiles (id, email, full_name, role, phone, status)
  values (new.id, v_email, v_name, v_role, v_phone, v_status)
  on conflict (id) do update
     set email     = excluded.email,
         full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
         phone     = coalesce(nullif(excluded.phone, ''), public.profiles.phone);

  -- The child row is a convenience, never a reason to refuse the account.
  begin
    if v_role = 'student' then
      insert into public.students (profile_id, full_name, class, roll_no, admission_no, status)
      values (new.id,
              coalesce(nullif(v_name, ''), 'Student'),
              coalesce(new.raw_user_meta_data -> 'extra' ->> 'class', ''),
              coalesce(new.raw_user_meta_data -> 'extra' ->> 'roll_no', ''),
              new.raw_user_meta_data -> 'extra' ->> 'admission_no',
              'pending')
      on conflict (profile_id) do nothing;
    elsif v_role = 'teacher' then
      insert into public.teachers (profile_id, full_name, employee_no, subject, designation, status)
      values (new.id,
              coalesce(nullif(v_name, ''), 'Teacher'),
              nullif(new.raw_user_meta_data -> 'extra' ->> 'employee_no', ''),
              coalesce(new.raw_user_meta_data -> 'extra' ->> 'subject', ''),
              'HSA', 'pending')
      on conflict (profile_id) do nothing;
    elsif v_role = 'parent' then
      insert into public.parents (profile_id, full_name, phone)
      values (new.id, coalesce(nullif(v_name, ''), 'Parent'), v_phone)
      on conflict (profile_id) do nothing;
    end if;
  exception when others then
    -- e.g. the same class + roll number is already taken: keep the account,
    -- the office can correct the record from the dashboard.
    raise warning 'handle_new_user: child row skipped for % (%)', v_email, sqlerrm;
  end;

  return new;
exception when others then
  -- last resort: an account without a profile still signs in, and
  -- repair_signup() below can fill the gap afterwards.
  raise warning 'handle_new_user failed for %: %', v_email, sqlerrm;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Repair accounts created while the trigger was broken.
--    Run in the SQL editor:
--      select public.repair_signup('someone@example.com');   -- one account
--      select public.repair_signup();                        -- every gap
create or replace function public.repair_signup(p_email text default null)
returns table (email text, action text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  v_role public.app_role;
  v_name text;
  v_meta_role text;
begin
  for u in
    select au.id, lower(au.email) as email, au.raw_user_meta_data as meta
      from auth.users au
     where au.email is not null
       and (p_email is null or lower(au.email) = lower(p_email))
       and not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    v_name := coalesce(u.meta ->> 'full_name', '');
    v_meta_role := lower(coalesce(u.meta ->> 'role', 'student'));
    if v_meta_role not in ('student', 'teacher', 'parent') then
      v_meta_role := 'student';
    end if;
    v_role := v_meta_role::public.app_role;

    insert into public.profiles (id, email, full_name, role, phone, status)
    values (u.id, u.email, v_name, v_role,
            coalesce(u.meta ->> 'phone', ''),
            case when v_role = 'teacher' then 'pending'::public.account_status
                 else 'active'::public.account_status end)
    on conflict (id) do nothing;

    email := u.email;
    action := 'profile created';
    return next;
  end loop;
end $$;

revoke all on function public.repair_signup(text) from anon, authenticated;

-- 5. See what is wrong without guessing. Run in the SQL editor:
--      select * from public.signup_report();
create or replace view public.signup_report as
select 'auth user without profile' as problem,
       lower(au.email) as detail,
       au.created_at
  from auth.users au
 where au.email is not null
   and not exists (select 1 from public.profiles p where p.id = au.id)
union all
select 'duplicate class and roll number',
       format('%s / %s (%s rows)', s.class, s.roll_no, count(*)),
       max(s.created_at)
  from public.students s
 where s.class <> '' and s.roll_no <> ''
 group by s.class, s.roll_no
having count(*) > 1;

revoke all on public.signup_report from anon, authenticated;
