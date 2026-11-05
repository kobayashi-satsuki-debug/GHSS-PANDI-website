(async function () {
  await Site.mount();
  const root = document.getElementById('resources-root');
  const L = (en, ml) => I18NS.pick(en, ml);
  const CLASSES = ['8 A','8 B','9 A','9 B','10 A','10 B','Plus One Science','Plus One Humanities','Plus Two Science','Plus Two Humanities'];

  const session = await API.session();
  if (!session) {
    root.innerHTML = '<div class="card" style="max-width:520px">' +
      '<h2>' + L('Sign in to see the notes', 'കുറിപ്പുകൾ കാണാൻ പ്രവേശിക്കുക') + '</h2>' +
      '<p class="muted">' + L('PDF notes are for signed-in students, teachers and staff of the school.', 'പിഡിഎഫ് കുറിപ്പുകൾ സ്കൂളിലെ വിദ്യാർത്ഥികൾക്കും അധ്യാപകർക്കും സ്റ്റാഫിനും മാത്രം.') + '</p>' +
      '<p><a class="btn btn-primary" href="login.html?next=resources.html">' + L('Sign in', 'പ്രവേശിക്കുക') + '</a></p></div>';
    return;
  }

  const role = session.profile.role;
  if (role !== 'student' && role !== 'teacher' && role !== 'admin') {
    root.innerHTML = '<div class="card" style="max-width:520px">' +
      '<h2>' + L('Notes are not open to this account', 'ഈ അക്കൗണ്ടിന് കുറിപ്പുകൾ ലഭ്യമല്ല') + '</h2>' +
      '<p class="muted">' + L('The notes library is for students, teachers and staff. Parents can see their child\'s results instead.', 'കുറിപ്പുകൾ വിദ്യാർത്ഥികൾക്കും അധ്യാപകർക്കും സ്റ്റാഫിനും മാത്രം. രക്ഷിതാക്കൾക്ക് മക്കളുടെ ഫലങ്ങൾ കാണാം.') + '</p>' +
      '<p><a class="btn btn-primary" href="results.html">' + L('Exam results', 'പരീക്ഷാ ഫലങ്ങൾ') + '</a></p></div>';
    return;
  }
  const isStaff = role === 'teacher' || role === 'admin';
  let filter = { class: '', subject: '' };

  root.innerHTML =
    '<div class="res-toolbar">' +
      '<div class="form-field"><label for="res-class">' + L('Class', 'ക്ലാസ്') + '</label>' +
        '<select id="res-class"><option value="">' + L('All classes', 'എല്ലാ ക്ലാസുകളും') + '</option>' +
        CLASSES.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
      '<div class="form-field"><label for="res-subject">' + L('Subject', 'വിഷയം') + '</label>' +
        '<input id="res-subject" placeholder="' + L('e.g. Maths', 'ഉദാ: ഗണിതം') + '"></div>' +
      (isStaff ? '<div class="form-field" style="align-self:end"><a class="btn btn-primary" href="upload.html">' +
        L('Upload a PDF', 'പിഡിഎഫ് അപ്‌ലോഡ് ചെയ്യുക') + '</a></div>' : '') +
    '</div>' +
    '<div id="res-list"><div class="skeleton" style="height:90px;margin-bottom:.8rem"></div><div class="skeleton" style="height:90px"></div></div>';

  const list = document.getElementById('res-list');
  const classSel = document.getElementById('res-class');
  const subjectIn = document.getElementById('res-subject');

  const size = n => {
    const b = Number(n || 0);
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024) return Math.round(b / 1024) + ' KB';
    return b + ' B';
  };

  async function load() {
    list.innerHTML = '<div class="skeleton" style="height:90px"></div>';
    try {
      const rows = await API.resources(filter);
      if (!rows.length) {
        list.innerHTML = '<div class="empty"><span class="big">📄</span>' +
          L('No notes here yet. Teachers add them from the Upload page.', 'ഇവിടെ കുറിപ്പുകൾ ഇല്ല. അധ്യാപകർ അപ്‌ലോഡ് പേജിൽ നിന്ന് ചേർക്കും.') + '</div>';
        return;
      }
      list.innerHTML = rows.map(r =>
        '<div class="res-card"><div class="res-icon">📄</div><div class="res-body">' +
          '<h3>' + UI.esc(r.title) + '</h3>' +
          '<p class="res-meta"><span class="pill">' + UI.esc(r.class) + '</span> ' +
            '<span class="pill">' + UI.esc(r.subject) + '</span> ' +
            '<span class="sub">' + size(r.file_size) + ' · ' + UI.formatDate(r.created_at) + ' · ' + UI.esc(r.uploader_name || '') + '</span></p>' +
          (r.description ? '<p class="small muted">' + UI.esc(r.description) + '</p>' : '') +
        '</div><div class="res-actions">' +
          '<button class="btn btn-primary btn-sm" type="button" data-dl="' + r.id + '">' + L('Download', 'ഡൗൺലോഡ്') + '</button>' +
        '</div></div>').join('');
      list.dataset.rows = JSON.stringify(rows);
    } catch (err) {
      list.innerHTML = '<div class="empty">' + UI.esc(API.errorText(err)) + '</div>';
    }
  }

  classSel.addEventListener('change', () => { filter.class = classSel.value; load(); });
  subjectIn.addEventListener('input', () => {
    clearTimeout(subjectIn._t);
    subjectIn._t = setTimeout(() => { filter.subject = subjectIn.value; load(); }, 300);
  });

  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-dl]');
    if (!b) return;
    const rows = JSON.parse(list.dataset.rows || '[]');
    const row = rows.find(r => r.id === b.dataset.dl);
    if (!row) return;
    b.disabled = true;
    try {
      const url = await API.resourceUrl(row);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.file_name || 'notes.pdf';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      UI.toast(API.errorText(err), 'error');
    }
    b.disabled = false;
  });

  load();
})();
