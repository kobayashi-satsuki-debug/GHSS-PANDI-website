(async function () {
  const session = await Site.mount();
  if (session) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');
  if (/[?&]timeout=1/.test(location.search) && msg) {
    UI.showMsg(msg, I18NS.pick('You were signed out after 30 minutes of inactivity. Please sign in again.', '30 മിനിറ്റ് നിഷ്ക്രിയത്വത്തിന് ശേഷം പുറത്തായി. വീണ്ടും പ്രവേശിക്കുക.'), 'info');
  }
  const email = document.getElementById('login-email');
  const tabs = document.getElementById('login-tabs');
  const note = document.getElementById('login-role-note');
  const demo = document.getElementById('demo-logins');
  if (demo && !API.isLive) demo.hidden = false;

  const notes = {
    student: ['Students sign in with the email used at registration.', 'രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ ഉപയോഗിച്ച് പ്രവേശിക്കുക.'],
    teacher: ['Teacher accounts must be approved by the school administrator before first sign-in.', 'ആദ്യ പ്രവേശനത്തിന് മുൻപ് അഡ്മിനിസ്ട്രേറ്റർ അംഗീകരിക്കണം.'],
    parent: ['A parent account needs a school-verified link to a student before results are visible.', 'ഫലം കാണാൻ സ്കൂൾ സ്ഥിരീകരിച്ച കുട്ടിയുമായുള്ള ബന്ധം ആവശ്യം.']
  };

  function selectRole(role) {
    tabs.querySelectorAll('[role=tab]').forEach(t => {
      const on = t.dataset.role === role;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    const pair = notes[role] || notes.student;
    note.textContent = I18NS.pick(pair[0], pair[1]);
  }

  tabs.addEventListener('click', e => {
    const tab = e.target.closest('[role=tab]');
    if (tab) selectRole(tab.dataset.role);
  });
  selectRole(location.hash === '#parent' ? 'parent' : (location.hash === '#teacher' ? 'teacher' : 'student'));

  document.querySelectorAll('.pw-toggle').forEach(b => {
    b.addEventListener('click', () => {
      const input = document.getElementById(b.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.textContent = show ? I18NS.pick('HIDE', 'മറയ്ക്കുക') : I18NS.pick('SHOW', 'കാണിക്കുക');
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    const em = email.value.trim();
    const pw = document.getElementById('login-password').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    if (!pw) return UI.showMsg(msg, I18NS.t('err.required'), 'error');

    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const s = await API.signIn(em, pw);
      const next = new URLSearchParams(location.search).get('next');
      const role = s && s.profile ? s.profile.role : '';
      const target = next && next.indexOf('http') !== 0 ? next : 'dashboard.html';
      location.href = (role === 'parent' && target === 'dashboard.html') ? 'dashboard.html#children' : target;
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
