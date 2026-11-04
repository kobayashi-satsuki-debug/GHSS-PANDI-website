(async function () {
  await Site.mount();
  const reqForm = document.getElementById('request-form');
  const updForm = document.getElementById('update-form');
  const msg = document.getElementById('reset-msg');
  const updMsg = document.getElementById('update-msg');
  const hasRecovery = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);

  if (hasRecovery) {
    reqForm.hidden = true;
    updForm.hidden = false;
  }

  reqForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    const email = document.getElementById('reset-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    const btn = reqForm.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.resetPassword(email);
      UI.showMsg(msg, I18NS.t('pw.sent'), 'success');
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  updForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(updMsg);
    const pw = document.getElementById('new-password').value;
    const pw2 = document.getElementById('new-password2').value;
    if (pw.length < 8) return UI.showMsg(updMsg, I18NS.t('err.passwordShort'), 'error');
    if (pw !== pw2) return UI.showMsg(updMsg, I18NS.pick('Passwords do not match.', 'പാസ്‌വേഡുകൾ ഒത്തുപോകുന്നില്ല.'), 'error');
    const btn = updForm.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.updatePassword(pw);
      UI.showMsg(updMsg, I18NS.t('pw.updated'), 'success');
      setTimeout(() => { location.href = 'login.html'; }, 1800);
    } catch (err) {
      UI.showMsg(updMsg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
