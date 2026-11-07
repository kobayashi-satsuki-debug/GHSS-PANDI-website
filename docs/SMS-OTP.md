# Sending the code by SMS instead of email

The website can deliver the six-digit code either way. One setting decides:

```js
// js/config.js
window.OTP_CONFIG = { channel: 'sms', country: '+91' };
```

`'sms'` texts the code to the mobile number; `'email'` uses the address. Change
the word and reload — no other file needs touching.

## What changed when the channel is SMS

| Area | Behaviour |
| --- | --- |
| Register | The mobile number becomes the account identity (`+91…`). Email is kept for school records and is optional. |
| Code step | "We texted a 6-digit code to +91…" and the code is typed, never a link. |
| Sign in | The first field accepts a mobile number **or** an email address. |
| Verify page | `confirm-email.html` accepts either; `?phone=+91…` prefills the number. |
| Duplicate checks | One mobile number and one email can each only open one account. |
| Teachers | Still created as **pending** and still need administrator approval. |

## Supabase setup — the part that costs money

SMS is sent by a provider, not by Supabase itself, so this needs an account and
credit. Prices in India are roughly ₹0.15–0.30 per message.

1. **Authentication → Providers → Phone → Enable**
2. Choose a provider and paste its credentials:

   | Provider | Fields |
   | --- | --- |
   | Twilio | Account SID, Auth Token, Message Service SID or From number |
   | MSG91 | Auth key, sender ID, template ID |
   | Textlocal / Vonage | API key, sender |

3. Set **SMS OTP Length** to `6` and **SMS OTP Expiration** to `600` seconds
   (Authentication → Providers → Phone).
4. In India every commercial sender must be **DLT-registered**: the sender ID and
   the message template are approved by the operator before any SMS is delivered.
   Without this, the provider accepts the request and the phone stays silent.
   Twilio, MSG91 and Textlocal all walk you through DLT registration.
5. Send one test code to the headmaster's own number before telling students.

## Database

Run `supabase/12-phone-accounts.sql` once (safe to re-run). It:

- makes `profiles.email` optional, because a phone sign-up has no address,
- keeps one address per account through a partial unique index,
- refuses a second account on the same mobile number,
- lets the sign-up trigger take the address from the form for phone accounts.

## If SMS is not working yet

Every failure is explained in the page itself:

| Message | Meaning |
| --- | --- |
| "SMS codes are not switched on for this school yet" | Phone provider is disabled in Supabase — or `channel` is `'sms'` with no provider |
| "The code could not be sent as a text message" | Provider rejected the send: check credit, DLT template, or the From number |
| "This mobile number already has an account" | Sign in instead, or the office can reset it from the dashboard |

To go back to email until the provider is ready:

```js
window.OTP_CONFIG = { channel: 'email', country: '+91' };
```

Nothing else changes, and `Confirm email` in Supabase must be on for that mode.

## Cost control

- Six digits by SMS is one message; a class of 40 costs about ₹10 to register.
- A student who forgets a password can sign in again by requesting a fresh code,
  so recovery does not need email at all in SMS mode.
- Keep **SMS rate limits** (Authentication → Rate limits) at the default so a
  mistyped number cannot be used to send paid messages in a loop.
