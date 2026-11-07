# Supabase checklist for G H S S Pandi

Project: `ljpwzkmniocjpcijuuoq` — dashboard at
`https://supabase.com/dashboard/project/ljpwzkmniocjpcijuuoq`

Work down the list once. Everything is set in the dashboard or the SQL editor;
nothing here is done from the website code.

## 1. Authentication → Providers → Email

- [ ] Email provider: **on**
- [ ] Confirm email: **on** — or **off** as a temporary bridge while SMTP is broken
      (see `docs/EMAIL-TEMPLATES.md` §6b)
- [ ] Email OTP Length: `6`
- [ ] Email OTP Expiration: `600`

## 2. Authentication → URL Configuration

Site URL:

```
https://kobayashi-satsuki-debug.github.io/ghss-pandi-website/
```

Redirect URLs, one per line:

```
https://kobayashi-satsuki-debug.github.io/ghss-pandi-website/**
http://localhost:8080/**
http://localhost:8099/**
http://127.0.0.1:8080/**
```

Add these two after the custom domain points at Pages:

```
https://ghsspandi.org.in/**
https://www.ghsspandi.org.in/**
```

- [ ] Site URL saved
- [ ] Each redirect URL added with **Add URL** (no stray spaces)

## 3. Authentication → Emails

- [ ] **Confirm signup** template sends `{{ .Token }}`, not `{{ .ConfirmationURL }}`
- [ ] **Reset password** template sends `{{ .Token }}` too

Ready-made templates: `docs/EMAIL-TEMPLATES.md` §1 and §2.

## 4. Authentication → SMTP Settings

- [ ] Custom SMTP added (Brevo / Resend / Zoho, or Gmail with an app password)
- [ ] Sender address is a verified mailbox, e.g. `14101ghsspandi@gmail.com`
- [ ] Test code arrives within a minute
- [ ] Rate limits → Emails per hour raised to about `100`

The built-in mailer allows only a few messages an hour; a class registering
together will hit "Error sending confirmation email".

## 5. SQL Editor — run in this order

- [ ] `01-schema.sql`
- [ ] `02-security.sql`
- [ ] `03-rpc.sql`
- [ ] `04-seed.sql`
- [ ] `05-fix-students-unique.sql`
- [ ] `06-security-hardening.sql`
- [ ] `07-ai-buddy.sql`
- [ ] `09-resources.sql`
- [ ] `10-resource-roles.sql`
- [ ] `11-signup-trigger-fix.sql`

Files 05–11 are safe to re-run.

## 6. First administrator

Register `14101ghsspandi@gmail.com` on the site, then run:

```sql
select public.make_admin('14101ghsspandi@gmail.com');
```

- [ ] Done, and the account shows the moderation dashboard

## 7. Storage

- [ ] Bucket `resources` exists
- [ ] It is **private**
- [ ] Allowed type `application/pdf`, limit 20 MB

## 8. One line in the site

- [ ] `js/config.js` → `demoFallback: false`

## 9. Prove it works

```sql
select * from public.signup_report();   -- expect zero rows
```

- [ ] Student registers, receives six digits, activates
- [ ] Teacher registers, lands in **pending** until approved
- [ ] Parent registers, then waits for verification in the dashboard
- [ ] Forgot password sends a code and the new password works
- [ ] A PDF uploaded by a teacher opens for a student and is refused for a parent
