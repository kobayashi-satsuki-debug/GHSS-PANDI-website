/* =========================================================
   OAuth buttons ("Continue with Google").
   The provider proves the email; the school role is chosen once
   on oauth.html and enforced by complete_oauth_profile().
   ========================================================= */
(function () {
  const L = (en, ml) => (window.I18NS ? I18NS.pick(en, ml) : en);
  const cfg = () => window.OAUTH_CONFIG || { providers: [], labels: {} };

  function icon(provider) {
    if (provider === 'google') {
      return '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">' +
        '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>' +
        '<path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.6 5.9c4.4-4.1 6.7-10.1 6.7-17.2z"/>' +
        '<path fill="#FBBC05" d="M10.4 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z"/>' +
        '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>' +
        '</svg>';
    }
    return '🔐';
  }

  function mount(container, roleFn) {
    if (!container || !cfg().providers.length) return;
    container.innerHTML = '<div class="auth-divider"><span>' + L('or', 'അല്ലെങ്കിൽ') + '</span></div>' +
      cfg().providers.map(p => {
        const name = (cfg().labels || {})[p] || p;
        return '<button class="btn oauth-btn" type="button" data-provider="' + p + '">' +
          icon(p) + '<span>' + L('Continue with ', 'തുടരുക: ') + UI.esc(name) + '</span></button>';
      }).join('');
    container.addEventListener('click', async e => {
      const b = e.target.closest('[data-provider]');
      if (!b) return;
      const role = typeof roleFn === 'function' ? roleFn() : roleFn;
      b.disabled = true;
      try {
        await API.signInWithOAuth(b.dataset.provider, role || '');
      } catch (err) {
        UI.toast(API.errorText(err), 'error');
        b.disabled = false;
      }
    });
  }

  window.OAuthUI = { mount, providers: cfg().providers };
})();
