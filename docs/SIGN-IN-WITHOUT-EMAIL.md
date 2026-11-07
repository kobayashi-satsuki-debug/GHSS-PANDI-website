# Signing in when email does not work

Email delivery is broken on this project, so anything that depends on a mailed
link or code is blocked. For a **single named account** there is a way in that
needs no email and puts no secret in the website or the repository.

## One account, one password — SQL Editor

Supabase → **SQL Editor** → New query → paste, replacing both values:

```sql
update auth.users
set encrypted_password = extensions.crypt('Pandi-Office-2026!', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email = 'kottumbaz@gmail.com';
```

Run it, then sign in on the normal login form with that password. The account is
marked confirmed in the same statement, so no confirmation mail is needed.

Notes:

- Use at least 12 characters. Never reuse a password from anywhere else.
- Only the hash is stored, so the query can be run again to change the password.
- If the address is not in `auth.users` yet, this updates nothing. Register it
  once, or create it in **Authentication → Users → Add user** (with
  *Auto Confirm User* ticked), then run the query.
- Run the same statement for any other account that is locked out, one address at
  a time.

## Why not a shared six-digit code

A code like `880055` in `js/` is readable by every visitor, and this repository is
public. It would be a master key for whichever account it unlocks, and the
database could not tell who used it. A per-account password wrote above is
narrower: it unlocks exactly one mailbox's account, and it is stored as a hash in
the one place that is not published.

If a code-style entry is wanted later, it must live server-side as a one-time
value (an Edge Function holding the service-role key, with the code stored hashed
and burnt after use) — never in the browser bundle.

## While SMTP stays broken

- Students: turn **Confirm email** off, then registration completes with no mail
  (`docs/EMAIL-TEMPLATES.md` §6b).
- Teachers and parents: set a password with the query above.
- Fix the sender when the office can: `docs/EMAIL-TEMPLATES.md` §6a lists the
  four SMTP failures and which field each one blames.
