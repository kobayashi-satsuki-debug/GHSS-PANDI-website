(async function () {
  await Site.mount();
  const root = document.getElementById('oauth-root');
  const L = (en, ml) => I18NS.pick(en, ml);
  const CLASSES = ['8 A','8 B','9 A','9 B','10 A','10 B','Plus One Science','Plus One Humanities','Plus Two Science','Plus Two Humanities'];

  function msg(text, kind) {
    root.innerHTML = '<div class="form-msg ' + (kind || 'info') + '">' + UI.esc(text) + '</div>' +
      '<div class="auth-links"><a href="login.html">' + L('Back to sign in', 'വീണ്ടും പ്രവേശിക്കുക') + '</a></div>';
  }

  async function waitSession() {
    for (let i = 0; i < 20; i++) {
      const s = await API.session();
      if (s) return s;
      await new Promise(r => setTimeout(r, 200));
    }
    return null;
  }

  let session = await waitSession();
  if (!session) {
    return msg(L('That sign-in link has expired. Please try again.', 'ഈ ലോഗിൻ ലിങ്കിന്റെ സമയം കഴിഞ്ഞു. വീണ്ടും ശ്രമിക്കുക.'), 'error');
  }

  let data = null;
  try { data = await API.profile(); } catch (e) { data = null; }
  const profile = data && data.profile;
  if (!profile) {
    return msg(L('Your account exists but the school profile is missing. Contact the school office.', 'അക്കൗണ്ട് ഉണ്ട്, പക്ഷേ സ്കൂൾ പ്രൊഫൈൽ ഇല്ല. ഓഫീസിനെ ബന്ധപ്പെടുക.'), 'error');
  }

  const hasRoleRow = !!(data.student || data.teacher || (data.children && data.children.length));
  if (hasRoleRow) {
    location.replace(profile.status === 'pending' ? 'login.html' : 'dashboard.html');
    return;
  }

  /* brand-new Google account: choose the school role once */
  let role = 'student';
  try { role = sessionStorage.getItem('ghss_oauth_role') || 'student'; } catch (e) {}
  if (['student', 'teacher', 'parent'].indexOf(role) === -1) role = 'student';

  root.innerHTML =
    '<p class="small muted">' + L('Signed in as ', 'പ്രവേശിച്ചത്: ') + '<strong>' + UI.esc(profile.email || '') + '</strong>' +
    ' · ' + L('choose your role once. The server checks it and the school can still change it.', 'റോൾ ഒരിക്കൽ തിരഞ്ഞെടുക്കുക. സെർവർ പരിശോധിക്കും.') + '</p>' +
    '<div class="tabs" id="oauth-tabs" role="tablist">' +
      ['student', 'teacher', 'parent'].map(r =>
        '<button role="tab" type="button" data-role="' + r + '"' + (r === role ? ' class="active" aria-selected="true"' : ' aria-selected="false"') + '>' +
        I18NS.t('auth.' + r) + '</button>').join('') +
    '</div>' +
    '<form id="oauth-form" novalidate>' +
      '<div class="form-field"><label>' + L('Full name', 'പൂർണ്ണ നാമം') + '</label><input name="full_name" required value="' + UI.esc(profile.full_name || '') + '"></div>' +
      '<div class="form-field"><label>' + L('Phone number', 'ഫോൺ നമ്പർ') + '</label><input name="phone" inputmode="numeric" placeholder="10 digits"></div>' +
      '<div class="form-row" data-for="student"><div class="form-field"><label>' + L('Class', 'ക്ലാസ്') + '</label>' +
        '<select name="class">' + CLASSES.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
        '<div class="form-field"><label>' + L('Roll number', 'റോൾ നമ്പർ') + '</label><input name="roll" inputmode="numeric"></div></div>' +
      '<div class="form-field" data-for="teacher"><label>' + L('Subject you teach', 'നിങ്ങൾ പഠിപ്പിക്കുന്ന വിഷയം') + '</label><input name="subject"></div>' +
      '<div class="form-msg" id="oauth-msg" role="alert"></div>' +
      '<button class="btn btn-primary" type="submit">' + L('Create my school account', 'അക്കൗണ്ട് ഉണ്ടാക്കുക') + '</button>' +
    '</form>' +
    '<p class="small muted">' + L('Teacher accounts stay pending until the headmaster approves them.', 'പ്രിൻസിപ്പൽ അംഗീകരിക്കുന്നതുവരെ അധ്യാപക അക്കൗണ്ട് പെൻഡിംഗ് ആയിരിക്കും.') + '</p>';

  const form = document.getElementById('oauth-form');
  const tabs = document.getElementById('oauth-tabs');
  const formMsg = document.getElementById('oauth-msg');

  function selectRole(r) {
    role = r;
    tabs.querySelectorAll('[role=tab]').forEach(t => {
      const on = t.dataset.role === r;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    form.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for !== r; });
    form.querySelector('[name=class]').required = r === 'student';
    form.querySelector('[name=roll]').required = r === 'student';
  }
  tabs.addEventListener('click', e => {
    const t = e.target.closest('[role=tab]');
    if (t) selectRole(t.dataset.role);
  });
  selectRole(role);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    UI.hideMsg(formMsg);
    const d = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.completeOAuth({
        role: role,
        full_name: (d.full_name || '').trim(),
        phone: (d.phone || '').trim(),
        class: role === 'student' ? d.class : '',
        roll: role === 'student' ? (d.roll || '').trim() : '',
        subject: role === 'teacher' ? (d.subject || '').trim() : ''
      });
      location.replace(role === 'teacher' ? 'login.html?pending=teacher' : 'dashboard.html');
    } catch (err) {
      UI.showMsg(formMsg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
