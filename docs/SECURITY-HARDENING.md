# Security, advanced level

Everything below is already in the project. Two of the layers only take effect
after you run one SQL file in Supabase.

## 1. Run this once

Supabase → **SQL Editor** → paste `supabase/13-security-advance.sql` → **Run**.

It ends with a small report table. Expect:

| check_name | expected |
| --- | --- |
| columns a signed-in user may update on profiles | `full_name, phone` |
| public tables without row level security | `none` |
| account-change audit trigger | `1` |
| profile guard trigger | `1` |

Safe to re-run at any time.

What it changes:

- **No self-promotion.** A signed-in user can no longer set their own `status`,
  `role`, `email` or `created_at`. The policy in `02-security.sql` already
  pinned the role; this also blocks the status flip that skipped office
  approval, and the trigger `guard_profile_columns` is a second lock in case a
  grant is loosened by a later file.
- **Column-level writes.** `authenticated` keeps UPDATE on `full_name` and
  `phone` only. Every real change goes through the security-definer RPCs in
  `03-rpc.sql` (which still work — verified).
- **Class records are read-only for users.** `students`, `teachers` and
  `parents` accept no INSERT/UPDATE/DELETE from `anon` or `authenticated`, so a
  student cannot rewrite their class or roll number to read another class's
  results. The one exception is `students.ai_nickname`, which the student owns.
- **Anonymous visitors cannot write** to any public table.
- **RLS is turned on** for any public table that was missing it — including
  tables added in future.
- **Account changes are audited** into `public.security_log`
  (`action = 'account_change'`) with the actor, the address, and the old → new
  role and status. Admins can read it; nobody else can.

## 2. Passwords

`js/security.js` now exposes `Security.checkPassword(pw)`:

- at least **12 characters**;
- refuses a list of common passwords and keyboard runs (`qwerty…`, `123456…`,
  one repeated character);
- refuses all-letters under 16 and all-digits.

Used by the registration form and the password-reset form, with messages in
English and Malayalam (`err.passwordShort`, `err.passwordCommon`,
`err.passwordPlain`).

`Security.randomPassword(32)` exists for one job: student accounts. Supabase
will not create a user without a password, so the register page generates 32
random characters, sends them with the sign-up and forgets them. Students sign
in with emailed codes only; the random value is not shown to anyone, not stored
by the site, and cannot be guessed.

## 3. Sign-in throttling

Five wrong attempts for one address inside ten minutes locks that address for
1 minute; each further failure doubles it, capped at 30 minutes. The block is
checked **before** the request leaves the browser, and a successful sign-in
clears the counter. Stored per browser in `localStorage` under
`ghss_signin_tries`.

This is a convenience barrier, not the real limit — Supabase's own auth rate
limits still apply server-side.

## 4. Browser rules

Every page now sends:

- `script-src-attr 'none'` — no inline `onclick=` handlers may run, so a
  injected attribute cannot execute code;
- `worker-src 'none'`, `child-src 'none'`, `media-src 'self'`,
  `manifest-src 'self'`;
- unchanged: `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests`, and a connect list
  limited to this origin plus the school's Supabase project;
- `<meta name="referrer" content="strict-origin-when-cross-origin">`.

Also still active from earlier work: 30-minute idle sign-out, frame busting,
the insecure-transport warning, and the honeypot + 3-second floor on public
forms.

## 5. What is still not covered here

- Real enforcement of codes and passwords happens in Supabase Auth. If SMTP is
  broken, email codes do not arrive, and no amount of client code fixes that.
- GitHub Pages cannot send custom headers (HSTS, `X-Frame-Options`,
  `Permissions-Policy`). The meta CSP is the part that travels with the site.
  A custom domain behind Cloudflare can add the rest.
- Throttling and the honey pot stop casual abuse, not a determined attacker
  with a script; the server-side rules in sections 1 and Supabase Auth are what
  actually hold.

## 6. Checking it yourself

1. Sign in as a student, open the browser console and run
   `await SB.from('profiles').update({ status: 'active' }).eq('id', SB.auth.user().id)`
   — it must fail with a permission error, not succeed.
2. Run the same statement as an admin — the `set_account_status` RPC still
   works, so the office is not locked out.
3. In the login form, enter a wrong password five times; the sixth attempt is
   refused with a wait message before the network request.
4. Try to register with `password123` — refused with the weak-password message.
