-- 13-two-admins.sql — give two people the admin role.
--
-- The schema has no limit on how many admins exist: every admin is simply a row
-- in public.profiles with role = 'admin'. This file promotes two named accounts
-- and reports what it found. Safe to re-run.

-- 1. Put the two school addresses here (they must already be registered, or be
--    created first in Authentication → Users → Add user with Auto Confirm).
with wanted(email) as (
  values
    ('first.admin@ghsspandi.in'),
    ('second.admin@ghsspandi.in')
)
update public.profiles p
   set role = 'admin',
       status = 'active'
  from wanted w
  join auth.users u on lower(u.email) = lower(w.email)
 where p.id = u.id
returning p.email, p.full_name, p.role, p.status;

-- 2. Who is an admin now.
select p.email, p.full_name, p.status, p.created_at
  from public.profiles p
 where p.role = 'admin'
 order by p.created_at;

-- 3. Anything still missing? These addresses have no account yet.
with wanted(email) as (
  values
    ('first.admin@ghsspandi.in'),
    ('second.admin@ghsspandi.in')
)
select w.email as missing_account
  from wanted w
 where not exists (select 1 from auth.users u where lower(u.email) = lower(w.email));

-- 4. Demote someone (run by hand when needed).
-- update public.profiles set role = 'teacher' where lower(email) = lower('someone@ghsspandi.in');
