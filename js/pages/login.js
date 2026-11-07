(async function () {
  const session = await Site.mount();
  if (session) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');

  // A confirmation or recovery link lands here with its outcome in the URL.
  const linkStatus = API.urlAuthStatus();
  if (msg && linkStatus.error) {
    UI.showMsg(msg, I18NS.t('auth.linkExpired'), 'error');
    API.cleanAuthUrl();
  } else if (msg && linkStatus.confirmed) {
    UI.showMsg(msg, I18NS.t('auth.confirmed'), 'success');
    API.cleanAuthUrl();
  }
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

  let currentRole = 'student';
  let codeReady = false;

  function selectRole(role) {
    tabs.querySelectorAll('[role=tab]').forEach(t => {
      const on = t.dataset.role === role;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    const pair = notes[role] || notes.student;
    note.textContent = I18NS.pick(pair[0], pair[1]);
    // A student's only way in is the six-digit code; staff and parents keep a
    // password, with the code form still one click away.
    currentRole = role;
    if (codeReady) showCode(role === 'student');
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

  /* ---------- six-digit code sign-in ---------- */
  const codeForm = document.getElementById('login-code-form');
  const codeEmail = document.getElementById('code-email');
  const codeStep = document.getElementById('code-step');
  const codeInput = document.getElementById('code-input');
  const codeMsg = document.getElementById('code-msg');
  const codeSubmit = document.getElementById('code-submit');
  const codeResend = document.getElementById('code-resend');
  const toPassword = document.getElementById('code-to-password');
  const toCode = document.getElementById('password-to-code');
  let codeSentTo = '';
  let resendTimer = null;

  function showCode(on) {
    if (!codeForm || !form) return;
    codeForm.hidden = !on;
    form.hidden = on;
    UI.hideMsg(on ? msg : codeMsg);
    if (on) (codeStep.hidden ? codeEmail : codeInput).focus();
    else email.focus();
  }

  function awaitingCode(on) {
    codeStep.hidden = !on;
    codeResend.hidden = !on;
    codeSubmit.textContent = on
      ? I18NS.pick('Sign in', 'പ്രവേശിക്കുക')
      : I18NS.pick('Send me a code', 'കോഡ് അയയ്ക്കുക');
    if (on) codeInput.focus();
  }

  function startCodeCountdown() {
    let left = 45;
    clearInterval(resendTimer);
    codeResend.disabled = true;
    codeResend.textContent = I18NS.pick('Send a new code in ' + left + 's', 'പുതിയ കോഡ് ' + left + ' സെക്കൻഡിൽ');
    resendTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(resendTimer);
        codeResend.disabled = false;
        codeResend.textContent = I18NS.pick('Send a new code', 'പുതിയ കോഡ് അയയ്ക്കുക');
        return;
      }
      codeResend.textContent = I18NS.pick('Send a new code in ' + left + 's', 'പുതിയ കോഡ് ' + left + ' സെക്കൻഡിൽ');
    }, 1000);
  }

  async function requestCode() {
    const addr = (codeEmail.value || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      return UI.showMsg(codeMsg, I18NS.t('err.email'), 'error');
    }
    UI.busy(codeSubmit, true);
    try {
      const res = await API.sendLoginOtp(addr);
      codeSentTo = addr;
      try { localStorage.setItem('ghss_pending_email', addr); } catch (e) {}
      awaitingCode(true);
      UI.showMsg(codeMsg, (res && res.devCode)
        ? I18NS.pick('Preview mode: your code is ' + res.devCode, 'പ്രിവ്യൂ മോഡ്: കോഡ് ' + res.devCode)
        : I18NS.pick('A six-digit code is on its way to ' + addr + '. Type it above.', addr + ' എന്ന വിലാസത്തിലേക്ക് ആറ് അക്ക കോഡ് അയച്ചു.'),
        (res && res.devCode) ? 'info' : 'success');
      startCodeCountdown();
    } catch (err) {
      UI.showMsg(codeMsg, API.errorText(err), 'error');
    } finally {
      UI.busy(codeSubmit, false);
    }
  }

  async function submitCode() {
    const code = codeInput.value.replace(/\D/g, '');
    if (code.length !== 6) return UI.showMsg(codeMsg, I18NS.pick('Enter the 6-digit code.', '6 അക്ക കോഡ് നൽകുക.'), 'error');
    UI.busy(codeSubmit, true);
    try {
      const prof = await API.verifyLoginOtp(codeSentTo || codeEmail.value.trim().toLowerCase(), code);
      clearInterval(resendTimer);
      location.href = (prof && prof.role === 'parent') ? 'dashboard.html#children' : 'dashboard.html';
    } catch (err) {
      UI.showMsg(codeMsg, API.errorText(err), 'error');
      codeInput.select();
    } finally {
      UI.busy(codeSubmit, false);
    }
  }

  if (codeForm) {
    codeForm.addEventListener('submit', e => {
      e.preventDefault();
      if (codeStep.hidden) requestCode(); else submitCode();
    });
    codeResend.addEventListener('click', requestCode);
    codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6); });
    if (toPassword) toPassword.addEventListener('click', e => { e.preventDefault(); showCode(false); });
    if (toCode) toCode.addEventListener('click', e => {
      e.preventDefault();
      if (codeEmail && !codeEmail.value && email.value) codeEmail.value = email.value;
      showCode(true);
    });
  }

  codeReady = true;
  showCode(currentRole === 'student');

  if (/[?&]pending=teacher/.test(location.search) && msg) {
    UI.showMsg(msg, I18NS.t('auth.pendingTeacher'), 'info');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    const em = email.value.trim();
    const pw = document.getElementById('login-password').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return UI.showMsg(msg, I18NS.t('err.email'), 'error');
    if (!pw) return UI.showMsg(msg, I18NS.t('err.required'), 'error');

    const wait = window.Security ? Security.signInWaitMinutes(em) : 0;
    if (wait > 0) return UI.showMsg(msg, I18NS.t('err.tooManyTries').replace('{n}', wait), 'error');

    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const s = await API.signIn(em, pw);
      if (window.Security) Security.clearSignInTries(em);
      const next = new URLSearchParams(location.search).get('next');
      const prof = s && (s.profile || s);
      const role = prof ? prof.role : '';
      const target = next && next.indexOf('http') !== 0 ? next : 'dashboard.html';
      location.href = (role === 'parent' && target === 'dashboard.html') ? 'dashboard.html#children' : target;
    } catch (err) {
      if (window.Security) {
        const left = Security.noteFailedSignIn(em);
        if (left > 0) {
          UI.showMsg(msg, I18NS.t('err.tooManyTries').replace('{n}', left), 'error');
          UI.busy(btn, false);
          return;
        }
      }
      UI.showMsg(msg, API.errorText(err), 'error');
      UI.busy(btn, false);
    }
  });
})();
