(async function () {
  const form = document.getElementById('verify-form');
  const emailInput = document.getElementById('verify-email');
  const codeInput = document.getElementById('verify-code');
  const msg = document.getElementById('verify-msg');
  const submit = document.getElementById('verify-submit');
  const resend = document.getElementById('verify-resend');
  const hint = document.getElementById('verify-hint');
  const demo = document.getElementById('verify-demo');
  if (!form) return;

  const session = await Site.mount();
  if (session) { location.replace('dashboard.html'); return; }
  if (demo && !API.isLive) demo.hidden = false;

  const params = new URLSearchParams(location.search);
  const fromQuery = params.get('email') || params.get('phone');
  const pending = (function () { try { return localStorage.getItem('ghss_pending_email'); } catch (e) { return null; } })();
  const prefill = (fromQuery || pending || '').trim();
  if (prefill) {
    emailInput.value = prefill;
    const bySms = !String(prefill).includes('@');
    hint.textContent = bySms
      ? I18NS.pick(
        'We texted a code to ' + prefill + '. Enter it above, or ask for a new one.',
        prefill + ' എന്ന നമ്പറിലേക്ക് കോഡ് SMS ആയി അയച്ചു. മുകളിൽ നൽകുക.'
      )
      : I18NS.pick(
        'We sent a code to ' + prefill + '. Enter it above, or ask for a new one.',
        prefill + ' എന്ന വിലാസത്തിലേക്ക് കോഡ് അയച്ചു. മുകളിൽ നൽകുക, അല്ലെങ്കിൽ പുതിയത് ചോദിക്കുക.'
      );
    codeInput.focus();
  } else {
    emailInput.focus();
  }

  let timer = null;
  function startCountdown() {
    let left = 60;
    clearInterval(timer);
    resend.disabled = true;
    resend.textContent = I18NS.pick('Resend in ' + left + 's', 'വീണ്ടും അയയ്ക്കാൻ ' + left + ' സെ');
    timer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        resend.disabled = false;
        resend.textContent = I18NS.pick('Resend code', 'കോഡ് വീണ്ടും അയയ്ക്കുക');
        return;
      }
      resend.textContent = I18NS.pick('Resend in ' + left + 's', 'വീണ്ടും അയയ്ക്കാൻ ' + left + ' സെ');
    }, 1000);
  }

  function email() { return emailInput.value.trim().toLowerCase(); }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    UI.hideMsg(msg);
    const address = email();
    const code = codeInput.value.replace(/\D/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      return UI.showMsg(msg, I18NS.pick('Enter the email address you registered with.', 'രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ വിലാസം നൽകുക.'), 'error');
    }
    if (code.length !== 6) {
      return UI.showMsg(msg, I18NS.pick('Enter the 6-digit code.', '6 അക്ക കോഡ് നൽകുക.'), 'error');
    }
    UI.busy(submit, true);
    try {
      const res = await API.verifySignupOtp(address, code);
      clearInterval(timer);
      try { localStorage.removeItem('ghss_pending_email'); } catch (e) {}
      UI.showMsg(msg, res && res.requiresApproval
        ? I18NS.pick('Email verified. Your teacher account is waiting for school approval — you can sign in once it is approved.', 'ഇമെയിൽ സ്ഥിരീകരിച്ചു. അധ്യാപക അക്കൗണ്ട് സ്കൂൾ അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു — അംഗീകരിച്ച ശേഷം പ്രവേശിക്കാം.')
        : I18NS.pick('Email verified successfully. Taking you to sign in…', 'ഇമെയിൽ വിജയകരമായി സ്ഥിരീകരിച്ചു. പ്രവേശന പേജിലേക്ക് കൊണ്ടുപോകുന്നു…'), 'success');
      setTimeout(function () { location.href = 'login.html'; }, 2200);
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
      codeInput.select();
    } finally {
      UI.busy(submit, false);
    }
  });

  resend.addEventListener('click', async function () {
    UI.hideMsg(msg);
    const address = email();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      return UI.showMsg(msg, I18NS.pick('Enter the email address you registered with.', 'രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ വിലാസം നൽകുക.'), 'error');
    }
    UI.busy(resend, true);
    let sent = false;
    try {
      const res = await API.resendSignupOtp(address);
      sent = true;
      if (res && res.devCode) {
        UI.showMsg(msg, I18NS.pick('Preview mode: your code is ' + res.devCode, 'പ്രിവ്യൂ മോഡ്: നിങ്ങളുടെ കോഡ് ' + res.devCode), 'info');
      } else {
        UI.showMsg(msg, I18NS.pick('A new code is on its way to ' + address + '.', address + ' എന്ന വിലാസത്തിലേക്ക് പുതിയ കോഡ് അയച്ചു.'), 'success');
      }
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(resend, false);
    }
    // after UI.busy, otherwise it restores the old label over the countdown
    if (sent) startCountdown();
  });

  codeInput.addEventListener('input', function () {
    codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
  });
  codeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : submit.click(); }
  });
})();
