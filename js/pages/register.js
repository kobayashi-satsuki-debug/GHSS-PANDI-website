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
      if (res && (res.needsOtp || res.needsEmailConfirm)) {
        startOtp(email, res.devCode);
      } else {
        finish(role);
      }
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  /* ---------- step 2: email OTP ---------- */
  const otpStep = document.getElementById('otp-step');
  const otpHint = document.getElementById('otp-hint');
  const otpMsg = document.getElementById('otp-msg');
  const otpInput = document.getElementById('otp-code');
  const otpVerify = document.getElementById('otp-verify');
  const otpResend = document.getElementById('otp-resend');
  let otpEmail = '';
  let resendTimer = null;

  function startOtp(email, devCode) {
    otpEmail = email;
    form.hidden = true;
    otpStep.hidden = false;
    otpInput.value = '';
    UI.hideMsg(msg);
    otpHint.textContent = I18NS.pick(
      'We sent a 6-digit code to ' + email + '. Enter it below — there is no link to click.',
      email + ' എന്ന വിലാസത്തിലേക്ക് 6 അക്ക കോഡ് അയച്ചു. താഴെ നൽകുക — ലിങ്ക് ക്ലിക്ക് ചെയ്യേണ്ടതില്ല.'
    ) + (devCode ? ' ' + I18NS.pick('Preview mode — your code is ' + devCode, 'പ്രിവ്യൂ മോഡ് — നിങ്ങളുടെ കോഡ് ' + devCode) : '');
    otpInput.focus();
    if (devCode) UI.showMsg(otpMsg, I18NS.pick('Preview mode: use code ' + devCode, 'പ്രിവ്യൂ മോഡ്: കോഡ് ' + devCode), 'info');
    startResendCountdown();
  }

  function startResendCountdown() {
    let left = 60;
    clearInterval(resendTimer);
    otpResend.disabled = true;
    otpResend.textContent = I18NS.pick('Resend in ' + left + 's', 'വീണ്ടും അയയ്ക്കാൻ ' + left + ' സെ');
    resendTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(resendTimer);
        otpResend.disabled = false;
        otpResend.textContent = I18NS.pick('Resend code', 'കോഡ് വീണ്ടും അയയ്ക്കുക');
        return;
      }
      otpResend.textContent = I18NS.pick('Resend in ' + left + 's', 'വീണ്ടും അയയ്ക്കാൻ ' + left + ' സെ');
    }, 1000);
  }

  function finish(r) {
    const key = r === 'teacher' ? 'reg.doneTeacher' : r === 'parent' ? 'reg.doneParent' : 'reg.doneStudent';
    UI.showMsg(otpMsg, I18NS.t(key), 'success');
    if (form) UI.showMsg(msg, I18NS.t(key), 'success');
    setTimeout(() => { location.href = r === 'parent' ? 'login.html#parent' : 'login.html'; }, 2200);
  }

  async function submitOtp() {
    const code = otpInput.value.replace(/\D/g, '');
    UI.hideMsg(otpMsg);
    if (code.length !== 6) return UI.showMsg(otpMsg, I18NS.pick('Enter the 6-digit code.', '6 അക്ക കോഡ് നൽകുക.'), 'error');
    UI.busy(otpVerify, true);
    try {
      const res = await API.verifySignupOtp(otpEmail, code);
      clearInterval(resendTimer);
      finish(role);
      return res;
    } catch (err) {
      UI.showMsg(otpMsg, API.errorText(err), 'error');
      otpInput.select();
    } finally {
      UI.busy(otpVerify, false);
    }
  }

  otpVerify.addEventListener('click', submitOtp);
  otpInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitOtp(); } });
  otpInput.addEventListener('input', () => { otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6); });

  otpResend.addEventListener('click', async () => {
    UI.hideMsg(otpMsg);
    try {
      const res = await API.resendSignupOtp(otpEmail);
      if (res && res.devCode) UI.showMsg(otpMsg, I18NS.pick('Preview mode: new code ' + res.devCode, 'പ്രിവ്യൂ മോഡ്: പുതിയ കോഡ് ' + res.devCode), 'info');
      else UI.showMsg(otpMsg, I18NS.pick('A new code is on its way.', 'പുതിയ കോഡ് അയച്ചിട്ടുണ്ട്.'), 'success');
      startResendCountdown();
    } catch (err) {
      UI.showMsg(otpMsg, API.errorText(err), 'error');
    }
  });
})();
