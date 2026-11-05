# G H S S Pandi — security overview

This site handles student records, exam results and a class chat, so access is
enforced in the database, not in the browser. Nothing in a page decides who may
read or write what: Row Level Security (RLS) and `SECURITY DEFINER` functions in
PostgreSQL do.

Run `supabase/06-security-hardening.sql` after `01`–`05`. It is idempotent.

## 1. Accounts and roles

| Role | Can do | How it is checked |
|---|---|---|
| `student` | read own profile, own results, own class chat | `student_id = auth.uid()` and class match in RLS |
| `parent` | read results of approved children only | `parent_student_links.status = 'approved'` |
| `teacher` | publish results for classes assigned to them, moderate own class chat | `class_teachers` mapping + `teachers.status = 'approved'` |
| `admin` | approve teachers/parents, manage accounts, all moderation | `profiles.role = 'admin'` |

* Teacher accounts are created with `status = 'pending'` and cannot publish or
  moderate until an administrator approves them (`decide_teacher`).
* A parent account sees a student only after the office approves the
  relationship (`decide_parent_link`).
* Changing `profiles.role` or moving a profile to `active` from the browser is
  rejected by the `profiles_guard` trigger (`role_change_denied` /
  `status_change_denied`). Only admins can do it, and every such change is
  written to `security_log`.
* A student who edits `localStorage`, the page source or the JWT claims gains
  nothing: the policies compare against the database row for `auth.uid()`.

## 2. Input handling

* Every privileged operation goes through a named RPC with typed parameters;
  none of them take SQL text.
* Enquiries are validated server-side (name length, 10-digit phone, message
  length) and rate limited to 3 per phone per hour and 200 per day in total.
* Chat messages are limited to 500 characters by a table check; report reasons
  are truncated to 300 characters; report abuse is limited to 10 per user per
  hour.
* All rendering escapes text (`UI.esc`), so a notice or chat message cannot
  inject script. The pages are served with a Content-Security-Policy that has
  no `unsafe-inline` for scripts and blocks framing.

## 3. Transport and headers

Every page carries a CSP, `Referrer-Policy` and `color-scheme` meta tag. Hosts
that can send real headers get the full set from `_headers` (Netlify, Cloudflare
Pages): HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Permissions-Policy`, COOP/CORP and the same CSP as a header (a header CSP
cannot be stripped by injected HTML).

GitHub Pages cannot send custom headers, so the meta CSP is the only protection
there. If the school later moves to Cloudflare Pages, keep `_headers` in place.

`https` is required: the pages in `js/security.js` show a warning banner when a
copy is opened over plain `http`.

## 4. Sessions

* Supabase stores the session; signing out clears it.
* `js/security.js` signs a user out after 30 minutes without mouse, keyboard or
  touch activity and returns to the login page with an explanation — important
  for shared computers in the school office and computer lab.
* The site refuses to render inside a frame (`frame-ancestors 'none'` plus a
  frame-busting check) to stop clickjacking.

## 5. Student AI study buddy

* The assistant runs entirely in the browser from `js/ai.js` — a keyword-matched
  knowledge base of school study notes. No student question is sent to an
  outside AI service, and no API key sits in the page.
* Only students have the pane. `set_ai_nickname`, `ai_history` and
  `log_ai_message` are `SECURITY DEFINER` functions granted to `authenticated`,
  and each one resolves the caller through `my_student_id()`, so a student can
  read or write only their own `ai_messages` rows.
* The nickname is 2–24 characters, stored in `students.ai_nickname`; changing a
  role or another student's row is refused by the same guard as the rest of the
  schema.
* `window.AI_CONFIG.endpoint` in `js/config.js` is empty by default. If the
  school later wants a real language model, point it at a Supabase Edge Function
  that holds the provider key server-side — never put a key in `js/config.js`.

## 6. Monitoring

* `security_log` — role and status changes (who, when, from → to). Admins read
  it in the SQL editor or from a future dashboard pane.
* `moderation_log` — every hide/unhide/resolve of chat reports.
* `rate_limits` — short-lived counters; pruned automatically after a day.
* Supabase → Authentication → **Logs** records sign-ups, sign-ins and failures;
  enable **Leaked password protection** there, and keep email confirmation on.

## 7. Routine checks for the school IT club

1. Review `security_log` and the pending lists once a week.
2. Remove accounts of students who leave (`set_account_status`).
3. Keep the admin list to two or three people.
4. Before each term's result publishing, take a Supabase backup.
5. Update the Supabase client version in the pages once a year
   (`@supabase/supabase-js@2` on jsDelivr).
6. Never paste the `service_role` key into any file in this folder — the anon
   key is the only key that belongs on the website.

## 8. Reporting a problem

Security issues: `14101ghsspandi@gmail.com` (see `.well-known/security.txt`).

## PDF notes (SQL 09)

* `public.resources` holds one row per uploaded PDF. `set_resource_meta()`
  overwrites the uploader and trims the class/subject/title on the server, so a
  browser cannot claim another teacher's name. Only `is_staff()` may insert;
  students and parents only ever `select`.
* PDFs live in the **private** `resources` bucket (20 MB limit, PDF only). Read
  and write policies are scoped to `authenticated`, and students download with
  ten-minute signed URLs, so a shared link expires.
