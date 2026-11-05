(async function () {
  const session = await Site.mount();
  const L = (en, ml) => I18NS.pick(en, ml);
  const form = document.getElementById('staff-form');
  const msg = document.getElementById('staff-msg');
  const demo = document.getElementById('staff-demo');
  if (demo && !API.isLive) demo.hidden = false;

  if (session) {
    const r = session.profile.role;
    if (r === 'teacher' || r === 'admin') { location.replace('dashboard.html'); return; }
    location.replace('dashboard.html');
    return;
  }

  document.querySelectorAll('.pw-toggle').forEach(b => {
    b.addEventListener('click', () => {
      const input = document.getElementById(b.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.textContent = show ? L('HIDE', 'മറയ്ക്കുക') : L('SHOW', 'കാണിക്കുക');
    });
  });

  OAuthUI.mount(document.getElementById('staff-oauth'), 'teacher');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    UI.hideMsg(msg);
    const email = document.getElementById('staff-email').value.trim();
    const pw = document.getElementById('staff-password').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    if (!pw) return UI.showMsg(msg, I18NS.t('err.required'), 'error');

    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const s = await API.signIn(email, pw);
      const prof = s && (s.profile || s);
      const role = prof ? prof.role : '';
      if (role !== 'teacher' && role !== 'admin') {
        await API.signOut();
        UI.showMsg(msg, L('This page is for teachers and staff. Please use the student / parent sign-in.', 'ഈ പേജ് അധ്യാപകർക്കും സ്റ്റാഫിനും മാത്രം. വിദ്യാർത്ഥി / രക്ഷിതാവ് ലോഗിൻ ഉപയോഗിക്കുക.'), 'error');
        UI.busy(btn, false);
        return;
      }
      location.href = 'dashboard.html';
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
