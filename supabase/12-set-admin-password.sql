-- 12-set-admin-password.sql — give the two office accounts a password so they
-- can sign in while email is broken. This sets a password only; it changes no
-- one's role.
--
-- ================== HOW TO RUN IT ==================
-- 1. Supabase → SQL Editor → New query
-- 2. Paste this file
-- 3. Change ONLY the text between the quotes on the marked line below.
--    It must be at least 12 characters and used nowhere else.
-- 4. Run.
-- ---------------------------------------------------

do $$
declare
  v_password text := 'CHANGE-ME-12-chars-min';   -- <<< EDIT THIS LINE
  v_emails   text[] := array[
    '14101ghsspandi@gmail.com',
    'ziyadahmad778@gmail.com'
  ];
  v_hit integer;
begin
  if v_password = 'CHANGE-ME-12-chars-min' then
    raise exception using
      message = 'Stop: the marked line still holds the placeholder password.',
      detail  = 'This message is the file protecting you, not a fault. Replace CHANGE-ME-12-chars-min on the marked line with a real password of 12 or more characters (keep the quotes), then Run again.',
      hint    = 'If every account received the placeholder, that password would be public — this file is published on GitHub — so it refuses until you choose a real one.';
  end if;

  if length(v_password) < 12 then
    raise exception using
      message = format('Stop: the password has %s characters, 12 or more are needed.', length(v_password)),
      hint    = 'Make it longer on the marked line and Run again.';
  end if;

  update auth.users u
     set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(u.email_confirmed_at, now()),
         updated_at = now()
   where lower(u.email) = any (select lower(e) from unnest(v_emails) as e);

  get diagnostics v_hit = row_count;

  if v_hit = 0 then
    raise exception using
      message = 'Stop: neither office address has an account yet.',
      detail  = 'Create both in Authentication → Users → Add user, tick Auto Confirm User, save, then Run this file again.',
      hint    = 'Addresses tried: ' || array_to_string(v_emails, ', ');
  end if;

  raise notice 'Password set for % account(s).', v_hit;
end $$;

-- What the accounts look like now.
select p.email, p.role, p.status,
       (u.email_confirmed_at is not null) as address_confirmed,
       (u.encrypted_password is not null) as has_password
  from public.profiles p
  join auth.users u on u.id = p.id
 where lower(p.email) in ('14101ghsspandi@gmail.com', 'ziyadahmad778@gmail.com')
 order by p.email;

-- ---------- If you would rather paste one plain statement ----------
-- Replace OnlyNewPasswordKeepTheQuotes with the real password, then run:
--
--   update auth.users
--      set encrypted_password = extensions.crypt('OnlyNewPasswordKeepTheQuotes', extensions.gen_salt('bf')),
--          email_confirmed_at = coalesce(email_confirmed_at, now())
--    where lower(email) in ('14101ghsspandi@gmail.com', 'ziyadahmad778@gmail.com');
--
-- Notes
--   • Only a bcrypt hash is stored, so this file is safe to re-run and safe to
--     keep in the repository.
--   • Tell each admin the password by phone or in person. Never mail it from
--     this project — that is the part that is broken.
--   • Re-run the file with a new password whenever the old one spreads too far.
