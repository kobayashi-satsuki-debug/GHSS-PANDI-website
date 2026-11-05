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
