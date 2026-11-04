(async function () {
  const session = await Site.mount();
  if (session) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('register-form');
  const msg = document.getElementById('reg-msg');
  const tabs = document.getElementById('reg-tabs');
  const note = document.getElementById('reg-note');
  const blocks = {
    student: document.getElementById('student-fields'),
    teacher: document.getElementById('teacher-fields'),
    parent: document.getElementById('parent-fields')
  };
  let role = 'student';

  const notes = {
    student: ['Use the class and roll number printed on your school record. The office verifies new admissions.', 'സ്കൂൾ രേഖയിലെ ക്ലാസും റോൾ നമ്പറും ഉപയോഗിക്കുക. ഓഫീസ് പരിശോധിക്കും.'],
    teacher: ['Teacher accounts are verified by the school administration before they become active.', 'അധ്യാപക അക്കൗണ്ടുകൾ സ്കൂൾ ഭരണവിഭാഗം പരിശോധിച്ച് അംഗീകരിക്കുന്നു.'],
    parent: ['Parents register themselves; the school verifies your relationship to the student.', 'രക്ഷിതാക്കൾ സ്വയം രജിസ്റ്റർ ചെയ്യുന്നു; ബന്ധം സ്കൂൾ പരിശോധിക്കുന്നു.']
  };

  function selectRole(r) {
    role = r;
    tabs.querySelectorAll('[role=tab]').forEach(t => {
      const on = t.dataset.role === r;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    Object.keys(blocks).forEach(k => { if (blocks[k]) blocks[k].hidden = k !== r; });
    note.textContent = I18NS.pick(notes[r][0], notes[r][1]);
  }

  tabs.addEventListener('click', e => {
    const tab = e.target.closest('[role=tab]');
    if (tab) selectRole(tab.dataset.role);
  });
  selectRole(location.hash === '#parent' ? 'parent' : (location.hash === '#teacher' ? 'teacher' : 'student'));

  const get = id => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    const name = get('reg-name').trim();
    const email = get('reg-email').trim();
    const phone = get('reg-phone').trim();
    const pw = get('reg-password');
    const pw2 = get('reg-password2');

    if (!name) return UI.showMsg(msg, I18NS.t('err.required'), 'error');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    if (!/^[0-9]{10}$/.test(phone)) return UI.showMsg(msg, I18NS.t('err.phone'), 'error');
    if (pw.length < 8) return UI.showMsg(msg, I18NS.t('err.passwordShort'), 'error');
    if (pw !== pw2) return UI.showMsg(msg, I18NS.pick('Passwords do not match.', 'പാസ്‌വേഡുകൾ ഒത്തുപോകുന്നില്ല.'), 'error');

    const extra = {};
    if (role === 'student') {
      extra.class = get('reg-class');
      extra.roll_no = get('reg-roll').trim();
      extra.admission_no = get('reg-admission').trim();
      if (!extra.roll_no) return UI.showMsg(msg, I18NS.pick('Enter your roll number.', 'റോൾ നമ്പർ നൽകുക.'), 'error');
    }
    if (role === 'teacher') {
      extra.employee_no = get('reg-employee').trim();
      extra.subject = get('reg-subject').trim();
      if (!extra.employee_no) return UI.showMsg(msg, I18NS.pick('Enter your staff ID.', 'സ്റ്റാഫ് ഐഡി നൽകുക.'), 'error');
    }
    if (role === 'parent') extra.relationship = get('reg-relationship');

    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const res = await API.signUp({ email, password: pw, role, full_name: name, phone, extra });
      const key = role === 'teacher' ? 'reg.doneTeacher' : role === 'parent' ? 'reg.doneParent' : 'reg.doneStudent';
      let text = I18NS.t(key);
      if (res && res.needsEmailConfirm) {
        text += ' ' + (I18NS.pick('Check your email for the confirmation link.', 'ഇമെയിൽ സ്ഥിരീകരണ ലിങ്ക് അയച്ചിട്ടുണ്ട്.'));
      }
      UI.showMsg(msg, text, 'success');
      setTimeout(() => { location.href = role === 'parent' ? 'login.html#parent' : 'login.html'; }, 2400);
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
