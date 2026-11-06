/* =========================================================
   API facade — chooses Supabase or the local preview backend.
   Pages must not talk to either backend directly, so switching
   to real accounts is a one-line config change.
   ========================================================= */
(function () {
  function configured() {
    const c = window.SUPABASE_CONFIG || {};
    return !!c.url && c.url.indexOf('YOUR-PROJECT') === -1 && !!c.anonKey && c.anonKey.indexOf('YOUR-ANON') === -1;
  }
  const hasLib = typeof window.supabase !== 'undefined' && window.supabase && window.supabase.createClient;
  const useSupabase = configured() && hasLib;
  const B = useSupabase ? window.SupabaseBackend : window.DemoBackend;

  const API = {
    mode: B.mode,
    isLive: B.mode === 'supabase',
    configured: configured(),
    ready: Promise.resolve(),
    ...B
  };

  /* friendly error text: backend errors can be i18n keys or Supabase strings */
  API.errorText = function (err) {
    const raw = (err && (err.message || err.toString())) || 'err.generic';
    if (window.I18NS && /^[a-z]+\.[A-Za-z]+$/.test(raw)) {
      const txt = window.I18NS.t(raw, '');
      if (txt && txt !== raw) return txt;
    }
    if (/Invalid login credentials/i.test(raw)) return window.I18NS.t('err.invalidlogin');
    if (/Email not confirmed/i.test(raw)) return window.I18NS.t('auth.notConfirmed');
    if (/redirect/i.test(raw) && /url/i.test(raw)) return window.I18NS.t('err.redirect');
    if (/already registered|already exists|user already/i.test(raw)) return window.I18NS.t('auth.alreadyRegistered');
    if (/signups? (are )?(not allowed|disabled)/i.test(raw)) return window.I18NS.t('err.signupDisabled');
    if (/error sending|confirmation email|smtp|sending.*email/i.test(raw)) return window.I18NS.t('err.mailFailed');
    if (/duplicate key|already registered/i.test(raw)) return 'This email is already registered.';
    if (/row-level security|permission denied|violates/i.test(raw)) return window.I18NS.t('err.noperm');
    return raw;
  };

  // Supabase puts the outcome of an email link in the URL: either a session
  // (#access_token=...) or a failure (#error=access_denied&error_code=otp_expired).
  // Reads both, and can strip them so the message is not repeated on reload.
  API.urlAuthStatus = function () {
    const out = { error: false, code: '', description: '', confirmed: false, recovery: false };
    try {
      const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
      const search = new URLSearchParams(String(location.search || ''));
      const pick = k => hash.get(k) || search.get(k);
      const err = pick('error');
      const code = pick('error_code');
      out.code = code || '';
      out.description = pick('error_description') || '';
      out.error = !!(err || code);
      out.recovery = pick('type') === 'recovery';
      out.confirmed = search.get('confirmed') === '1';
      if (!out.error && out.confirmed) out.confirmed = true;
    } catch (e) {}
    return out;
  };

  API.cleanAuthUrl = function () {
    try {
      const search = new URLSearchParams(location.search);
      ['confirmed', 'error', 'error_code', 'error_description'].forEach(k => search.delete(k));
      const q = search.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
    } catch (e) {
      try { history.replaceState(null, '', location.pathname); } catch (e2) {}
    }
  };


  API.gradeFor = function (marks, max) {
    const pct = (Number(marks) / Number(max || 100)) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'E';
  };

  window.API = API;
})();
