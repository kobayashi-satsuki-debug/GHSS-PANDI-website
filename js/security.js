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

  window.Security = {
    startIdleGuard: startIdleGuard,
    bindPublicForm: bindPublicForm,
    idleMinutes: IDLE_MINUTES
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
