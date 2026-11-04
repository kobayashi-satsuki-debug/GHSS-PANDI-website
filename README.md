# G H S S Pandi — bilingual school website

Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala 671543
Phone 9446553567 · 14101ghsspandi@gmail.com · ghsspandi.in

Static website (HTML, CSS, JavaScript) with a Supabase backend for accounts,
results, chat and moderation. Every page works in English, Malayalam and Kannada.

## Pages
Home, About, Admissions, Photo gallery, Achievements, Faculty, Notices,
Exam results, Sign in, Register, Password reset, Dashboard, Class chat.

## Portals
- **Student** — own results, class chat, profile
- **Teacher** — publish results for assigned classes, notices, chat moderation,
  gallery and achievements (after admin approval)
- **Parent** — results for school-verified children, child-link requests
- **Admin** — teacher approvals, parent verification, accounts, classes,
  admissions inbox, moderation history, content

Each dashboard section has its own CSV download — students, accounts, teacher
accounts, parent verification requests, school notices, admission enquiries
and moderation history. Files are named `ghss-pandi-<section>-<date>.csv`.
The export uses only the rows the signed-in role is allowed to read, so a
teacher's file contains only their own classes.

Roles live in the database and are enforced with Postgres row level security
and `security definer` functions, so they cannot be changed from the browser.

## Run locally
```bash
python3 -m http.server 8099
```
Open http://localhost:8099 — without Supabase keys it runs in preview mode.

Preview accounts (password `pandi2026`):
`student@ghsspandi.in`, `teacher@ghsspandi.in`, `parent@ghsspandi.in`,
`principal@ghsspandi.in`.

## Go live
1. Create a Supabase project and run `supabase/01-schema.sql`,
   `02-security.sql`, `03-rpc.sql`, `04-seed.sql`, `05-fix-students-unique.sql`
   in that order. (If your project already ran the older `01-schema.sql`, run
   only `05-fix-students-unique.sql` to repair student sign-up.)
2. Put the project URL and anon public key in `js/config.js`
   (`demoFallback: false`).
3. Register the school admin account, then run
   `select public.make_admin('14101ghsspandi@gmail.com');`
4. Host the folder on Netlify, Vercel or GitHub Pages and point
   `ghsspandi.in` at it.

Full instructions, security notes and the custom-domain checklist:
[docs/SETUP.md](docs/SETUP.md).

The crest in `assets/logo.svg` and the gallery images are placeholders —
replace them with the school's real photograph and photo set.
