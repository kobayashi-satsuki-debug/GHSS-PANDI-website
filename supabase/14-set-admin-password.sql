-- 14-set-admin-password.sql — let the two admins sign in while email is broken.
--
-- Supabase → SQL Editor → New query → paste this file → change v_password →
-- Run. Both accounts get the same password, marked confirmed, so no mail is
-- needed. They can change it later from the site once SMTP works.
--
-- Nothing secret lives in this file: the value below is a placeholder that the
-- script refuses to run until you replace it.

do $$
declare
  v_password text := 'CHANGE-ME-12-chars-min';
  v_emails   text[] := array[
    '14101ghsspandi@gmail.com',
    'ziyadahmad778@gmail.com'
  ];
  v_hit integer;
begin
  if v_password = 'CHANGE-ME-12-chars-min' then
    raise exception 'Edit v_password first: put a real password of 12 or more characters.';
  end if;
  if length(v_password) < 12 then
    raise exception 'Use at least 12 characters (got %).', length(v_password);
  end if;

  update auth.users u
     set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(u.email_confirmed_at, now()),
         updated_at = now()
   where lower(u.email) = any (select lower(e) from unnest(v_emails) as e);

  get diagnostics v_hit = row_count;

  if v_hit = 0 then
    raise exception 'No account matched %. Create them in Authentication → Users → Add user (Auto Confirm User), then run again.', array_to_string(v_emails, ', ');
  end if;

  raise notice 'Password set for % account(s): %', v_hit, array_to_string(v_emails, ', ');
end $$;

-- Who can now sign in, and with which role.
select p.email, p.role, p.status,
       (u.email_confirmed_at is not null) as address_confirmed
  from public.profiles p
  join auth.users u on u.id = p.id
 where lower(p.email) in ('14101ghsspandi@gmail.com', 'ziyadahmad778@gmail.com')
 order by p.email;

-- Follow-up notes
--   • Tell each admin the password by phone, in person, or by another app —
--     never by mail from this project, because that is the part that is broken.
--   • Change it inside Supabase again with this same file whenever it is shared
--     too widely. Only the bcrypt hash is stored, so the file is safe to re-run.
--   • Accounts missing from the list above do not exist yet; add them first.
