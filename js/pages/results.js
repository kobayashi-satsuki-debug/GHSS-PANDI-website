(async function () {
  const session = await Site.mount();
  const gate = document.getElementById('results-gate');
  const panel = document.getElementById('results-panel');
  const form = document.getElementById('result-form');
  const msg = document.getElementById('result-msg');
  const out = document.getElementById('result-output');
  const classSel = document.getElementById('r-class');
  const rollInput = document.getElementById('r-roll');
  const picker = document.getElementById('children-picker');

  if (!session) { gate.hidden = false; panel.hidden = true; return; }
  gate.hidden = true;
  panel.hidden = false;

  const classes = ['8 A','8 B','9 A','9 B','10 A','10 B','Plus One Science','Plus One Humanities','Plus Two Science','Plus Two Humanities'];
  classSel.innerHTML = classes.map(c => '<option value="' + c + '">' + c + '</option>').join('');

  const role = session.profile.role;

  if (role === 'student' && session.student) {
    classSel.value = session.student.class;
    rollInput.value = session.student.roll_no;
  }

  if (role === 'parent') {
    const kids = session.children || [];
    const approved = kids.filter(k => k.link.status === 'approved');
    picker.hidden = false;
    if (approved.length) {
      picker.innerHTML = '<h4 class="mb-1">' + (I18NS.pick('My children', 'എന്റെ കുട്ടികൾ')) + '</h4>' +
        '<div class="flex wrap">' + approved.map(k =>
          '<button type="button" class="btn btn-ghost btn-sm child-btn" data-class="' + UI.esc(k.student.class) +
          '" data-roll="' + UI.esc(k.student.roll_no) + '">' + UI.esc(k.student.full_name) + ' · ' + UI.esc(k.student.class) + '</button>'
        ).join('') + '</div>';
      picker.addEventListener('click', e => {
        const b = e.target.closest('.child-btn');
        if (!b) return;
        classSel.value = b.dataset.class;
        rollInput.value = b.dataset.roll;
        form.requestSubmit();
      });
    } else {
      picker.innerHTML = '<p class="small muted mb-1">' +
        (I18NS.pick('No verified child is linked yet. Add your child from the dashboard; the school must approve it.', 'കുട്ടിയുമായുള്ള ബന്ധം സ്ഥിരീകരിച്ചിട്ടില്ല. ഡാഷ്ബോർഡിൽ കുട്ടിയെ ബന്ധിപ്പിക്കുക.')) + '</p>' +
        '<a class="btn btn-primary btn-sm" href="dashboard.html#children">' +
        (I18NS.pick('Link a child', 'കുട്ടിയെ ബന്ധിപ്പിക്കുക')) + '</a>';
    }
  }

  function render(rows) {
    if (!rows.length) {
      out.innerHTML = window.Components.emptyState('📊', I18NS.t('res.notfound'));
      return;
    }
    const name = rows[0].student_name || '';
    const exam = rows[0].exam || rows[0].exam_name;
    let total = 0, max = 0;
    const body = rows.map(r => {
      total += Number(r.marks);
      max += Number(r.max_marks || 100);
      return '<tr><td>' + UI.esc(r.subject) + '</td><td>' + r.marks + ' / ' + (r.max_marks || 100) +
        '</td><td><span class="tag ' + (String(r.grade || '').charAt(0) === 'A' ? 'green' : '') + '">' + UI.esc(r.grade || '') + '</span></td></tr>';
    }).join('');
    const pct = max ? total / max * 100 : 0;

    out.innerHTML =
      '<article class="card result-sheet" id="result-sheet">' +
        '<header class="result-head">' +
          '<img src="assets/logo.svg" alt="School logo">' +
          '<div><h2>G H S S PANDI</h2><span>Government Higher Secondary School, Pandi, Adoor, Kasaragod, Kerala</span></div>' +
          '<div class="result-exam">' + UI.esc(exam) + '</div>' +
        '</header>' +
        '<div class="result-meta">' +
          '<div><span class="muted small">' + I18NS.t('reg.studentName') + '</span><strong>' + UI.esc(name) + '</strong></div>' +
          '<div><span class="muted small">' + I18NS.t('res.class') + '</span><strong>' + UI.esc(rows[0].class) + '</strong></div>' +
          '<div><span class="muted small">' + I18NS.t('res.roll') + '</span><strong>' + UI.esc(rows[0].roll_no) + '</strong></div>' +
          '<div><span class="muted small">' + I18NS.t('res.published') + '</span><strong>' + UI.formatDate(rows[0].published_at) + '</strong></div>' +
        '</div>' +
        '<table class="data tbl"><thead><tr><th>' + I18NS.t('res.subject') + '</th><th>' + I18NS.t('res.marks') + '</th><th>' + I18NS.t('res.grade') + '</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table>' +
        '<div class="result-total"><span>' + I18NS.t('res.total') + ': <strong>' + total + ' / ' + max + '</strong></span>' +
        '<span>' + I18NS.t('res.percentage') + ': <strong>' + pct.toFixed(1) + '%</strong></span>' +
        '<span>' + I18NS.t('res.grade') + ': <strong>' + API.gradeFor(total, max || 100) + '</strong></span></div>' +
        '<footer class="result-foot"><span>Computer generated result · Published by ' + UI.esc(rows[0].published_by_name || 'school') + '</span>' +
        '<button class="btn btn-ghost btn-sm no-print" type="button" onclick="window.print()">' + I18NS.t('res.print') + '</button></footer>' +
      '</article>';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msg);
    out.innerHTML = '';
    const cls = classSel.value, roll = rollInput.value.trim();
    if (!roll) return UI.showMsg(msg, I18NS.pick('Enter the roll number.', 'റോൾ നമ്പർ നൽകുക.'), 'error');
    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      const rows = await API.resultsForLookup(cls, roll);
      render(rows);
      if (!rows.length) UI.showMsg(msg, I18NS.t('res.notfound'), 'info');
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  if (role === 'student') form.requestSubmit();
})();
