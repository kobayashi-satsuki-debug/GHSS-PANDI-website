(async function () {
  await Site.mount();
  const form = document.getElementById('enquiry-form');
  const msg = document.getElementById('enquiry-msg');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    if (window.Security && !Security.bindPublicForm(form)) {
      return UI.showMsg(msg, I18NS.t('err.slowdown'), 'info');
    }
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.website;
    if (!data.student_name.trim() || !data.parent_name.trim()) {
      return UI.showMsg(msg, I18NS.t('err.required'), 'error');
    }
    if (!/^[0-9]{10}$/.test(data.phone || '')) {
      return UI.showMsg(msg, I18NS.t('err.phone'), 'error');
    }
    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.submitEnquiry(data);
      form.reset();
      if (window.Security) form.dataset.startedAt = String(Date.now());
      UI.showMsg(msg, I18NS.pick('Thank you. The school office will call you within two working days.', 'അന്വേഷണം ലഭിച്ചു. രണ്ട് പ്രവൃത്തിദിവസത്തിനുള്ളിൽ ഓഫീസ് വിളിക്കും.'), 'success');
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });
})();
