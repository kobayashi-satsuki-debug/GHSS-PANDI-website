/* =========================================================
   Client-side safety helpers: idle sign-out, frame busting,
   transport warning and public-form bot checks.
   Server-side rules still decide everything — these only
   reduce the chance of a session left open on a shared PC.
   ========================================================= */
(function () {
  const IDLE_MINUTES = 30;
  const LOGIN_PAGE = 'login.html';
  let lastActivity = Date.now();
  let timer = null;

  function bump() { lastActivity = Date.now(); }

  function startIdleGuard() {
    if (timer) return;
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, bump, { passive: true });
    });
    timer = setInterval(function () {
      if (Date.now() - lastActivity < IDLE_MINUTES * 60000) return;
      clearInterval(timer);
      timer = null;
      try { if (window.API && API.signOut) API.signOut(); } catch (e) { /* ignore */ }
      location.replace(LOGIN_PAGE + '?timeout=1');
    }, 30000);
  }

  function guardFrame() {
    try {
      if (window.top !== window.self) {
        window.top.location = window.self.location;
      }
    } catch (e) {
      document.documentElement.style.display = 'none';
    }
  }

  function warnInsecureTransport() {
    const host = location.hostname;
    const local = host === 'localhost' || host === '127.0.0.1' || host === '';
    if (location.protocol !== 'https:' && !local && window.SCHOOL_CONFIG) {
      const bar = document.createElement('div');
      bar.className = 'form-msg show error';
      bar.style.cssText = 'position:sticky;top:0;z-index:9999;border-radius:0;text-align:center';
      bar.textContent = 'This page is not using a secure connection. Do not sign in. Use https://' + location.host + location.pathname;
      document.body.prepend(bar);
    }
  }

  /* public forms: hidden field bots fill in + a 3 second floor */
  function bindPublicForm(form) {
    if (!form) return true;
    const trap = form.querySelector('[data-honeypot]');
    if (trap && trap.value) return false;
    const started = Number(form.dataset.startedAt || 0);
    if (started && Date.now() - started < 3000) return false;
    return true;
  }

  function stampPublicForms() {
    document.querySelectorAll('form[data-public]').forEach(function (f) {
      f.dataset.startedAt = String(Date.now());
    });
  }


  /* ---------------- password policy ---------------- */
  const PASSWORD_MIN = 12;
  const COMMON = ['password', 'passw0rd', 'qwerty', 'letmein', 'welcome', 'admin123',
    'iloveyou', 'monkey', 'dragon', 'football', 'cricket', 'india123', 'kerala123',
    'ghsspandi', 'school123', 'student123', 'teacher123', '123456', '12345678'];
  const KEYBOARD_RUNS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

  function weakReason(pw) {
    const v = String(pw || '');
    if (v.length < PASSWORD_MIN) return 'short';
    const low = v.toLowerCase();
    if (COMMON.indexOf(low) !== -1) return 'common';
    if (KEYBOARD_RUNS.some(function (r) { return low.indexOf(r) !== -1; })) return 'common';
    if (/^(.)\1+$/.test(v)) return 'common';
    if (/^[a-z]+$/.test(v) && v.length < 16) return 'plain';
    if (/^[0-9]+$/.test(v)) return 'plain';
    return '';
  }

  function checkPassword(pw) {
    return { ok: weakReason(pw) === '', reason: weakReason(pw) };
  }

  /* ---------------- sign-in throttling ---------------- */
  const TRY_KEY = 'ghss_signin_tries';
  const MAX_TRIES = 5;
  const WINDOW_MS = 10 * 60 * 1000;

  function readTries() {
    try { return JSON.parse(localStorage.getItem(TRY_KEY) || '{}') || {}; } catch (e) { return {}; }
  }

  function writeTries(all) {
    try { localStorage.setItem(TRY_KEY, JSON.stringify(all)); } catch (e) { /* storage off */ }
  }

  function bucket(all, email) {
    const k = String(email || '').trim().toLowerCase();
    const b = all[k] || { n: 0, first: 0, until: 0 };
    if (b.until && Date.now() > b.until) { b.n = 0; b.first = 0; b.until = 0; }
    if (!b.first || Date.now() - b.first > WINDOW_MS) { b.n = 0; b.first = 0; }
    all[k] = b;
    return b;
  }

  function noteFailedSignIn(email) {
    const all = readTries();
    const b = bucket(all, email);
    b.n += 1;
    if (!b.first) b.first = Date.now();
    if (b.n >= MAX_TRIES) {
      const waitMs = Math.min(30, Math.pow(2, b.n - MAX_TRIES)) * 60 * 1000;
      b.until = Date.now() + waitMs;
    }
    writeTries(all);
    return Math.max(0, Math.ceil((b.until - Date.now()) / 60000));
  }

  function signInWaitMinutes(email) {
    const b = bucket(readTries(), email);
    return b.until > Date.now() ? Math.ceil((b.until - Date.now()) / 60000) : 0;
  }

  function clearTries(email) {
    const all = readTries();
    delete all[String(email || '').trim().toLowerCase()];
    writeTries(all);
  }


  /* A password nobody types: it only satisfies Supabase's "valid password"
     rule for student accounts, which are opened and used through emailed
     six-digit codes. 32 random characters, never stored or shown. */
  function randomPassword(len) {
    const n = len || 32;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%&*';
    const c = window.crypto || window.msCrypto;
    const out = [];
    if (c && c.getRandomValues) {
      const buf = new Uint32Array(n);
      c.getRandomValues(buf);
      for (let i = 0; i < n; i++) out.push(alphabet[buf[i] % alphabet.length]);
    } else {
      for (let i = 0; i < n; i++) out.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    return out.join('');
  }

  window.Security = {
    startIdleGuard: startIdleGuard,
    bindPublicForm: bindPublicForm,
    idleMinutes: IDLE_MINUTES,
    passwordMin: PASSWORD_MIN,
    randomPassword: randomPassword,
    checkPassword: checkPassword,
    noteFailedSignIn: noteFailedSignIn,
    signInWaitMinutes: signInWaitMinutes,
    clearSignInTries: clearTries
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      guardFrame();
      warnInsecureTransport();
      stampPublicForms();
    });
  } else {
    guardFrame();
    warnInsecureTransport();
    stampPublicForms();
  }
})();
