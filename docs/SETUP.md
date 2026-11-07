# G H S S Pandi — setup and publishing guide

Trilingual (English / Malayalam / Kannada) school website with student, teacher and parent
portal, results publishing, moderated class chat and an administration dashboard.

School: Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala 671543
Phone: 9446553567 · Email: 14101ghsspandi@gmail.com
Planned domain: ghsspandi.org.in

---

## CSV exports

Every list in the dashboard has its own **Export CSV** button: Students,
Accounts, Teacher approvals, Parent requests, School notices, Admissions inbox
and Moderation history. Each downloads a separate file named
`ghss-pandi-<section>-<date>.csv`. Files open in Excel and keep Malayalam and
Kannada text (UTF-8 with BOM). Exports are built from the rows RLS already
returned for that role — no extra permission is granted, and teacher exports
cover only assigned classes.

## 1. What is in the folder

```
index.html            Home page
about.html            About the school
admissions.html       Admissions + enquiry form
gallery.html          Photo gallery
creative.html         Creative corner — tailoring, electrical, plumbing and craft
achievements.html     Student achievements
faculty.html          Teachers and office staff
notices.html          Notice board
results.html          Result lookup (students, parents, teachers)
login.html            Sign in (student / teacher / parent tabs)
register.html         Registration (student / teacher / parent tabs)
reset.html            Password reset and recovery
dashboard.html        Role dashboard (students, teachers, parents, admin)
ai.html               AI study buddy page (students only)
resources.html        PDF notes, read-only (students, teachers, staff only)
upload.html           Upload and delete PDF notes (teachers and headmaster only)
staff.html            Headmaster / headmistress / staff sign-in
chat.html             Moderated class group chat
css/style.css         All styling
js/config.js          School details and Supabase keys  ← edit this
js/ai.js              AI study buddy answers (study-note knowledge base)
js/pages/ai.js        AI study buddy page logic
js/pages/resources.js PDF notes viewer logic
js/pages/upload.js    PDF notes upload page logic
js/pages/staff.js     Staff sign-in page logic
js/i18n.js            English / Malayalam dictionary and language switching
js/lang-kn.js          Kannada dictionary (keyed by the English string)
js/backend-demo.js    Preview mode (data kept in this browser)
js/backend-supabase.js Live mode (Supabase)
js/api.js             Chooses preview or live backend
supabase/*.sql        Database schema, security, functions, seed data
docs/EMAIL-TEMPLATES.md  Code-only email templates to paste into Supabase
assets/               School crest and gallery images
```

## 2. Preview mode vs live mode

With no Supabase keys configured the site runs in **preview mode**: accounts and
data live only in that browser (useful for showing the site). A banner says so.

To go live, fill in `js/config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://YOURPROJECT.supabase.co',
  anonKey: 'YOUR-ANON-PUBLIC-KEY',
  demoFallback: false
};
```

Only the **anon public** key belongs in the browser. Never paste the
`service_role` key into any file — it bypasses every security policy.

## 2a. Registration codes (OTP)

Every registration is verified with a 6-digit code before the account is
created, in preview mode and in live mode.

* **Preview mode** shows the code on the screen (for showing the site offline).
* **Live mode** uses Supabase's email OTP. In Supabase → Authentication → Email
  Templates → **Confirm signup**, keep `{{ .Token }}` in the message body, so the
  six digits are sent instead of a magic link. Templates that only contain
  `{{ .ConfirmationURL }}` cannot be typed into the code box.
* Keep **Confirm email** enabled (Authentication → Providers → Email). If it is
  turned off, Supabase returns a session immediately and the code step is
  skipped — accounts then exist without a verified email address.
* The code expires after 10 minutes; five wrong tries cancel the pending
  sign-up and the person registers again. "Resend code" is limited to one
  request a minute (Supabase enforces its own rate limit on top).
* The school can see which accounts still wait for approval in the admin
  dashboard → Teacher approvals / Accounts.

## 3. Create the Supabase database

1. Create a project at supabase.com (region: Mumbai / Singapore; free tier is
   enough to start).
2. Open **SQL Editor** and run the files in this order:
   1. `supabase/01-schema.sql` — tables, enums, realtime
   2. `supabase/02-security.sql` — row level security policies
   3. `supabase/03-rpc.sql` — functions used by the site
   4. `supabase/04-seed.sql` — classes and sample notices
   5. `supabase/05-fix-students-unique.sql` — makes the class/roll number
      unique index partial, so two sign-ups that leave class and roll blank no
      longer collide (`duplicate key ... students_class_roll_no_key`). Safe to
      re-run; run it on its own if the project already has the older schema.
   6. `supabase/06-security-hardening.sql` — rate limits on the enquiry form and
      chat reports, a role/status change guard, and the `security_log` audit
      table. Safe to re-run. See [SECURITY.md](SECURITY.md).
   7. `supabase/07-ai-buddy.sql` — the student AI study buddy: the
      `students.ai_nickname` column, the `ai_messages` table and the
      `set_ai_nickname` / `ai_history` / `log_ai_message` functions. Students can
      only read and write their own rows. Safe to re-run. Without it the AI pane
      still opens but saving a nickname fails with "sign in again".
   8. `supabase/09-resources.sql` — PDF notes: the `resources` table, its
      policies, and the private `resources` storage bucket (20 MB per file,
      PDF only). Safe to re-run.
   9. `supabase/10-resource-roles.sql` — narrows who may read the notes to
      students, teachers and staff (`can_read_resources()`), so parent accounts
      cannot open the library. Safe to re-run.
   10. `supabase/11-signup-trigger-fix.sql` — makes the sign-up trigger unable to
      fail the whole registration, whitelists the role value, and adds
      `repair_signup()` plus the `signup_report` view. Safe to re-run. Run it if
      registration ever answers "Database error saving new user".
   11. `supabase/13-security-advance.sql` — optional but recommended. Stops
       anyone editing their own role, status or class, makes class records
       read-only for users, turns on RLS everywhere, and starts an audit trail
       of account changes. See `docs/SECURITY-HARDENING.md`. Safe to re-run.
   12. `supabase/14-profile-edit.sql` — lets a signed-in student, parent or
       teacher correct their own name and phone from **My profile**, while
       class, roll number, email and role stay office-only. Safe to re-run.
   13. `supabase/12-set-admin-password.sql` — optional. Edit `v_password`, run
       it, and the two office accounts can sign in without email (the address is
       marked confirmed at the same time). Refuses to run on the placeholder or
       on fewer than 12 characters; safe to re-run to change the password.
3. In **Authentication → URL configuration** set:
   - Site URL: `https://kobayashi-satsuki-debug.github.io/ghss-pandi-website/`
     while the site is on GitHub Pages, then change it to
     `https://ghsspandi.org.in` once the custom domain is live.
   - Redirect URLs, one line each (add the last two after the domain is live):
     ```
     https://kobayashi-satsuki-debug.github.io/ghss-pandi-website/**
     http://localhost:8080/**
     http://localhost:8099/**
     http://127.0.0.1:8080/**
     https://ghsspandi.org.in/**
     https://www.ghsspandi.org.in/**
     ```
   The site only sends a redirect from `localhost`, `127.0.0.1`, a `github.io`
   host, or a host ending in `ghsspandi.org.in` (see `redirectUrl()` in
   `js/backend-supabase.js`), so the entries above cover every page and every
   local preview port. On GitHub Pages the redirect keeps the
   `/ghss-pandi-website/` folder, which is why the wildcard is written after the
   folder and not after the host. Use the full origin with scheme — a bare
   hostname is rejected — and watch for stray spaces when pasting.
4. In **Authentication → Emails** replace the *Confirm signup* and *Reset
   password* templates so they send `{{ .Token }}` (a 6-digit code) instead of
   `{{ .ConfirmationURL }}`. Copy the ready-made templates from
   [EMAIL-TEMPLATES.md](EMAIL-TEMPLATES.md), and set Email OTP Expiration to
   `600` seconds and Email OTP Length to `6`. Registration and password reset
   then work by typing the code — no links at all.
5. In **Storage** confirm the bucket `resources` is **private** (the SQL creates
   it that way). Students get ten-minute signed links, so a copied URL stops
   working.
6. Copy the project URL and anon key into `js/config.js`, set
   `demoFallback: false`, and reload the site.

### Make the first administrator

Register normally on the site with the school's own email, then run once in the
SQL editor:

```sql
select public.make_admin('14101ghsspandi@gmail.com');
```

Use a school-owned mailbox, not a personal one. Afterwards that account can
approve teachers and verify parents from the dashboard.

## 4. How the roles work

| Role | Can do |
| --- | --- |
| student | See own results, own class chat, own profile |
| teacher | Publish results for assigned classes, manage notices, moderate chat, add gallery and achievements — only after admin approval |
| parent | See results of children the school has verified; request a child link |
| admin | Everything, plus teacher approvals, parent verification, accounts, classes, admissions inbox, moderation history |

Roles are stored in `profiles.role` in the database and enforced by row level
security and `security definer` functions, so editing the browser cannot change
what a signed-in account is allowed to read or write.

### Teacher registration
A teacher registers with name, staff ID and subject. The account is created with
status `pending` and cannot sign in usefully until an administrator approves it
in **Dashboard → Teacher approvals**.

### Parent verification
Parents register themselves, then add their child from **Dashboard → My
children** using class and roll number. The request appears in
**Dashboard → Parent requests**. Only after the office verifies the relationship
can that parent see the student's results.

### Results
Teachers (or admin) open **Dashboard → Publish results**, pick the class and
exam, add subject/mark rows and publish. Students see their own results on
`results.html`; parents see verified children; teachers see their classes.

## 5. Chat moderation
Class chat is stored in `chat_messages` with one room per class, delivered in
real time through Supabase Realtime. Students can report a message. Teachers and
admins see reports in **Dashboard → Chat moderation**, can hide the message and
resolve or dismiss the report. Every action is written to `moderation_log`.

## 6. Publish the website

Any static host works — there is no build step.

### Option A: Netlify (simple, free)
1. Netlify → **Add new site → Deploy manually**, drag the project folder.
2. Add custom domain `ghsspandi.org.in`, then at the domain registrar point DNS to
   Netlify (A record + `www` CNAME as Netlify instructs).
3. Enable HTTPS (automatic) and force HTTPS.

### Option B: Vercel
1. `npm i -g vercel` (or use the dashboard), then run `vercel` in this folder.
2. Add the domain in **Settings → Domains** and follow the DNS records shown.

### Option C: GitHub Pages (the current setup)
The repository already contains a `CNAME` file with `ghsspandi.org.in`, and
Pages serves the `main` branch. The site only opens once DNS points at GitHub:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `kobayashi-satsuki-debug.github.io` |

Then in the repository: **Settings → Pages → Custom domain** `ghsspandi.org.in`,
wait for the DNS check to pass and tick **Enforce HTTPS**. Until the A records
exist, GitHub redirects every page to `ghsspandi.org.in`, which does not resolve
yet — that is why the GitHub Pages URL shows no site.

### Custom domain checklist
- [ ] Apex `ghsspandi.org.in` points to the host
- [ ] `www` redirects to the apex (or the reverse)
- [ ] HTTPS certificate issued
- [ ] Supabase Site URL and redirect URLs updated to the live domain
- [ ] Test: register, sign in, publish a result, view it, post in chat

## 7. Practical notes for the school office

- Photographs of students need parent consent before publishing on the gallery.
- Results are private: never post a class-wide result sheet in chat or notices.
- Keep the admin list short (principal, office superintendent, one IT teacher).
- Take a Supabase database backup before each term's result publishing.
- If an account is compromised, admin can disable it in **Dashboard → Accounts**.

## 7a. "Database error saving new user"

Supabase sends this message whenever the trigger on `auth.users` raises, so one
bad row blocks the account. In this project the usual causes are:

| Cause | What you see |
| --- | --- |
| The same class + roll number is already taken (unique index `students_class_roll_idx`) | the second student cannot register at all |
| A role value that is not student / teacher / parent | registration fails before a profile exists |
| `01-schema.sql` was never run, or `profiles` lives in another schema | every registration fails |

Fix, in this order:

1. Run `supabase/11-signup-trigger-fix.sql` in the SQL editor. From then on the
   profile is written first, and a bad child row becomes a warning instead of a
   failed sign-up.
2. Look at what is left over:
   ```sql
   select * from public.signup_report();
   ```
3. Fill in any account that was created without a profile:
   ```sql
   select public.repair_signup('someone@example.com');
   select public.repair_signup();          -- all of them
   ```
4. If it still fails, read **Logs → Postgres** (filter `handle_new_user`) or
   **Logs → Auth** for the real error text, and check that
   `Authentication → Providers → Email → Confirm email` is on.

The unique index on class + roll number is intentional: it stops two people
claiming the same seat. The office should check the class list before a student
registers, and correct mistakes from **Dashboard → Accounts**.

## 8. Local check

```bash
python3 -m http.server 8099
# open http://localhost:8099
```

Preview accounts (preview mode only, password `pandi2026`):
`student@ghsspandi.org.in`, `teacher@ghsspandi.org.in`, `parent@ghsspandi.org.in`,
`principal@ghsspandi.org.in`.
