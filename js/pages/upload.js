(async function () {
  await Site.mount();
  const root = document.getElementById('upload-root');
  const L = (en, ml) => I18NS.pick(en, ml);
  const CLASSES = ['8 A','8 B','9 A','9 B','10 A','10 B','Plus One Science','Plus One Humanities','Plus Two Science','Plus Two Humanities'];

  const session = await API.session();
  if (!session) {
    root.innerHTML = '<div class="card" style="max-width:520px">' +
      '<h2>' + L('Staff sign-in needed', 'സ്റ്റാഫ് പ്രവേശനം ആവശ്യം') + '</h2>' +
      '<p class="muted">' + L('Only teachers and the headmaster can upload notes.', 'അധ്യാപകർക്കും പ്രിൻസിപ്പലിനും മാത്രം അപ്‌ലോഡ് ചെയ്യാം.') + '</p>' +
      '<p><a class="btn btn-primary" href="staff.html?next=upload.html">' + L('Staff sign in', 'സ്റ്റാഫ് പ്രവേശനം') + '</a></p></div>';
    return;
  }

  const role = session.profile.role;
  if (role !== 'teacher' && role !== 'admin') {
    root.innerHTML = '<div class="card" style="max-width:520px">' +
      '<h2>' + L('This page is for staff', 'ഈ പേജ് സ്റ്റാഫിനുള്ളതാണ്') + '</h2>' +
      '<p class="muted">' + L('Notes are uploaded by teachers and the headmaster. You can read them on the Resources page.', 'കുറിപ്പുകൾ അധ്യാപകരും പ്രിൻസിപ്പലും ആണ് അപ്‌ലോഡ് ചെയ്യുന്നത്. റിസോഴ്‌സ് പേജിൽ വായിക്കാം.') + '</p>' +
      '<p><a class="btn btn-primary" href="resources.html">' + L('Go to notes', 'കുറിപ്പുകളിലേക്ക്') + '</a></p></div>';
    return;
  }

  const size = n => {
    const b = Number(n || 0);
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024) return Math.round(b / 1024) + ' KB';
    return b + ' B';
  };

  root.innerHTML =
    '<div class="card res-upload-card">' +
      '<h2>' + L('New PDF note', 'പുതിയ PDF കുറിപ്പ്') + '</h2>' +
      '<form class="mini-form" id="up-form" novalidate>' +
        '<div class="form-row"><div class="form-field"><label>' + L('Class', 'ക്ലാസ്') + '</label>' +
          '<select name="class" required><option value="">' + L('Choose a class', 'ക്ലാസ് തിരഞ്ഞെടുക്കുക') + '</option>' +
            CLASSES.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
        '<div class="form-field"><label>' + L('Subject', 'വിഷയം') + '</label>' +
          '<input name="subject" list="up-subjects" required placeholder="' + L('e.g. Mathematics', 'ഉദാ: ഗണിതം') + '">' +
          '<datalist id="up-subjects"><option>Mathematics<option>English<option>Malayalam<option>Hindi<option>Arabic<option>Physics<option>Chemistry<option>Biology<option>Social Science<option>Computer Science</datalist></div></div>' +
        '<div class="form-field"><label>' + L('Title', 'തലക്കെട്ട്') + '</label><input name="title" required maxlength="120" placeholder="' +
          L('Chapter 4 — Quadratic equations notes', 'അധ്യായം 4 — ദ്വിമാന സമവാക്യ കുറിപ്പുകൾ') + '"></div>' +
        '<div class="form-field"><label>' + L('Description (optional)', 'വിവരണം (ഐച്ഛികം)') + '</label><textarea name="description" rows="2" maxlength="500"></textarea></div>' +
        '<div class="form-field"><label>' + L('PDF file (max 20 MB)', 'PDF ഫയൽ (പരമാവധി 20 MB)') + '</label>' +
          '<input type="file" name="file" accept="application/pdf,.pdf" required></div>' +
        '<div class="form-msg" id="up-msg" role="alert"></div>' +
        '<div><button class="btn btn-primary" type="submit">' + L('Upload for students', 'വിദ്യാർത്ഥികൾക്കായി അപ്‌ലോഡ് ചെയ്യുക') + '</button></div>' +
      '</form></div>' +
    '<h2 class="res-h2">' + L('Uploaded notes', 'അപ്‌ലോഡ് ചെയ്ത കുറിപ്പുകൾ') + '</h2>' +
    '<div id="up-list"><div class="skeleton" style="height:70px"></div></div>';

  const form = document.getElementById('up-form');
  const msg = document.getElementById('up-msg');
  const list = document.getElementById('up-list');

  async function load() {
    try {
      const rows = await API.resources({});
      list.innerHTML = rows.length
        ? rows.map(r => '<div class="res-row"><div><strong>' + UI.esc(r.title) + '</strong>' +
            '<div class="sub">' + UI.esc(r.class) + ' · ' + UI.esc(r.subject) + ' · ' + size(r.file_size) + ' · ' +
            UI.formatDate(r.created_at) + ' · ' + UI.esc(r.uploader_name || '') + '</div></div>' +
            '<div class="row-actions"><a class="btn btn-ghost btn-sm" href="resources.html">' + L('View', 'കാണുക') + '</a>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-del="' + r.id + '">' + L('Delete', 'നീക്കുക') + '</button></div></div>').join('')
        : '<div class="empty"><span class="big">📄</span>' + L('No PDF notes uploaded yet.', 'ഇതുവരെ കുറിപ്പുകൾ ഇല്ല.') + '</div>';
    } catch (err) {
      list.innerHTML = '<div class="empty">' + UI.esc(API.errorText(err)) + '</div>';
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    UI.hideMsg(msg);
    const d = Object.fromEntries(new FormData(form).entries());
    const file = form.querySelector('[name=file]').files[0];
    if (!d.class || !d.subject.trim() || !d.title.trim() || !file) {
      return UI.showMsg(msg, I18NS.t('err.required'), 'error');
    }
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      return UI.showMsg(msg, L('Please choose a PDF file.', 'PDF ഫയൽ തിരഞ്ഞെടുക്കുക.'), 'error');
    }
    if (file.size > 20 * 1024 * 1024) {
      return UI.showMsg(msg, L('That file is bigger than 20 MB.', 'ഫയൽ 20 MB-ൽ കൂടുതലാണ്.'), 'error');
    }
    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.uploadResource({
        file: file, class: d.class, subject: d.subject.trim(),
        title: d.title.trim(), description: (d.description || '').trim()
      });
      form.reset();
      UI.showMsg(msg, L('Uploaded. Students can download it from the Resources page.', 'അപ്‌ലോഡ് ചെയ്തു. വിദ്യാർത്ഥികൾക്ക് റിസോഴ്‌സ് പേജിൽ നിന്ന് ഡൗൺലോഡ് ചെയ്യാം.'), 'success');
      load();
    } catch (err) {
      UI.showMsg(msg, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    if (!confirm(L('Delete this note for everyone?', 'ഈ കുറിപ്പ് എല്ലാവർക്കുമായി നീക്കണോ?'))) return;
    b.disabled = true;
    try {
      await API.deleteResource(b.dataset.del);
      load();
    } catch (err) {
      UI.toast(API.errorText(err), 'error');
      b.disabled = false;
    }
  });

  load();
})();
