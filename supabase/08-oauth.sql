/* =========================================================
   G H S S PANDI — Google / OAuth sign-in support
   Run AFTER 01-schema.sql … 07-ai-buddy.sql.
   Safe to run more than once.

   Google (or any Supabase OAuth provider) proves the email.
   It does NOT decide the school role: the account still has to
   pick student, teacher or parent once, and the server checks
   that choice. Teachers stay "pending" until an admin approves.
   ========================================================= */

-- ---------- 0. mark accounts that still need to pick a role ----------
alter table public.profiles
  add column if not exists setup_complete boolean not null default true;

-- OAuth sign-ups arrive without a "role" in their metadata, so the profile
-- is created as a bare student and setup_complete stays false until
-- complete_oauth_profile() has run once.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role   public.app_role;
  v_status    public.account_status;
  v_needs_set boolean := (new.raw_user_meta_data ->> 'role') is null;
begin
  meta_role := coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'student');
  if meta_role = 'admin' then meta_role := 'student'; end if;
  v_status := case when meta_role = 'teacher' then 'pending'::public.account_status
                   else 'active'::public.account_status end;

  insert into public.profiles (id, email, full_name, role, phone, status, setup_complete)
  values (new.id,
          lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          meta_role,
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          v_status,
          not v_needs_set)
  on conflict (id) do update
     set email = excluded.email,
         full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name),
         phone = coalesce(nullif(excluded.phone,''), public.profiles.phone);

  if v_needs_set then
    return new;             -- role is chosen on oauth.html, rows added there
  end if;

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

-- ---------- 1. allow a one-time role choice for OAuth sign-ups -------
-- A brand new OAuth account is created by handle_new_user() as a
-- student. complete_oauth_profile() may set the real role once, and
-- marks that with a transaction-local setting the guard accepts.
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;                       -- service role / database owner
  end if;

  if new.role is distinct from old.role then
    if not public.is_admin()
       and coalesce(current_setting('ghss.role_setup', true), '') <> 'on' then
      raise exception 'role_change_denied' using errcode = '42501';
    end if;
    perform public.log_security('role_change', new.id::text, old.role::text || ' -> ' || new.role::text);
  end if;

  if new.status is distinct from old.status then
    if not public.is_staff()
       and coalesce(current_setting('ghss.role_setup', true), '') <> 'on' then
      raise exception 'status_change_denied' using errcode = '42501';
    end if;
    perform public.log_security('status_change', new.id::text, old.status::text || ' -> ' || new.status::text);
  end if;

  return new;
end $$;

-- ---------- 2. finish an OAuth sign-up ------------------------------
create or replace function public.complete_oauth_profile(
  p_role      text,
  p_full_name text,
  p_phone     text default '',
  p_class     text default '',
  p_roll      text default '',
  p_subject   text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_name    text := trim(coalesce(p_full_name, ''));
  v_role    public.app_role;
  v_phone   text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_student boolean := false;
  v_teacher boolean := false;
  v_parent  boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.id is null then
    raise exception 'no_profile' using errcode = '42501';
  end if;

  select exists (select 1 from public.students where profile_id = v_uid),
         exists (select 1 from public.teachers where profile_id = v_uid),
         exists (select 1 from public.parents  where profile_id = v_uid)
    into v_student, v_teacher, v_parent;

  -- already finished: just report the current state
  if v_profile.setup_complete and (v_student or v_teacher or v_parent) then
    return jsonb_build_object('role', v_profile.role, 'status', v_profile.status, 'already', true);
  end if;

  -- the choice is only open on a fresh account
  if v_profile.created_at < now() - interval '2 hours' then
    raise exception 'setup_expired' using errcode = '42501';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;
  if length(v_phone) > 0 and v_phone !~ '^[0-9]{10}$' then
    raise exception 'invalid_phone';
  end if;

  v_role := case lower(trim(coalesce(p_role, '')))
              when 'teacher' then 'teacher'::public.app_role
              when 'parent'  then 'parent'::public.app_role
              when 'student' then 'student'::public.app_role
              else null end;
  if v_role is null then
    raise exception 'invalid_role';   -- admin can never be self-assigned
  end if;

  perform set_config('ghss.role_setup', 'on', true);

  update public.profiles
     set role           = v_role,
         full_name      = v_name,
         phone          = v_phone,
         status         = case when v_role = 'teacher' then 'pending'::public.account_status
                               else 'active'::public.account_status end,
         setup_complete = true,
         updated_at     = now()
   where id = v_uid;

  if v_role = 'student' then
    if length(trim(coalesce(p_class, ''))) < 1 or length(trim(coalesce(p_roll, ''))) < 1 then
      raise exception 'invalid_student_details';
    end if;
    insert into public.students (profile_id, full_name, class, roll_no)
    values (v_uid, v_name, trim(p_class), trim(p_roll));
  elsif v_role = 'teacher' then
    insert into public.teachers (profile_id, full_name, subject)
    values (v_uid, v_name, left(trim(coalesce(p_subject, '')), 60));
  else
    insert into public.parents (profile_id, full_name, phone)
    values (v_uid, v_name, v_phone);
  end if;

  perform set_config('ghss.role_setup', 'off', true);
  perform public.log_security('oauth_setup', v_uid::text, v_role::text);

  return jsonb_build_object(
    'role', v_role,
    'status', case when v_role = 'teacher' then 'pending' else 'active' end,
    'already', false
  );
end $$;

revoke all on function public.complete_oauth_profile(text, text, text, text, text, text)
  from public, anon;
grant execute on function public.complete_oauth_profile(text, text, text, text, text, text)
  to authenticated;
