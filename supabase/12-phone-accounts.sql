-- 12-phone-accounts.sql
-- Lets a student register with only a mobile number, which is how SMS codes work:
-- auth.users then has no email, so profiles.email must allow null.
-- Safe to re-run.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    raise exception 'public.profiles is missing - run supabase/01-schema.sql first, then this file';
  end if;
end $$;

alter table public.profiles alter column email drop not null;

-- One address may still belong to only one account, but many accounts may have
-- no address at all, so the rule becomes a partial unique index.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_email_key' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_email_key;
  end if;
end $$;

create unique index if not exists profiles_email_uniq
  on public.profiles (lower(email))
  where email is not null and email <> '';

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
  -- Phone sign-ups have no address in auth.users, so fall back to the one the
  -- form put in the metadata; empty means "no email on record".
  v_email   text := nullif(lower(coalesce(new.email, new.raw_user_meta_data ->> 'email', '')), '');
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

-- Keep a mobile number from opening two accounts.
create unique index if not exists profiles_phone_uniq
  on public.profiles (phone)
  where phone is not null and phone <> '';

comment on column public.profiles.email is
  'Optional for SMS accounts; unique when present.';
