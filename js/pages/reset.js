(async function () {
  await Site.mount();
  const reqWrap = document.getElementById('request-form-wrap');
  const reqForm = document.getElementById('request-form');
  const msg = document.getElementById('reset-msg');
  const updForm = document.getElementById('update-form');
  const updMsg = document.getElementById('update-msg');
  const codeField = document.getElementById('code-field');
  const codeInput = document.getElementById('reset-code');
  const sentTo = document.getElementById('otp-sent-to');
  const restart = document.getElementById('restart-line');

  /* An old-style recovery link still lands here with a session, so let those
     users set a password without a code. */
  const linkStatus = API.urlAuthStatus();
  if (linkStatus.error && msg) {
    UI.showMsg(msg, I18NS.t('auth.linkExpired'), 'error');
    API.cleanAuthUrl();
  }
  const fromLink = !linkStatus.error && (/type=recovery/.test(location.hash) || /type=recovery/.test(location.search));
  if (fromLink) openUpdate(null);

  function openUpdate(email, devCode) {
    reqWrap.hidden = true;
    updForm.hidden = false;
    codeField.hidden = !!fromLink;
    restart.hidden = !!fromLink;
    if (email) {
      sentTo.textContent = I18NS.pick(
        'A 6-digit code was emailed to ' + email + '. Enter it below — there is no link to click.',
        email + ' എന്ന വിലാസത്തിലേക്ക് 6 അക്ക കോഡ് അയച്ചു. താഴെ നൽകുക — ലിങ്ക് ക്ലിക്ക് ചെയ്യേണ്ടതില്ല.'
      );
    }
    if (devCode) {
      UI.showMsg(updMsg, I18NS.pick('Preview mode: the code is ' + devCode, 'പ്രിവ്യൂ മോഡ്: കോഡ് ' + devCode), 'info');
    }
    (fromLink ? document.getElementById('new-password') : codeInput).focus();
  }

  reqForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    const email = document.getElementById('reset-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    const btn = reqForm.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const res = await API.requestResetOtp(email);
      openUpdate(email, res && res.devCode);
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  updForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(updMsg);
    const code = codeInput.value.replace(/\D/g, '');
    const pw = document.getElementById('new-password').value;
    const pw2 = document.getElementById('new-password2').value;
    if (!fromLink && code.length !== 6) {
      return UI.showMsg(updMsg, I18NS.pick('Enter the 6-digit code from the email.', 'ഇമെയിലിലെ 6 അക്ക കോഡ് നൽകുക.'), 'error');
    }
    const check = window.Security ? Security.checkPassword(pw) : { ok: pw.length >= 12, reason: 'short' };
    if (!check.ok) {
      const k = check.reason === 'common' ? 'err.passwordCommon'
              : check.reason === 'plain' ? 'err.passwordPlain' : 'err.passwordShort';
      return UI.showMsg(updMsg, I18NS.t(k), 'error');
    }
    if (pw !== pw2) return UI.showMsg(updMsg, I18NS.pick('Passwords do not match.', 'പാസ്‌വേഡുകൾ ഒത്തുപോകുന്നില്ല.'), 'error');
    const btn = updForm.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      if (!fromLink) {
        await API.verifyResetOtp(document.getElementById('reset-email').value.trim(), code);
      }
      await API.updatePassword(pw);
      UI.showMsg(updMsg, I18NS.t('pw.updated'), 'success');
      setTimeout(() => { location.href = 'login.html'; }, 1800);
    } catch (err) {
      UI.showMsg(updMsg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });

  updForm.querySelectorAll('.pw-toggle').forEach(b => {
    b.addEventListener('click', function () {
      const input = document.getElementById(b.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.textContent = show ? I18NS.pick('HIDE', 'മറയ്ക്കുക') : I18NS.pick('SHOW', 'കാണിക്കുക');
    });
  });
})();
