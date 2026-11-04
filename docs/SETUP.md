# G H S S Pandi — setup and publishing guide

Trilingual (English / Malayalam / Kannada) school website with student, teacher and parent
portal, results publishing, moderated class chat and an administration dashboard.

School: Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala 671543
Phone: 9446553567 · Email: 14101ghsspandi@gmail.com
Planned domain: ghsspandi.in

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
achievements.html     Student achievements
faculty.html          Teachers and office staff
notices.html          Notice board
results.html          Result lookup (students, parents, teachers)
login.html            Sign in (student / teacher / parent tabs)
register.html         Registration (student / teacher / parent tabs)
reset.html            Password reset and recovery
dashboard.html        Role dashboard (students, teachers, parents, admin)
chat.html             Moderated class group chat
css/style.css         All styling
js/config.js          School details and Supabase keys  ← edit this
js/i18n.js            English / Malayalam dictionary and language switching
js/lang-kn.js          Kannada dictionary (keyed by the English string)
js/backend-demo.js    Preview mode (data kept in this browser)
js/backend-supabase.js Live mode (Supabase)
js/api.js             Chooses preview or live backend
supabase/*.sql        Database schema, security, functions, seed data
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
3. In **Authentication → URL configuration** set:
   - Site URL: `https://ghsspandi.in`
   - Redirect URLs: `https://ghsspandi.in/reset.html`,
     `https://ghsspandi.in/**`, plus your preview host if you use one.
4. In **Authentication → Email** keep email confirmation on. Password reset
   links return to `reset.html`.
5. Copy the project URL and anon key into `js/config.js`, set
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
2. Add custom domain `ghsspandi.in`, then at the domain registrar point DNS to
   Netlify (A record + `www` CNAME as Netlify instructs).
3. Enable HTTPS (automatic) and force HTTPS.

### Option B: Vercel
1. `npm i -g vercel` (or use the dashboard), then run `vercel` in this folder.
2. Add the domain in **Settings → Domains** and follow the DNS records shown.

### Option C: GitHub Pages
Push the folder to a repository, enable Pages on the `main` branch, add a
`CNAME` file containing `ghsspandi.in`, and point the domain's DNS to GitHub.

### Custom domain checklist
- [ ] Apex `ghsspandi.in` points to the host
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

## 8. Local check

```bash
python3 -m http.server 8099
# open http://localhost:8099
```

Preview accounts (preview mode only, password `pandi2026`):
`student@ghsspandi.in`, `teacher@ghsspandi.in`, `parent@ghsspandi.in`,
`principal@ghsspandi.in`.
