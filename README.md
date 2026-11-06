# G H S S Pandi — bilingual school website

Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala 671543
Phone 9446553567 · 14101ghsspandi@gmail.com · ghsspandi.org.in

Static website (HTML, CSS, JavaScript) with a Supabase backend for accounts,
results, chat and moderation. Every page works in English, Malayalam and Kannada.

## Classes
Classes 1 to 7, high school 8 A/B to 10 A/B, and Plus One / Plus Two Commerce.
The list lives in `window.SCHOOL_CLASSES` in `js/config.js`.

## Pages
Home, About, Admissions, Photo gallery, Creative corner, Achievements, Faculty, Notices,
Exam results, Sign in, Register, Password reset, Dashboard, AI study buddy,
Class chat.

## Portals
- **Student** — own results, class chat, an AI study buddy with a nickname the
  student chooses, profile
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

The student AI study buddy answers from the school study notes in the browser
(`js/ai.js`) — no outside AI service and no API key. Its chat history and chosen
nickname are stored per student in Supabase (`supabase/07-ai-buddy.sql`) and are
readable only by that student.

Roles live in the database and are enforced with Postgres row level security
and `security definer` functions, so they cannot be changed from the browser.

## Run locally
```bash
npm start          # Node 18+, no dependencies
```
Open http://localhost:8080 — without Supabase keys it runs in preview mode.
Pass another port with `npm start -- --port 8099`. `python3 -m http.server 8099`
works too if Node is not installed.

## Check the site
```bash
npm ci     # installs nothing; there are no dependencies
# or: yarn install --frozen-lockfile — both lock files are committed
npm test   # verifies every page reference resolves, every script parses and the sitemap is complete
```
The same check runs in GitHub Actions on every push to the site branch.

Registration sends a 6-digit code to the email address; in preview mode the
code is displayed on the page instead of being emailed.

Preview accounts (password `pandi2026`):
`student@ghsspandi.in`, `teacher@ghsspandi.in`, `parent@ghsspandi.in`,
`principal@ghsspandi.in`.

## Go live
1. Create a Supabase project and run `supabase/01-schema.sql`,
   `02-security.sql`, `03-rpc.sql`, `04-seed.sql`, `05-fix-students-unique.sql`,
   `06-security-hardening.sql`, `07-ai-buddy.sql`, `09-resources.sql`, `10-resource-roles.sql` in that order. (If your project already ran the older `01-schema.sql`, run
   only `05-fix-students-unique.sql` to repair student sign-up.)
   Then replace the two Supabase email templates so they send a 6-digit code
   instead of a link — see `docs/EMAIL-TEMPLATES.md`.
2. Put the project URL and anon public key in `js/config.js`
   (`demoFallback: false`). In Supabase → Authentication → Email Templates →
   Confirm signup keep `{{ .Token }}` in the body, and leave **Confirm email**
   on so registrations ask for the emailed code.
3. Register the school admin account, then run
   `select public.make_admin('14101ghsspandi@gmail.com');`
4. Host the folder on Netlify, Vercel or GitHub Pages and point
   `ghsspandi.org.in` at it.

Full instructions, security notes and the custom-domain checklist:
[docs/SETUP.md](docs/SETUP.md). How roles, rate limits and headers are
enforced: [docs/SECURITY.md](docs/SECURITY.md).

The crest in `assets/logo.svg` and the gallery images are placeholders —
replace them with the school's real photograph and photo set.
