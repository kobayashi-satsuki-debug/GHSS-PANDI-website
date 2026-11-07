# Email templates — 6-digit codes, no links

The site never asks anyone to click a link to verify an email. Every email
Supabase sends carries a **6-digit code**, and the student, teacher or parent
types that code into the page they are already on.

Two templates must be changed, once, in the Supabase dashboard.

## 1. Authentication → Emails → Confirm signup

Replace the whole subject and body with this.

**Subject**

```
Your G H S S Pandi verification code
```

**Message body (HTML)**

```html
<h2>G H S S Pandi</h2>
<p>Your verification code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:16px 0">code</p>
<p>Type this 6-digit code on the website to finish creating your account.
It can be used once and expires after 10 minutes.</p>
<p>If you did not ask for this code, you can ignore this email.</p>
<p>— Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala<br>
14101ghsspandi@gmail.com · 9446553567</p>
```

In the Supabase editor, the placeholder is written `{{ .Token }}`. So the line
above becomes:

```html
<p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:16px 0">{{ .Token }}</p>
```

Do **not** keep `{{ .ConfirmationURL }}` in this template. If it is still there,
the email shows a button instead of the code.

## 2. Authentication → Emails → Reset password

**Subject**

```
Your G H S S Pandi password reset code
```

**Message body (HTML)**

```html
<h2>G H S S Pandi</h2>
<p>Your password reset code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:16px 0">{{ .Token }}</p>
<p>Type this 6-digit code on the password reset page, then choose a new
password. It can be used once and expires after 10 minutes.</p>
<p>If you did not ask to reset your password, ignore this email and your
password stays the same.</p>
<p>— Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala<br>
14101ghsspandi@gmail.com · 9446553567</p>
```

## 3. Settings to check

| Where | Setting | Value |
| --- | --- | --- |
| Authentication → Providers → Email | Enable email provider | on |
| Authentication → Providers → Email | Confirm email | on |
| Authentication → Providers → Email | Email OTP Expiration | `600` seconds (10 minutes) |
| Authentication → Providers → Email | Email OTP Length | `6` |
| Authentication → Rate limits | Emails sent per hour | raise it if a whole class registers together (e.g. `100`) |

## 4. How the site uses the code

* **Registration** (`register.html`) — `signUp` sends the email, the page shows a
  "6-digit code" box, and it calls `verifyOtp({ type: 'signup' })`.
* **Password reset** (`reset.html`) — the page asks for the email, sends the
  reset email, then asks for the code plus a new password and calls
  `verifyOtp({ type: 'recovery' })` followed by `updateUser({ password })`.
* Wrong or expired codes show "the code is wrong or has expired" and are tried
  at most five times before the code is thrown away.

## 5. Checking it works

1. Register with a real address. The email should contain six digits and no
   button or link.
2. Type the code — the account should become active (teachers stay pending).
3. Sign out, open `reset.html`, ask for a code, and set a new password.
4. Sign in with the new password.

If the email still contains a link, the template in step 1 or 2 was not saved.

## 6. When confirmation fails

The website now explains each of these in English, Malayalam and Kannada
instead of showing Supabase's raw text, but the cause is always on the
Supabase side. Check them in this order.

| What the person sees | Cause | Fix |
| --- | --- | --- |
| "That confirmation link has expired or was already used" | The email still holds a link, or the same link was opened twice | Put `{{ .Token }}` in the Confirm signup template and save |
| "This email address is not confirmed yet" on sign-in | The account exists but no code was ever entered | Register again with the same address and press Resend code |
| "This email already has an account" | Supabase hides duplicates by returning a user with no identities | Sign in, or use Forgot password |
| "The address this site is opened from is not allowed" | The page was opened from `file://` or a host that is not in the allow-list | Add the host under Authentication → URL Configuration → Redirect URLs |
| "New sign-ups are turned off" | Sign-ups are disabled on the project | Authentication → Providers → Email → Enable sign-ups |
| "Error sending confirmation email" | Supabase could not hand the message to a mail server: the built-in mailer hit its hourly cap, or the SMTP password / sender address is wrong | See §6a below |

Also check, on the same Authentication page:

1. **Email OTP Length** is 6 and **Email OTP Expiration** is 600 seconds, so the
   six digits in the template match what the form accepts.
2. **Confirm email** stays on — with it off no code is sent at all.
3. Once `ghsspandi.org.in` is live, add both `https://ghsspandi.org.in` and
   `https://www.ghsspandi.org.in` to Redirect URLs, plus your preview address
   while you are still testing.

## 6a. "Error sending confirmation email"

This message comes from the mail server, never from the website, and the account
**is still created** — Supabase stores the user first and only then tries to send.
So do not register again; it will answer "already registered". Instead:

1. Open `confirm-email.html` (linked from the sign-in page as *Verify a new
   account*), type the same address and press **Resend code**.
2. If resend also fails, read **Logs → Auth** and look for the mail line:

| Log text | Meaning | Fix |
| --- | --- | --- |
| `over_email_send_rate_limit` / `email rate limit exceeded` | The free built-in mailer allows only a few messages per hour | Add custom SMTP in Authentication → SMTP Settings, then raise *Emails per hour* under Rate limits |
| `535 Authentication failed` / `Invalid login` | Wrong SMTP username or password | Gmail needs an **app password**, not the normal one; regenerate it and paste it again |
| `553` / `sender address rejected` | The From address is not allowed by the mail provider | Verify the sender domain at Brevo / Resend / Zoho, and use exactly that address in the sender field |
| `connection timed out`, `ENOTFOUND` | Wrong host or port | Use port 587 with STARTTLS (or 465 with TLS) and the host your provider lists |
| `Email template not found` | The template was cleared | Paste the templates from §1 and §2 again |

3. After any SMTP change, send one test code and confirm it arrives inside a
   minute. Gmail's SMTP also has a daily cap of roughly 500 recipients, so a
   school that registers several classes a day should use a transactional
   provider instead.

The website translates this failure into a plain-language message in all three
languages and tells the person their account already exists, so a student does
not create a duplicate address while the office fixes SMTP.

### Is it the website or Supabase?

It is Supabase. A direct call to the project answers the same way, without the
site involved at all:

```
POST /auth/v1/signup  ->  500 {"error_code":"unexpected_failure",
                               "msg":"Error sending confirmation email",
                               "error_id":"…"}
```

That `error_id` is the handle to quote: paste it into **Logs → Auth** (or into a
support ticket) and the SMTP line behind it appears.

Two things this proves, both worth knowing:

- the browser code is not at fault, so no page change can make mail leave;
- when the send fails with a 500, GoTrue rolls the sign-up back. Signing in
  afterwards answers `invalid_credentials`, not `email_not_confirmed`, so **no
  half-made account is left behind** and the person can simply try again.

A `429` or "email rate limit exceeded" is the opposite case — the account is
kept, and only the message is missing.

## 6b. Running without email at all

If SMTP cannot be fixed today and classes are waiting to register, confirmation
can be switched off so no mail is needed:

**Authentication → Providers → Email → Confirm email: off → Save**

What happens then:

- `signUp` returns a session straight away, so the register page skips the code
  step and takes the student to the dashboard.
- The teacher still lands in **pending** and cannot open teacher pages until an
  administrator approves, because that is enforced by the database, not by the
  email.
- Roles are still server-enforced by row-level security, so nothing in the
  browser can turn a student into a teacher.

What is lost: the address is not proven to belong to the person, and **Forgot
password still needs email**. Until then, the office can remove the account in
**Authentication → Users** and ask the person to register again.

Turn confirmation back on once SMTP delivers a test code — the code page and the
templates above keep working unchanged.

## 7. Completing verification on its own page

`confirm-email.html` takes an email address plus the 6-digit code and calls
`verifyOtp({ type: 'signup' })`. Link to it as `confirm-email.html?email=…` from
anywhere that needs a verification step; the code field only accepts digits and
the page offers a resend button with a 60-second cool-down. After a successful
check it points the visitor at `login.html`. Teacher accounts still show the
"waiting for school approval" notice instead of promising access.

## 8. Students sign in with a six-digit code

A student never types a password: they give an email address, receive six digits
and type them, on registration and on every later sign-in.

**The account still gets a password.** Supabase rejects a sign-up without one
(`400 validation_failed — Signup requires a valid password`), so the register
page generates 32 random characters in the browser (`Security.randomPassword`)
and sends them once. Nobody sees or stores that value: students reach the
account only through emailed codes. If you ever need to open a student account
another way, use *Forgot password* with the student's address.

**Which template carries that code:** not *Confirm signup*. A returning student's
code comes from the **Magic Link** template, because the site calls
`signInWithOtp`. So both templates need the token:

| Template | Must contain |
| --- | --- |
| Confirm signup | `{{ .Token }}` |
| Magic Link | `{{ .Token }}` |
| Reset password | `{{ .Token }}` |

If Magic Link only holds `{{ .ConfirmationURL }}`, the student receives a link
with no digits and the sign-in page asks for a code that does not exist.

**Dashboard settings that matter:**

- Authentication → Providers → Email → **Confirm email: on** (a new student
  proves the address before the account works)
- Providers → Email → **Email OTP length 6**, expiration 600
- The site asks Supabase *not* to create unknown accounts on sign-in, so a
  mistyped address answers "No account uses this email address" instead of
  quietly making a new account.

**Where it is enforced:** teachers and parents still use a password, and every
session ends at the same profile check, so a pending teacher or a disabled
account cannot get past the dashboard gate by using a code instead.
