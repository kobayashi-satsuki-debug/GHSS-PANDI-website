(async function () {
  await Site.mount();
  const session = await Site.requireRole(null, 'login.html');
  if (!session) return;

  const me = session.profile;
  const role = me.role;
  const isAdmin = role === 'admin';
  const isStaff = role === 'teacher' || isAdmin;
  const main = document.getElementById('dash-main');
  const nav = document.getElementById('dash-nav');
  document.getElementById('dash-avatar').textContent = UI.initials(me.full_name);
  document.getElementById('dash-name').textContent = me.full_name;
  document.getElementById('dash-role').textContent = I18NS.t('auth.' + role);
  document.getElementById('logout-btn').addEventListener('click', () => Site.logout());

  const L = (en, ml) => I18NS.pick(en, ml);
  const head = (title, sub, right) =>
    '<div class="pane-head"><div><h2>' + title + '</h2><p>' + (sub || '') + '</p></div>' +
    (right ? '<div class="row-actions">' + right + '</div>' : '') + '</div>';
  const none = text => '<div class="empty"><span class="big">🗂️</span>' + text + '</div>';
  const pill = (text, cls) => '<span class="pill ' + (cls || '') + '">' + UI.esc(text) + '</span>';
  const statusPill = s => {
    const map = { active: 'ok', approved: 'ok', pending: 'warn', rejected: 'bad', disabled: 'bad', open: 'warn', resolved: 'ok', dismissed: '' };
    return pill(I18NS.t('st.' + s) || s, map[s] || '');
  };
  const classes = ['8 A','8 B','9 A','9 B','10 A','10 B','Plus One Science','Plus One Humanities','Plus Two Science','Plus Two Humanities'];
  const classOptions = (sel, blank) => (blank ? '<option value="">' + L('Select class', 'ക്ലാസ് തിരഞ്ഞെടുക്കുക') + '</option>' : '') +
    classes.map(c => '<option' + (c === sel ? ' selected' : '') + '>' + c + '</option>').join('');

  const PANES = {};

  /* CSV export: data captured while a pane renders, columns described per key. */
  const CSV = {};
  const CSV_COLS = {
    students: [
      [['Name', 'പേര്'], s => s.full_name],
      [['Email', 'ഇമെയിൽ'], s => s.email],
      [['Class', 'ക്ലാസ്'], s => s.class],
      [['Roll', 'റോൾ'], s => s.roll_no],
      [['Status', 'നില'], s => s.account_status || s.status]
    ],
    parents: [
      [['Parent', 'രക്ഷിതാവ്'], r => r.parent_name],
      [['Parent email', 'രക്ഷിതാവിന്റെ ഇമെയിൽ'], r => r.parent_email],
      [['Parent phone', 'ഫോൺ'], r => r.parent_phone],
      [['Student', 'വിദ്യാർത്ഥി'], r => r.student_name],
      [['Class', 'ക്ലാസ്'], r => r.student_class],
      [['Roll', 'റോൾ'], r => r.student_roll],
      [['Relationship', 'ബന്ധം'], r => r.relationship],
      [['Status', 'നില'], r => r.status]
    ],
    enquiries: [
      [['Submitted', 'സമർപ്പിച്ചത്'], r => r.created_at],
      [['Student', 'വിദ്യാർത്ഥി'], r => r.student_name],
      [['Class', 'ക്ലാസ്'], r => r.class],
      [['Parent', 'രക്ഷിതാവ്'], r => r.parent_name],
      [['Phone', 'ഫോൺ'], r => r.phone],
      [['Email', 'ഇമെയിൽ'], r => r.email],
      [['Message', 'സന്ദേശം'], r => r.message]
    ],
    history: [
      [['When', 'സമയം'], r => r.created_at],
      [['By', 'ആൾ'], r => r.actor_name || r.actor || 'system'],
      [['Action', 'നടപടി'], r => r.action],
      [['Details', 'വിവരം'], r => r.details || r.target || '']
    ],
    accounts: [
      [['Name', 'പേര്'], s => s.full_name],
      [['Email', 'ഇമെയിൽ'], s => s.email],
      [['Class', 'ക്ലാസ്'], s => s.class],
      [['Roll', 'റോൾ'], s => s.roll_no],
      [['Account status', 'അക്കൗണ്ട് നില'], s => s.account_status || s.status]
    ],
    teachers: [
      [['Name', 'പേര്'], t => t.full_name],
      [['Email', 'ഇമെയിൽ'], t => t.email],
      [['Subject', 'വിഷയം'], t => t.subject],
      [['Classes', 'ക്ലാസുകൾ'], t => (t.classes || []).join(', ')],
      [['Status', 'നില'], t => t.status]
    ],
    notices: [
      [['Date', 'തീയതി'], n => n.created_at],
      [['Title', 'തലക്കെട്ട്'], n => n.title_en],
      [['Malayalam title', 'മലയാളം തലക്കെട്ട്'], n => n.title_ml],
      [['Category', 'വിഭാഗം'], n => n.category],
      [['Published', 'പ്രസിദ്ധീകരിച്ചു'], n => n.is_published ? 'yes' : 'no'],
      [['Pinned', 'പിൻ ചെയ്തത്'], n => n.is_pinned ? 'yes' : 'no'],
      [['Author', 'രചയിതാവ്'], n => n.author]
    ]
  };

  const csvDate = new Date().toISOString().slice(0, 10);
  const csvBtn = key => '<button class="btn btn-ghost btn-sm" type="button" data-csv="' + key + '">' + L('Export CSV', 'CSV ഡൗൺലോഡ്') + '</button>';

  main.addEventListener('click', e => {
    const b = e.target.closest('[data-csv]');
    if (!b) return;
    const key = b.dataset.csv;
    const rows = CSV[key] || [];
    if (!rows.length) return UI.toast(L('Nothing to export yet.', 'എക്സ്പോർട്ട് ചെയ്യാൻ ഇപ്പോൾ ഒന്നുമില്ല.'), 'error');
    const cols = CSV_COLS[key];
    UI.downloadCsv('ghss-pandi-' + key + '-' + csvDate + '.csv', cols.map(c => I18NS.pick(c[0][0], c[0][1])), rows.map(r => cols.map(c => c[1](r))));
  });

  // ---------------- overview ----------------
  PANES.overview = {
    label: () => L('Overview', 'അവലോകനം'),
    async render() {
      let html = head(L('Welcome, ', 'സ്വാഗതം, ') + UI.esc(me.full_name || ''), L('Your school account at a glance.', 'നിങ്ങളുടെ അക്കൗണ്ട് ഒറ്റനോട്ടത്തിൽ.'));
      const stats = [];
      if (role === 'student' && session.student) {
        stats.push([session.student.class, L('Class', 'ക്ലാസ്')]);
        stats.push([session.student.roll_no, L('Roll number', 'റോൾ നമ്പർ')]);
      }
      if (role === 'teacher' && session.teacher) {
        stats.push([(session.classes || []).length, L('Assigned classes', 'ക്ലാസുകൾ')]);
        stats.push([I18NS.t('st.' + session.teacher.status), L('Approval', 'അംഗീകാരം')]);
      }
      if (role === 'parent') {
        const kids = session.children || [];
        stats.push([kids.length, L('Linked children', 'കുട്ടികൾ')]);
        stats.push([kids.filter(k => k.link.status === 'approved').length, L('Verified', 'സ്ഥിരീകരിച്ചത്')]);
      }
      if (isAdmin) {
        stats.push(['—', L('Administrator', 'അഡ്മിനിസ്ട്രേറ്റർ')]);
      }
      if (stats.length) {
        html += '<div class="stat-grid">' + stats.map(s => '<div class="stat"><strong>' + UI.esc(String(s[0])) + '</strong><span>' + s[1] + '</span></div>').join('') + '</div>';
      }

      const actions = [];
      if (role === 'student') actions.push(['ai.html', L('Open the AI study buddy', 'എ.ഐ പഠന സഹായി തുറക്കുക')]);
      if (role === 'student' || isStaff) actions.push(['chat.html', L('Open class chat', 'ക്ലാസ് ചാറ്റ്')]);
      if (role !== 'teacher') actions.push(['results.html', L('View results', 'ഫലങ്ങൾ')]);
      if (isStaff) actions.push(['#publish', L('Publish results', 'ഫലം പ്രകാശനം')]);
      if (isAdmin) actions.push(['#registrations', L('Approve teachers', 'അധ്യാപക അംഗീകാരം')]);
      if (role === 'parent') actions.push(['#children', L('Link a child', 'കുട്ടിയെ ബന്ധിപ്പിക്കുക')]);
      actions.push(['notices.html', L('School notices', 'അറിയിപ്പുകൾ')]);

      html += '<div class="dash-card"><h3>' + L('Quick actions', 'പെട്ടെന്നുള്ള കാര്യങ്ങൾ') + '</h3><div class="row-actions">' +
        actions.map(a => '<a class="btn ' + (a[0].charAt(0) === '#' ? 'btn-ghost' : 'btn-primary') + ' btn-sm" href="' + a[0] + '">' + a[1] + '</a>').join('') +
        '</div></div>';

      try {
        const latest = await API.notices({});
        const items = latest.slice(0, 3);
        html += '<div class="dash-card"><h3>' + L('Latest notices', 'പുതിയ അറിയിപ്പുകൾ') + '</h3>' +
          (items.length ? '<div class="list-card">' + items.map(n =>
            '<div class="list-row"><div class="grow"><strong>' + UI.esc(I18NS.getLang() === 'ml' && n.title_ml ? n.title_ml : n.title_en) +
            '</strong><div class="sub">' + UI.formatDate(n.created_at) + '</div></div></div>').join('') + '</div>'
            : none(L('No notices yet.', 'അറിയിപ്പുകൾ ഇല്ല.'))) + '</div>';
      } catch (e) { /* notices are optional on the overview */ }

      if (!API.isLive) {
        html += '<p class="small muted">' + L('Preview mode: changes are saved in this browser only.', 'പ്രിവ്യൂ മോഡ്: മാറ്റങ്ങൾ ഈ ബ്രൗസറിൽ മാത്രം.') + '</p>';
      }
      return html;
    }
  };

  // ---------------- profile ----------------
  PANES.profile = {
    label: () => L('My profile', 'എന്റെ പ്രൊഫൈൽ'),
    async render() {
      const rows = [
        [L('Full name', 'പേര്'), me.full_name],
        [L('Email', 'ഇമെയിൽ'), me.email],
        [L('Phone', 'ഫോൺ'), me.phone || '—'],
        [L('Role', 'റോൾ'), I18NS.t('auth.' + role)],
        [L('Account status', 'അക്കൗണ്ട് നില'), I18NS.t('st.' + me.status) || me.status]
      ];
      if (role === 'student' && session.student) {
        rows.push([L('Class', 'ക്ലാസ്'), session.student.class]);
        rows.push([L('Roll number', 'റോൾ നമ്പർ'), session.student.roll_no]);
        rows.push([L('Admission number', 'അഡ്മിഷൻ നമ്പർ'), session.student.admission_no || '—']);
      }
      if (role === 'teacher' && session.teacher) {
        rows.push([L('Staff ID', 'സ്റ്റാഫ് ഐഡി'), session.teacher.employee_no || '—']);
        rows.push([L('Subject', 'വിഷയം'), session.teacher.subject || '—']);
        rows.push([L('Assigned classes', 'ക്ലാസുകൾ'), (session.classes || []).join(', ') || '—']);
      }
      return head(L('My profile', 'എന്റെ പ്രൊഫൈൽ'), L('Details held by the school office.', 'സ്കൂൾ ഓഫീസിലുള്ള വിവരങ്ങൾ.')) +
        '<div class="dash-card"><table class="tbl"><tbody>' +
        rows.map(r => '<tr><th style="width:38%">' + r[0] + '</th><td>' + UI.esc(String(r[1])) + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<div class="dash-card"><h3>' + L('Password', 'പാസ്‌വേഡ്') + '</h3><p class="small muted">' +
        L('Reset your password from the secure recovery page.', 'സുരക്ഷിത റിക്കവറി പേജിൽ പാസ്‌വേഡ് പുനഃസജ്ജീകരിക്കാം.') +
        '</p><a class="btn btn-ghost btn-sm" href="reset.html">' + L('Change password', 'പാസ്‌വേഡ് മാറ്റുക') + '</a></div>';
    }
  };

  // ---------------- student results ----------------
  if (role === 'student') {
    PANES.myresults = {
      label: () => L('My results', 'എന്റെ ഫലങ്ങൾ'),
      async render() {
        let rows = [];
        try { rows = await API.resultsForStudent(session.student ? session.student.id : null); } catch (e) {
          return head(L('My results', 'എന്റെ ഫലങ്ങൾ'), '') + none(API.errorText(e));
        }
        if (!rows.length) {
          return head(L('My results', 'എന്റെ ഫലങ്ങൾ'), L('Results appear here once a teacher publishes them.', 'അധ്യാപകൻ പ്രസിദ്ധീകരിച്ചാൽ ഫലങ്ങൾ ഇവിടെ വരും.')) +
            none(L('No results published yet.', 'ഫലങ്ങൾ ഇതുവരെ ലഭ്യമല്ല.'));
        }
        const exam = rows[0].exam || rows[0].exam_name;
        return head(L('My results', 'എന്റെ ഫലങ്ങൾ'), UI.esc(exam || ''), '<a class="btn btn-primary btn-sm" href="results.html">' + L('Open printable sheet', 'പ്രിന്റ് ചെയ്യാവുന്ന ഷീറ്റ്') + '</a>') +
          '<div class="list-card"><table class="tbl"><thead><tr><th>' + I18NS.t('res.subject') + '</th><th>' + I18NS.t('res.marks') + '</th><th>' + I18NS.t('res.grade') + '</th></tr></thead><tbody>' +
          rows.map(r => '<tr><td>' + UI.esc(r.subject) + '</td><td>' + r.marks + ' / ' + (r.max_marks || 100) + '</td><td>' + UI.esc(r.grade || '') + '</td></tr>').join('') +
          '</tbody></table></div>';
      }
    };

    const AI_STATE = { nickname: '', name: me.full_name || '' };
    const aiBubble = (role_, text) =>
      '<div class="ai-bubble ' + (role_ === 'user' ? 'user' : 'bot') + '">' +
      (role_ === 'assistant' ? '<span class="ai-who">' + UI.esc(AI_STATE.nickname || 'AI') + '</span>' : '') +
      '<div class="ai-text">' + UI.esc(text).replace(/\n/g, '<br>') + '</div></div>';

    PANES.ai = {
      label: () => L('AI study buddy', 'എ.ഐ പഠന സഹായി'),
      async render() {
        let nick = '', history = [];
        try {
          const p = await API.aiProfile();
          nick = p.nickname || '';
          AI_STATE.nickname = nick;
          AI_STATE.name = p.name || AI_STATE.name;
          if (nick) history = await API.aiHistory();
        } catch (e) { /* the setup card still works */ }

        const setup = '<div class="ai-setup card" id="ai-setup">' +
          '<h3>' + L('Give your assistant a name', 'നിങ്ങളുടെ സഹായിക്ക് ഒരു പേര് നൽകുക') + '</h3>' +
          '<p class="small muted">' + L('Pick any nickname you like — it is shown only to you and saved to your student account. You can change it whenever you want.',
            'ഇഷ്ടമുള്ള വിളിപ്പേര് തിരഞ്ഞെടുക്കാം — ഇത് നിങ്ങൾക്ക് മാത്രം കാണാം, നിങ്ങളുടെ വിദ്യാർത്ഥി അക്കൗണ്ടിൽ സേവ് ചെയ്യും. എപ്പോൾ വേണമെങ്കിലും മാറ്റാം.') + '</p>' +
          '<div class="ai-chips">' + ['Pandi Buddy', 'Minnal', 'Thara', 'Guru', 'Chandran', 'Kunjappu'].map(s =>
            '<button type="button" class="chip" data-nick="' + s + '">' + s + '</button>').join('') + '</div>' +
          '<div class="ai-nick-row"><input id="ai-nick" maxlength="24" placeholder="' + L('Your own nickname', 'സ്വന്തം വിളിപ്പേര്') + '" value="' + UI.esc(nick) + '">' +
          '<button class="btn btn-primary" id="ai-nick-save">' + L('Save name', 'പേര് സേവ് ചെയ്യുക') + '</button></div>' +
          '<div class="form-msg" id="ai-nick-msg" role="alert"></div></div>';

        const chat = '<div class="ai-chat-wrap" id="ai-chat">' +
          '<div class="ai-chat-head"><span class="ai-avatar">🤖</span><div><strong>' + UI.esc(nick || L('Your assistant', 'നിങ്ങളുടെ സഹായി')) + '</strong>' +
          '<div class="small muted">' + L('Study helper · bot replies, not a teacher', 'പഠന സഹായി · ബോട്ട് മറുപടി, അധ്യാപകനല്ല') + '</div></div>' +
          '<button class="btn btn-ghost btn-sm" id="ai-nick-edit">' + L('Change name', 'പേര് മാറ്റുക') + '</button>' +
          '<a class="btn btn-ghost btn-sm" href="ai.html">' + L('Full page', 'മുഴുവൻ പേജ്') + '</a></div>' +
          '<div class="ai-log" id="ai-log">' +
          (history.length
            ? history.map(m => aiBubble(m.role, m.content)).join('')
            : aiBubble('assistant', window.AI.welcome(AI_STATE))) +
          '</div>' +
          '<div class="ai-chips" id="ai-suggest">' + window.AI.suggestions().map(s =>
            '<button type="button" class="chip" data-say="' + UI.esc(s) + '">' + UI.esc(s) + '</button>').join('') + '</div>' +
          '<form class="ai-form" id="ai-form"><input id="ai-input" maxlength="600" autocomplete="off" placeholder="' +
          L('Ask about a subject, exam or school…', 'വിഷയം, പരീക്ഷ അല്ലെങ്കിൽ സ്കൂളിനെക്കുറിച്ച് ചോദിക്കുക…') + '">' +
          '<button class="btn btn-primary" type="submit">' + L('Send', 'അയക്കുക') + '</button></form>' +
          '<p class="small muted ai-note">' + L('Your chat is private to you and your class teachers. Never share passwords or personal details.',
            'നിങ്ങളുടെ ചാറ്റ് നിങ്ങൾക്കും ക്ലാസ് അധ്യാപകർക്കും മാത്രം. പാസ്‌വേഡോ വ്യക്തിവിവരങ്ങളോ ഒരിക്കലും പങ്കുവയ്ക്കരുത്.') + '</p></div>';

        return head(L('AI study buddy', 'എ.ഐ പഠന സഹായി'),
          L('A helper that answers from the school study notes. You choose its nickname.',
            'സ്കൂൾ പഠന കുറിപ്പുകളിൽ നിന്ന് ഉത്തരം നൽകുന്ന സഹായി. വിളിപ്പേര് നിങ്ങൾ തിരഞ്ഞെടുക്കാം.')) +
          (nick ? chat : setup);
      },

      async after() {
        const setup = document.getElementById('ai-setup');
        const log = document.getElementById('ai-log');
        const form = document.getElementById('ai-form');

        async function saveNick(name) {
          const msg = document.getElementById('ai-nick-msg');
          const input = document.getElementById('ai-nick');
          try {
            const saved = await API.setAiNickname(name);
            AI_STATE.nickname = saved;
            UI.toast(L('Saved. Say hello to ', 'സേവ് ചെയ്തു. ഹായ് ') + saved);
            await renderPane('ai');
          } catch (err) {
            const map = {
              nickname_short: L('A nickname needs at least 2 letters.', 'വിളിപ്പേരിന് കുറഞ്ഞത് 2 അക്ഷരം വേണം.'),
              nickname_long: L('Keep the nickname under 25 letters.', 'വിളിപ്പേര് 25 അക്ഷരത്തിൽ താഴെ ആയിരിക്കണം.'),
              nickname_chars: L('Letters, numbers, spaces and - . \' only.', 'അക്ഷരങ്ങൾ, അക്കങ്ങൾ, സ്പേസ്, - . \' മാത്രം.')
            };
            const text = map[err.message] || API.errorText(err);
            if (msg) UI.showMsg(msg, text, 'error'); else UI.toast(text);
          }
        }

        if (setup) {
          setup.querySelectorAll('[data-nick]').forEach(b => {
            b.addEventListener('click', () => {
              const input = document.getElementById('ai-nick');
              input.value = b.dataset.nick;
              input.focus();
            });
          });
          setup.querySelector('#ai-nick-save').addEventListener('click', () => {
            saveNick(document.getElementById('ai-nick').value);
          });
          const editBtn = setup.querySelector('#ai-nick-edit');
          if (editBtn) editBtn.addEventListener('click', () => renderPane('ai'));
        }

        if (!log || !form) return;

        const input = document.getElementById('ai-input');
        const send = async text => {
          const value = String(text || '').trim();
          if (!value) return;
          log.insertAdjacentHTML('beforeend', aiBubble('user', value));
          try { await API.aiSave('user', value); } catch (e) { /* keep the local copy */ }
          log.insertAdjacentHTML('beforeend', '<div class="ai-bubble bot typing" id="ai-typing"><span class="ai-who">' +
            UI.esc(AI_STATE.nickname || 'AI') + '</span><div class="ai-text">…</div></div>');
          log.scrollTop = log.scrollHeight;
          let answer = '';
          try { answer = await window.AI.reply(value, AI_STATE); } catch (e) { answer = L('I could not reach my notes. Ask me again in a moment.', 'എന്റെ കുറിപ്പുകളിൽ എത്താനായില്ല. അൽപ്പസമയം കഴിഞ്ഞ് വീണ്ടും ചോദിക്കുക.'); }
          const typing = document.getElementById('ai-typing');
          if (typing) typing.remove();
          log.insertAdjacentHTML('beforeend', aiBubble('assistant', answer));
          log.scrollTop = log.scrollHeight;
          try { await API.aiSave('assistant', answer); } catch (e) {}
          input.focus();
        };

        const editBtn = document.querySelector('#ai-chat #ai-nick-edit');
        if (editBtn) editBtn.addEventListener('click', async () => {
          const name = window.prompt(L('New nickname for your assistant', 'സഹായിക്ക് പുതിയ വിളിപ്പേര്'), AI_STATE.nickname || '');
          if (name) await saveNick(name);
        });

        document.getElementById('ai-suggest').addEventListener('click', e => {
          const b = e.target.closest('[data-say]');
          if (b) send(b.dataset.say);
        });

        form.addEventListener('submit', e => {
          e.preventDefault();
          const v = input.value;
          input.value = '';
          send(v);
        });
        log.scrollTop = log.scrollHeight;
      }
    };
  }

  // ---------------- parent children ----------------
  if (role === 'parent') {
    PANES.children = {
      label: () => L('My children', 'എന്റെ കുട്ടികൾ'),
      async render() {
        const kids = session.children || [];
        const list = kids.length ? '<div class="list-card">' + kids.map(k =>
          '<div class="list-row"><div class="grow"><strong>' + UI.esc(k.student.full_name) + '</strong>' +
          '<div class="sub">' + UI.esc(k.student.class) + ' · ' + L('Roll', 'റോൾ') + ' ' + UI.esc(k.student.roll_no) + '</div></div>' +
          statusPill(k.link.status) + '</div>').join('') + '</div>'
          : none(L('No child linked yet.', 'കുട്ടിയെ ബന്ധിപ്പിച്ചിട്ടില്ല.'));

        return head(L('My children', 'എന്റെ കുട്ടികൾ'),
          L('The school verifies each link before results are visible.', 'ഫലം കാണുന്നതിന് മുൻപ് സ്കൂൾ ബന്ധം സ്ഥിരീകരിക്കും.')) +
          list +
          '<div class="dash-card"><h3>' + L('Link a child', 'കുട്ടിയെ ബന്ധിപ്പിക്കുക') + '</h3>' +
          '<p class="small muted">' + L('Enter the class and roll number printed on the student ID card. The office approves the request.', 'വിദ്യാർത്ഥി ഐഡി കാർഡിലെ ക്ലാസും റോൾ നമ്പറും നൽകുക. ഓഫീസ് അംഗീകാരം നൽകും.') + '</p>' +
          '<form class="mini-form" id="child-form" novalidate>' +
            '<div class="form-row"><div class="form-field"><label>' + L('Class', 'ക്ലാസ്') + '</label><select name="class" required>' + classOptions('', true) + '</select></div>' +
            '<div class="form-field"><label>' + L('Roll number', 'റോൾ നമ്പർ') + '</label><input name="roll_no" required autocomplete="off"></div></div>' +
            '<div class="form-field"><label>' + L('Your relationship', 'ബന്ധം') + '</label><select name="relationship"><option>Mother</option><option>Father</option><option>Guardian</option></select></div>' +
            '<div class="form-msg" id="child-msg" role="alert"></div>' +
            '<div><button class="btn btn-primary" type="submit">' + L('Send for verification', 'സ്ഥിരീകരണത്തിന് അയക്കുക') + '</button></div>' +
          '</form></div>';
      },
      after: () => {
        const form = document.getElementById('child-form');
        if (!form) return;
        const msg = document.getElementById('child-msg');
        form.addEventListener('submit', async e => {
          e.preventDefault();
          UI.hideMsg(msg);
          const data = Object.fromEntries(new FormData(form).entries());
          if (!data.class || !data.roll_no.trim()) return UI.showMsg(msg, I18NS.t('err.required'), 'error');
          const btn = form.querySelector('button[type=submit]');
          UI.busy(btn, true);
          try {
            const student = await API.findStudentForLink(data.class, data.roll_no.trim());
            if (!student) { UI.busy(btn, false); return UI.showMsg(msg, L('No student found for that class and roll number.', 'ആ ക്ലാസിലും റോൾ നമ്പറിലും വിദ്യാർത്ഥിയെ കണ്ടെത്തിയില്ല.'), 'error'); }
            await API.linkChild({ student_id: student.id, relationship: data.relationship });
            UI.showMsg(msg, L('Request sent to the school office for verification.', 'സ്ഥിരീകരണത്തിനായി സ്കൂൾ ഓഫീസിലേക്ക് അയച്ചു.'), 'success');
            form.reset();
            setTimeout(() => location.reload(), 1800);
          } catch (err) {
            UI.showMsg(msg, API.errorText(err), 'error');
            UI.busy(btn, false);
          }
        });
      }
    };
  }

  // ================= staff: publish results =================
  if (isStaff) {
    const draft = [];

    PANES.publish = {
      label: () => L('Publish results', 'ഫലം പ്രസിദ്ധീകരിക്കുക'),
      async render() {
        const myClasses = isAdmin ? classes : (session.classes || []);
        if (!myClasses.length) {
          return head(L('Publish results', 'ഫലം പ്രസിദ്ധീകരിക്കുക'), '') +
            none(L('You have not been assigned to a class yet. Ask the school administrator.', 'നിങ്ങൾക്ക് ക്ലാസ് അനുവദിച്ചിട്ടില്ല. അഡ്മിനിസ്ട്രേറ്ററെ ബന്ധപ്പെടുക.'));
        }
        return head(L('Publish results', 'ഫലം പ്രസിദ്ധീകരിക്കുക'),
          L('Only staff assigned to a class can publish that class\'s results.', 'ക്ലാസ് അധ്യാപകർക്ക് മാത്രം ആ ക്ലാസിലെ ഫലം പ്രസിദ്ധീകരിക്കാം.'),
          '<button class="btn btn-primary btn-sm" id="publish-now" type="button">' + L('Publish batch', 'പ്രസിദ്ധീകരിക്കുക') + '</button>') +
          '<div class="dash-card"><h3>' + L('Add a result row', 'ഫല വിവരം ചേർക്കുക') + '</h3>' +
          '<form class="mini-form" id="res-form" novalidate>' +
            '<div class="form-row"><div class="form-field"><label>' + I18NS.t('res.class') + '</label><select name="class" id="pub-class">' +
              myClasses.map(c => '<option>' + UI.esc(c) + '</option>').join('') + '</select></div>' +
            '<div class="form-field"><label>' + I18NS.t('res.exam') + '</label><input name="exam" placeholder="Half Yearly 2026" required></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + I18NS.t('res.roll') + '</label><input name="roll_no" required></div>' +
            '<div class="form-field"><label>' + I18NS.t('res.subject') + '</label><input name="subject" required></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + I18NS.t('res.marks') + '</label><input name="marks" type="number" min="0" required></div>' +
            '<div class="form-field"><label>' + L('Maximum marks', 'പരമാവധി മാർക്ക്') + '</label><input name="max_marks" type="number" min="1" value="100" required></div></div>' +
            '<div class="form-msg" id="res-msg" role="alert"></div>' +
            '<div><button class="btn btn-ghost" type="submit">' + L('Add row', 'ചേർക്കുക') + '</button></div>' +
          '</form></div>' +
          '<div class="dash-card"><h3>' + L('Batch to publish', 'പ്രസിദ്ധീകരിക്കാനുള്ളവ') + ' <span class="badge" id="draft-count">0</span></h3>' +
          '<div id="draft-box" class="list-card"><div class="empty" id="draft-empty">' + L('Add rows above, then publish.', 'മുകളിൽ വരികൾ ചേർത്ത് പ്രസിദ്ധീകരിക്കുക.') + '</div></div></div>' +
          '<div class="dash-card"><h3>' + L('Recently published', 'പ്രസിദ്ധീകരിച്ചവ') + '</h3><div id="recent-results">' + none(I18NS.t('misc.loading')) + '</div></div>';
      },
      after: async () => {
        const form = document.getElementById('res-form');
        const msg = document.getElementById('res-msg');
        const box = document.getElementById('draft-box');
        const countEl = document.getElementById('draft-count');

        function paint() {
          countEl.textContent = String(draft.length);
          box.innerHTML = draft.length ? '<table class="tbl"><thead><tr><th>' + I18NS.t('res.class') + '</th><th>' + I18NS.t('res.roll') + '</th><th>' + I18NS.t('res.exam') + '</th><th>' + I18NS.t('res.subject') + '</th><th>' + I18NS.t('res.marks') + '</th><th></th></tr></thead><tbody>' +
            draft.map((r, i) => '<tr><td>' + UI.esc(r.class) + '</td><td>' + UI.esc(r.roll_no) + '</td><td>' + UI.esc(r.exam) + '</td><td>' + UI.esc(r.subject) + '</td><td>' + r.marks + '/' + r.max_marks + '</td><td><button class="btn btn-ghost btn-sm" data-del="' + i + '">✕</button></td></tr>').join('') +
            '</tbody></table>' : '<div class="empty" id="draft-empty">' + L('Add rows above, then publish.', 'മുകളിൽ വരികൾ ചേർത്ത് പ്രസിദ്ധീകരിക്കുക.') + '</div>';
        }

        box.addEventListener('click', e => {
          const b = e.target.closest('[data-del]');
          if (!b) return;
          draft.splice(Number(b.dataset.del), 1);
          paint();
        });

        form.addEventListener('submit', e => {
          e.preventDefault();
          UI.hideMsg(msg);
          const d = Object.fromEntries(new FormData(form).entries());
          if (!d.exam.trim() || !d.roll_no.trim() || !d.subject.trim()) return UI.showMsg(msg, I18NS.t('err.required'), 'error');
          const marks = Number(d.marks), max = Number(d.max_marks || 100);
          if (!(marks >= 0) || marks > max) return UI.showMsg(msg, L('Marks must be between 0 and the maximum.', 'മാർക്ക് 0 നും പരമാവധിയ്ക്കും ഇടയിൽ വേണം.'), 'error');
          draft.push({ class: d.class, exam: d.exam.trim(), roll_no: d.roll_no.trim(), subject: d.subject.trim(), marks, max_marks: max });
          form.reset();
          document.getElementById('pub-class').value = d.class;
          paint();
          UI.showMsg(msg, L('Row added to the batch.', 'വരി ചേർത്തു.'), 'success');
        });

        document.getElementById('publish-now').addEventListener('click', async function () {
          UI.hideMsg(msg);
          if (!draft.length) return UI.showMsg(msg, L('Add at least one row first.', 'ആദ്യം ഒരു വരിയെങ്കിലും ചേർക്കുക.'), 'error');
          UI.busy(this, true);
          try {
            await API.publishResults(draft.splice(0, draft.length));
            paint();
            UI.showMsg(msg, I18NS.t('res.saved'), 'success');
            await loadRecent();
          } catch (err) {
            UI.showMsg(msg, API.errorText(err), 'error');
          } finally {
            UI.busy(this, false);
          }
        });

        async function loadRecent() {
          const holder = document.getElementById('recent-results');
          if (!holder) return;
          try {
            const sets = [];
            for (const c of (isAdmin ? classes : (session.classes || []))) {
              try {
                const rows = await API.resultsForLookup(c, '\u0000__none__');
                if (rows && rows.length) sets.push(rows);
              } catch (e) { /* class not permitted or empty */ }
            }
            holder.innerHTML = sets.length
              ? sets.slice(0, 2).map(rows => '<div class="list-row"><div class="grow"><strong>' + UI.esc(rows[0].exam) + ' · ' + UI.esc(rows[0].class) +
                '</strong><div class="sub">' + rows.length + ' ' + L('subject rows', 'വിഷയ വരികൾ') + '</div></div></div>').join('')
              : '<div class="empty">' + L('Nothing published from this dashboard yet.', 'ഇതുവരെ ഒന്നും പ്രസിദ്ധീകരിച്ചിട്ടില്ല.') + '</div>';
          } catch (e) { holder.innerHTML = '<div class="empty">' + API.errorText(e) + '</div>'; }
        }
        paint();
        loadRecent();
      }
    };

    // ================= staff: notices =================
    PANES.notices = {
      label: () => L('School notices', 'അറിയിപ്പുകൾ'),
      async render() {
        let rows = [];
        try { rows = await API.notices({ all: true }); } catch (e) { return head(L('School notices', 'അറിയിപ്പുകൾ'), '') + none(API.errorText(e)); }
        CSV.notices = rows;
        return head(L('Publish notices', 'അറിയിപ്പുകൾ പ്രസിദ്ധീകരിക്കുക'), L('Notices appear on the home page and notices page.', 'അറിയിപ്പുകൾ ഹോം പേജിലും അറിയിപ്പ് പേജിലും വരും.'),
          (rows.length ? csvBtn('notices') : '') + '<button class="btn btn-primary btn-sm" id="new-notice">' + L('New notice', 'പുതിയ അറിയിപ്പ്') + '</button>') +
          '<div class="dash-card" id="notice-editor" hidden><h3 id="notice-editor-title">' + L('New notice', 'പുതിയ അറിയിപ്പ്') + '</h3>' +
          '<form class="mini-form" id="notice-form" novalidate>' +
            '<input type="hidden" name="id">' +
            '<div class="form-row"><div class="form-field"><label>Title (English)</label><input name="title_en" required maxlength="140"></div>' +
            '<div class="form-field"><label>തലക്കെട്ട് (മലയാളം)</label><input name="title_ml" maxlength="180"></div></div>' +
            '<div class="form-row"><div class="form-field"><label>Body (English)</label><textarea name="body_en" rows="3" required></textarea></div>' +
            '<div class="form-field"><label>ഉള്ളടക്കം (മലയാളം)</label><textarea name="body_ml" rows="3"></textarea></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + L('Category', 'വിഭാഗം') + '</label><select name="category"><option value="general">General</option><option value="exam">Exam</option><option value="admission">Admission</option><option value="event">Event</option><option value="holiday">Holiday</option></select></div>' +
            '<div class="form-field"><label>' + L('Options', 'ക്രമീകരണം') + '</label><label class="small"><input type="checkbox" name="is_published" checked> ' + L('Published', 'പ്രസിദ്ധീകരിച്ചു') + '</label><label class="small"><input type="checkbox" name="is_pinned"> ' + L('Pin to top', 'മുകളിൽ പിൻ ചെയ്യുക') + '</label></div></div>' +
            '<div class="form-msg" id="notice-msg" role="alert"></div>' +
            '<div class="row-actions"><button class="btn btn-primary" type="submit">' + I18NS.t('act.save') + '</button>' +
            '<button class="btn btn-ghost" type="button" id="notice-cancel">' + I18NS.t('act.cancel') + '</button></div>' +
          '</form></div>' +
          '<div class="list-card" id="notice-list">' +
            (rows.length ? rows.map(n => '<div class="list-row"><div class="grow"><strong>' + UI.esc(n.title_en) + '</strong><div class="sub">' +
              UI.esc(n.category) + ' · ' + UI.formatDate(n.created_at) + ' · ' + (n.is_published ? L('published', 'പ്രസിദ്ധീകരിച്ചു') : L('draft', 'ഡ്രാഫ്റ്റ്')) +
              '</div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="' + n.id + '">' + I18NS.t('act.edit') + '</button>' +
              '<button class="btn btn-ghost btn-sm" data-del="' + n.id + '">' + I18NS.t('act.delete') + '</button></div></div>').join('')
              : none(L('No notices yet.', 'അറിയിപ്പുകൾ ഇല്ല.'))) + '</div>';
      },
      after: () => {
        const editor = document.getElementById('notice-editor');
        const form = document.getElementById('notice-form');
        const msg = document.getElementById('notice-msg');
        const show = (data) => {
          document.getElementById('notice-editor-title').textContent = data && data.id ? L('Edit notice', 'അറിയിപ്പ് തിരുത്തുക') : L('New notice', 'പുതിയ അറിയിപ്പ്');
          form.elements.id.value = data && data.id ? data.id : '';
          form.elements.title_en.value = data ? data.title_en || '' : '';
          form.elements.title_ml.value = data ? data.title_ml || '' : '';
          form.elements.body_en.value = data ? data.body_en || '' : '';
          form.elements.body_ml.value = data ? data.body_ml || '' : '';
          form.elements.category.value = data ? data.category || 'general' : 'general';
          form.elements.is_published.checked = data ? !!data.is_published : true;
          form.elements.is_pinned.checked = data ? !!data.is_pinned : false;
          editor.hidden = false;
          editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
          UI.hideMsg(msg);
        };

        document.getElementById('new-notice').addEventListener('click', () => show(null));
        document.getElementById('notice-cancel').addEventListener('click', () => { editor.hidden = true; });

        form.addEventListener('submit', async e => {
          e.preventDefault();
          UI.hideMsg(msg);
          const f = new FormData(form);
          if (!String(f.get('title_en')).trim() || !String(f.get('body_en')).trim()) return UI.showMsg(msg, I18NS.t('err.required'), 'error');
          const data = {
            title_en: f.get('title_en').trim(), title_ml: f.get('title_ml').trim(),
            body_en: f.get('body_en').trim(), body_ml: f.get('body_ml').trim(),
            category: f.get('category'), is_published: f.get('is_published') === 'on',
            is_pinned: f.get('is_pinned') === 'on', author_name: me.full_name
          };
          const btn = form.querySelector('button[type=submit]');
          UI.busy(btn, true);
          try {
            await API.saveNotice(data, f.get('id') || null);
            UI.showMsg(msg, I18NS.t('act.save') + ' ✓', 'success');
            setTimeout(() => renderPane(current), 700);
          } catch (err) {
            UI.showMsg(msg, API.errorText(err), 'error');
            UI.busy(btn, false);
          }
        });

        document.getElementById('notice-list').addEventListener('click', async e => {
          const edit = e.target.closest('[data-edit]');
          const del = e.target.closest('[data-del]');
          const cache = window.__notices || [];
          if (edit) {
            const n = cache.find(x => x.id === edit.dataset.edit);
            if (n) show(n);
          }
          if (del) {
            if (!(await UI.confirmDialog(L('Delete this notice?', 'ഈ അറിയിപ്പ് ഇല്ലാതാക്കണോ?')))) return;
            try {
              await API.deleteNotice(del.dataset.del);
              renderPane(current);
            } catch (err) { UI.toast(API.errorText(err), 'error'); }
          }
        });

        // cache the rows for the editor
        API.notices({ all: true }).then(rows => { window.__notices = rows; }).catch(() => {});
      }
    };
  }

  // ================= staff: chat moderation =================
  if (isStaff) {
    PANES.moderation = {
      label: () => L('Chat moderation', 'ചാറ്റ് മോഡറേഷൻ'),
      async render() {
        let reports = [];
        try { reports = await API.reports(); } catch (e) { /* shown below */ }
        const open = reports.filter(r => r.status === 'open');
        const list = reports.length ? '<div class="list-card">' + reports.map(r => {
          const m = r.message || {};
          return '<div class="list-row"><div class="grow"><strong>' + UI.esc(m.sender_name || L('Message', 'സന്ദേശം')) +
            ' · ' + UI.esc(m.room || '') + '</strong><div class="sub">' + UI.esc(m.body || '') + '</div>' +
            '<div class="sub">' + L('Reported: ', 'റിപ്പോർട്ട്: ') + UI.esc(r.reason || '—') + '</div></div>' +
            statusPill(r.status) +
            (r.status === 'open' ? '<div class="row-actions"><button class="btn btn-primary btn-sm" data-hide="' + r.id + '">' + L('Hide & resolve', 'മറച്ച് തീർക്കുക') + '</button>' +
              '<button class="btn btn-ghost btn-sm" data-dismiss="' + r.id + '">' + L('Dismiss', 'ഒഴിവാക്കുക') + '</button></div>' : '') +
            '</div>';
        }).join('') + '</div>' : none(L('No reported messages.', 'റിപ്പോർട്ട് ചെയ്ത സന്ദേശങ്ങൾ ഇല്ല.'));

        return head(L('Chat moderation', 'ചാറ്റ് മോഡറേഷൻ'),
          L('Review reports and remove messages that break school rules.', 'നിയമലംഘനം റിപ്പോർട്ട് ചെയ്ത് സന്ദേശങ്ങൾ നീക്കം ചെയ്യുക.'),
          open.length ? '<span class="pill warn">' + open.length + ' ' + L('open', 'തുറന്നത്') + '</span>' : '') + list +
          '<div class="dash-card"><h3>' + L('Recent messages in your classes', 'നിങ്ങളുടെ ക്ലാസുകളിലെ സന്ദേശങ്ങൾ') + '</h3><div id="recent-msgs">' + none(I18NS.t('misc.loading')) + '</div></div>';
      },
      after: async () => {
        const holder = document.getElementById('recent-msgs');
        const roomsList = isAdmin ? classes : (session.classes || []);
        const all = [];
        for (const room of roomsList) {
          try {
            const rows = await API.messages(room);
            rows.slice(-4).forEach(m => all.push(m));
          } catch (e) { /* room not accessible */ }
        }
        all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        holder.innerHTML = all.length ? '<div class="list-card">' + all.slice(0, 12).map(m =>
          '<div class="list-row"><div class="grow"><strong>' + UI.esc(m.sender_name) + ' <span class="sub">· ' + UI.esc(m.room) + '</span></strong>' +
          '<div class="sub">' + UI.esc(m.body) + '</div></div>' +
          (m.hidden ? pill(I18NS.t('chat.hidden'), 'bad') : '<button class="btn btn-ghost btn-sm" data-msg-hide="' + m.id + '">' + I18NS.t('act.hide') + '</button>') +
          '</div>').join('') + '</div>' : '<div class="empty">' + L('No messages yet.', 'സന്ദേശങ്ങൾ ഇല്ല.') + '</div>';

        holder.addEventListener('click', async e => {
          const b = e.target.closest('[data-msg-hide]');
          if (!b) return;
          try { await API.hideMessage(b.dataset.msgHide, true); renderPane('moderation'); }
          catch (err) { UI.toast(API.errorText(err), 'error'); }
        });

        if (main.__modBound) return;
        main.__modBound = true;
        main.addEventListener('click', async e => {
          const hide = e.target.closest('[data-hide]');
          const dismiss = e.target.closest('[data-dismiss]');
          if (hide) {
            try { await API.resolveReport(hide.dataset.hide, 'resolved', true); renderPane('moderation'); }
            catch (err) { UI.toast(API.errorText(err), 'error'); }
          }
          if (dismiss) {
            try { await API.resolveReport(dismiss.dataset.dismiss, 'dismissed', false); renderPane('moderation'); }
            catch (err) { UI.toast(API.errorText(err), 'error'); }
          }
        });
      }
    };

    // ================= staff: students =================
    PANES.students = {
      label: () => L('Students', 'വിദ്യാർത്ഥികൾ'),
      async render() {
        let rows = [];
        try { rows = await API.students(); } catch (e) { return head(L('Students', 'വിദ്യാർത്ഥികൾ'), '') + none(API.errorText(e)); }
        if (!isAdmin) rows = rows.filter(s => (session.classes || []).indexOf(s.class) !== -1);
        CSV.students = rows;
        return head(L('Students', 'വിദ്യാർത്ഥികൾ'), isAdmin ? L('All student accounts.', 'എല്ലാ വിദ്യാർത്ഥി അക്കൗണ്ടുകളും.') : L('Students in your classes.', 'നിങ്ങളുടെ ക്ലാസുകളിലെ വിദ്യാർത്ഥികൾ.'), rows.length ? csvBtn('students') : '') +
          (rows.length ? '<div class="list-card" style="overflow:auto"><table class="tbl"><thead><tr><th>' + L('Name', 'പേര്') + '</th><th>' + L('Class', 'ക്ലാസ്') + '</th><th>' + L('Roll', 'റോൾ') + '</th><th>' + L('Status', 'നില') + '</th>' + (isAdmin ? '<th></th>' : '') + '</tr></thead><tbody>' +
            rows.map(s => '<tr><td>' + UI.esc(s.full_name) + '<div class="sub">' + UI.esc(s.email || '') + '</div></td><td>' + UI.esc(s.class) + '</td><td>' + UI.esc(s.roll_no) + '</td><td>' + statusPill(s.account_status || s.status) + '</td>' +
              (isAdmin ? '<td><button class="btn btn-ghost btn-sm" data-acc="' + s.profile_id + '" data-status="' + ((s.account_status || 'active') === 'active' ? 'disabled' : 'active') + '">' +
                ((s.account_status || 'active') === 'active' ? L('Disable', 'നിർത്തുക') : L('Enable', 'പ്രവർത്തനക്ഷമമാക്കുക')) + '</button></td>' : '') + '</tr>').join('') +
            '</tbody></table></div>' : none(L('No students found.', 'വിദ്യാർത്ഥികളെ കണ്ടെത്തിയില്ല.')));
      }
    };

    // ================= staff: website content =================
    PANES.content = {
      label: () => L('Website content', 'വെബ്സൈറ്റ് ഉള്ളടക്കം'),
      async render() {
        return head(L('Website content', 'വെബ്സൈറ്റ് ഉള്ളടക്കം'), L('Add photos to the gallery and new achievements.', 'ഗാലറിയിലേക്ക് ചിത്രങ്ങളും നേട്ടങ്ങളും ചേർക്കുക.')) +
          '<div class="dash-card"><h3>' + L('Add a gallery photo', 'ഗാലറി ചിത്രം ചേർക്കുക') + '</h3>' +
          '<form class="mini-form" id="gal-form" novalidate>' +
            '<div class="form-row"><div class="form-field"><label>Caption (English)</label><input name="title_en" required></div>' +
            '<div class="form-field"><label>ചിത്ര വിവരണം</label><input name="title_ml"></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + L('Image URL', 'ചിത്രത്തിന്റെ ലിങ്ക്') + '</label><input name="src" placeholder="assets/gallery/campus-01.svg" required></div>' +
            '<div class="form-field"><label>' + L('Category', 'വിഭാഗം') + '</label><select name="category"><option>campus</option><option>events</option><option>sports</option><option>arts</option></select></div></div>' +
            '<div class="form-msg" id="gal-msg" role="alert"></div>' +
            '<div><button class="btn btn-primary" type="submit">' + L('Add photo', 'ചേർക്കുക') + '</button></div>' +
          '</form></div>' +
          '<div class="dash-card"><h3>' + L('Add an achievement', 'നേട്ടം ചേർക്കുക') + '</h3>' +
          '<form class="mini-form" id="ach-form" novalidate>' +
            '<div class="form-row"><div class="form-field"><label>Title (English)</label><input name="title_en" required></div>' +
            '<div class="form-field"><label>തലക്കെട്ട്</label><input name="title_ml"></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + L('Student / team', 'വിദ്യാർത്ഥി') + '</label><input name="student_name"></div>' +
            '<div class="form-field"><label>' + L('Class', 'ക്ലാസ്') + '</label><input name="class_name"></div></div>' +
            '<div class="form-row"><div class="form-field"><label>' + L('Level', 'തലം') + '</label><select name="level"><option>School</option><option>District</option><option>State</option><option>National</option></select></div>' +
            '<div class="form-field"><label>' + L('Category', 'വിഭാഗം') + '</label><select name="category"><option>academic</option><option>science</option><option>sports</option><option>arts</option><option>service</option></select></div></div>' +
            '<div class="form-field"><label>Description (English)</label><textarea name="description_en" rows="2"></textarea></div>' +
            '<div class="form-field"><label>വിവരണം (മലയാളം)</label><textarea name="description_ml" rows="2"></textarea></div>' +
            '<div class="form-msg" id="ach-msg" role="alert"></div>' +
            '<div><button class="btn btn-primary" type="submit">' + L('Add achievement', 'ചേർക്കുക') + '</button></div>' +
          '</form></div>';
      },
      after: () => {
        const galForm = document.getElementById('gal-form');
        const achForm = document.getElementById('ach-form');
        const galMsg = document.getElementById('gal-msg');
        const achMsg = document.getElementById('ach-msg');

        galForm.addEventListener('submit', async e => {
          e.preventDefault();
          UI.hideMsg(galMsg);
          const d = Object.fromEntries(new FormData(galForm).entries());
          if (!d.title_en.trim() || !d.src.trim()) return UI.showMsg(galMsg, I18NS.t('err.required'), 'error');
          try {
            await API.addGalleryItem(d);
            UI.showMsg(galMsg, L('Photo added to the gallery.', 'ചിത്രം ഗാലറിയിൽ ചേർത്തു.'), 'success');
            galForm.reset();
          } catch (err) { UI.showMsg(galMsg, API.errorText(err), 'error'); }
        });

        achForm.addEventListener('submit', async e => {
          e.preventDefault();
          UI.hideMsg(achMsg);
          const d = Object.fromEntries(new FormData(achForm).entries());
          if (!d.title_en.trim()) return UI.showMsg(achMsg, I18NS.t('err.required'), 'error');
          try {
            await API.addAchievement(Object.assign({ icon: '🏆', event_date: new Date().toISOString() }, d));
            UI.showMsg(achMsg, L('Achievement added.', 'നേട്ടം ചേർത്തു.'), 'success');
            achForm.reset();
          } catch (err) { UI.showMsg(achMsg, API.errorText(err), 'error'); }
        });
      }
    };
  }

  // ================= admin: teacher approvals =================
  if (isAdmin) {
    PANES.registrations = {
      label: () => L('Teacher approvals', 'അധ്യാപക അംഗീകാരം'),
      async render() {
        let pending = [], all = [];
        try { pending = await API.pendingTeachers(); all = await API.allTeachers(); } catch (e) {
          return head(L('Teacher approvals', 'അധ്യാപക അംഗീകാരം'), '') + none(API.errorText(e));
        }
        CSV.teachers = all;
        return head(L('Teacher approvals', 'അധ്യാപക അംഗീകാരം'),
          L('Verify the staff ID and subject with the office before approving.', 'അംഗീകരിക്കുന്നതിന് മുൻപ് സ്റ്റാഫ് ഐഡിയും വിഷയവും പരിശോധിക്കുക.'), all.length ? csvBtn('teachers') : '') +
          '<div class="dash-card"><h3>' + L('Awaiting approval', 'അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു') + ' <span class="pill warn">' + pending.length + '</span></h3>' +
          (pending.length ? '<div class="list-card">' + pending.map(t =>
            '<div class="list-row"><div class="grow"><strong>' + UI.esc(t.full_name) + '</strong>' +
            '<div class="sub">' + UI.esc(t.email || '') + ' · ' + UI.esc(t.subject || '') + ' · ' + L('Staff ID', 'സ്റ്റാഫ് ഐഡി') + ' ' + UI.esc(t.employee_no || '—') + '</div></div>' +
            '<div class="row-actions"><button class="btn btn-primary btn-sm" data-teacher="' + t.id + '" data-approve="1">' + I18NS.t('act.approve') + '</button>' +
            '<button class="btn btn-ghost btn-sm" data-teacher="' + t.id + '" data-approve="0">' + I18NS.t('act.reject') + '</button></div></div>').join('') + '</div>'
            : none(L('No teacher registrations are waiting.', 'അധ്യാപക രജിസ്ട്രേഷനുകൾ ഒന്നും കാത്തിരിക്കുന്നില്ല.'))) + '</div>' +
          '<div class="dash-card"><h3>' + L('All teacher accounts', 'എല്ലാ അധ്യാപക അക്കൗണ്ടുകളും') + '</h3>' +
          '<div style="overflow:auto"><table class="tbl"><thead><tr><th>' + L('Name', 'പേര്') + '</th><th>' + L('Subject', 'വിഷയം') + '</th><th>' + L('Classes', 'ക്ലാസുകൾ') + '</th><th>' + L('Status', 'നില') + '</th></tr></thead><tbody>' +
          all.map(t => '<tr><td>' + UI.esc(t.full_name) + '<div class="sub">' + UI.esc(t.email || '') + '</div></td><td>' + UI.esc(t.subject || '') + '</td><td>' + UI.esc((t.classes || []).join(', ') || '—') + '</td><td>' + statusPill(t.status) + '</td></tr>').join('') +
          '</tbody></table></div></div>';
      },
      after: () => {
        if (main.__teacherBound) return;
        main.__teacherBound = true;
        main.addEventListener('click', async e => {
          const b = e.target.closest('[data-teacher]');
          if (!b) return;
          const approve = b.dataset.approve === '1';
          if (!approve && !(await UI.confirmDialog(L('Reject this teacher account?', 'ഈ അധ്യാപക അക്കൗണ്ട് നിരസിക്കണോ?')))) return;
          UI.busy(b, true);
          try {
            await API.decideTeacher(b.dataset.teacher, approve);
            UI.toast(approve ? L('Teacher approved.', 'അധ്യാപകൻ അംഗീകരിച്ചു.') : L('Teacher rejected.', 'അധ്യാപകൻ നിരസിച്ചു.'), 'success');
            renderPane('registrations');
          } catch (err) {
            UI.busy(b, false);
            UI.toast(API.errorText(err), 'error');
          }
        });
      }
    };

    // ================= admin: parent verification =================
    PANES.parents = {
      label: () => L('Parent requests', 'രക്ഷിതാവ് അഭ്യർത്ഥനകൾ'),
      async render() {
        let rows = [];
        try { rows = await API.parentRequests(); } catch (e) { return head(L('Parent verification', 'രക്ഷിതാവ് സ്ഥിരീകരണം'), '') + none(API.errorText(e)); }
        CSV.parents = rows;
        const pending = rows.filter(r => r.status === 'pending');
        const rest = rows.filter(r => r.status !== 'pending');
        const row = (r, actionable) =>
          '<div class="list-row"><div class="grow"><strong>' + UI.esc(r.parent_name) + ' → ' + UI.esc(r.student_name) + '</strong>' +
          '<div class="sub">' + UI.esc(r.student_class) + ' · ' + L('Roll', 'റോൾ') + ' ' + UI.esc(r.student_roll) + ' · ' + UI.esc(r.relationship || '') + '</div>' +
          '<div class="sub">' + UI.esc(r.parent_email || '') + ' · ' + UI.esc(r.parent_phone || '') + '</div></div>' +
          (actionable ? '<div class="row-actions"><button class="btn btn-primary btn-sm" data-link="' + r.id + '" data-approve="1">' + L('Verify', 'സ്ഥിരീകരിക്കുക') + '</button>' +
            '<button class="btn btn-ghost btn-sm" data-link="' + r.id + '" data-approve="0">' + I18NS.t('act.reject') + '</button></div>' : statusPill(r.status)) + '</div>';

        return head(L('Parent verification', 'രക്ഷിതാവ് സ്ഥിരീകരണം'),
          L('Check the relationship before a parent can see a student\'s results.', 'ഫലം കാണുന്നതിന് മുൻപ് ബന്ധം പരിശോധിക്കുക.'),
          (rows.length ? csvBtn('parents') : '') + '<span class="pill warn">' + pending.length + ' ' + L('waiting', 'കാത്തിരിക്കുന്നു') + '</span>') +
          '<div class="dash-card"><h3>' + L('Waiting for verification', 'സ്ഥിരീകരണത്തിനായി കാത്തിരിക്കുന്നു') + '</h3>' +
          (pending.length ? '<div class="list-card">' + pending.map(r => row(r, true)).join('') + '</div>'
            : none(L('No parent requests are waiting.', 'അഭ്യർത്ഥനകൾ ഇല്ല.'))) + '</div>' +
          (rest.length ? '<div class="dash-card"><h3>' + L('Verified and rejected', 'സ്ഥിരീകരിച്ചതും നിരസിച്ചതും') + '</h3><div class="list-card">' + rest.map(r => row(r, false)).join('') + '</div></div>' : '');
      },
      after: () => {
        if (main.__linkBound) return;
        main.__linkBound = true;
        main.addEventListener('click', async e => {
          const b = e.target.closest('[data-link]');
          if (!b) return;
          try {
            await API.decideParentLink(b.dataset.link, b.dataset.approve === '1');
            UI.toast(L('Parent request updated.', 'അഭ്യർത്ഥന പുതുക്കി.'), 'success');
            renderPane(current);
          } catch (err) { UI.toast(API.errorText(err), 'error'); }
        });
      }
    };

    // ================= admin: accounts =================
    PANES.accounts = {
      label: () => L('Accounts', 'അക്കൗണ്ടുകൾ'),
      async render() {
        let students = [];
        try { students = await API.students(); } catch (e) { return head(L('Accounts', 'അക്കൗണ്ടുകൾ'), '') + none(API.errorText(e)); }
        CSV.accounts = students;
        return head(L('Student accounts', 'വിദ്യാർത്ഥി അക്കൗണ്ടുകൾ'),
          L('Disable an account to block sign-in without deleting the record.', 'രേഖ നീക്കാതെ പ്രവേശനം തടയാൻ അക്കൗണ്ട് പ്രവർത്തനരഹിതമാക്കുക.'), students.length ? csvBtn('accounts') : '') +
          '<div class="list-card" style="overflow:auto"><table class="tbl"><thead><tr><th>' + L('Name', 'പേര്') + '</th><th>' + L('Class', 'ക്ലാസ്') + '</th><th>' + L('Roll', 'റോൾ') + '</th><th>' + L('Status', 'നില') + '</th><th></th></tr></thead><tbody>' +
          students.map(s => '<tr><td>' + UI.esc(s.full_name) + '<div class="sub">' + UI.esc(s.email || '') + '</div></td><td>' + UI.esc(s.class) + '</td><td>' + UI.esc(s.roll_no) + '</td>' +
            '<td>' + statusPill(s.account_status || s.status) + '</td>' +
            '<td><button class="btn btn-ghost btn-sm" data-acc="' + s.profile_id + '" data-status="' + ((s.account_status || 'active') === 'active' ? 'disabled' : 'active') + '">' +
            ((s.account_status || 'active') === 'active' ? L('Disable', 'നിർത്തുക') : L('Enable', 'സജീവമാക്കുക')) + '</button></td></tr>').join('') +
          '</tbody></table></div>';
      },
      after: () => {
        if (main.__accBound) return;
        main.__accBound = true;
        main.addEventListener('click', async e => {
          const b = e.target.closest('[data-acc]');
          if (!b) return;
          try {
            await API.setAccountStatus(b.dataset.acc, b.dataset.status);
            renderPane(current);
          } catch (err) { UI.toast(API.errorText(err), 'error'); }
        });
      }
    };

    // ================= admin: classes =================
    PANES.classes = {
      label: () => L('Classes', 'ക്ലാസുകൾ'),
      async render() {
        let list = [], teachers = [];
        try { list = await API.classes(); teachers = await API.allTeachers(); } catch (e) { return head(L('Classes', 'ക്ലാസുകൾ'), '') + none(API.errorText(e)); }
        const approved = teachers.filter(t => t.status === 'approved');
        const nameOf = id => { const t = teachers.find(x => x.id === id); return t ? t.full_name : '—'; };
        return head(L('Classes and teachers', 'ക്ലാസുകളും അധ്യാപകരും'),
          L('Assign approved teachers so they can publish results and moderate that class.', 'ഫലം പ്രസിദ്ധീകരിക്കാനും ചാറ്റ് നിയന്ത്രിക്കാനും അധ്യാപകരെ ക്ലാസുകളിൽ ചേർക്കുക.')) +
          '<div class="dash-card"><h3>' + L('Add a class', 'ക്ലാസ് ചേർക്കുക') + '</h3>' +
          '<form class="mini-form" id="class-form" novalidate><div class="form-row">' +
          '<div class="form-field"><label>' + L('Class name', 'ക്ലാസ് പേര്') + '</label><input name="name" placeholder="11 A" required></div>' +
          '<div class="form-field" style="align-self:end"><button class="btn btn-primary" type="submit">' + L('Add class', 'ചേർക്കുക') + '</button></div></div>' +
          '<div class="form-msg" id="class-msg" role="alert"></div></form></div>' +
          '<div class="list-card">' + list.map(c =>
            '<div class="list-row"><div class="grow"><strong>' + UI.esc(c.name) + '</strong>' +
            '<div class="sub">' + ((c.teacher_ids || []).length ? L('Teachers: ', 'അധ്യാപകർ: ') + (c.teacher_ids || []).map(nameOf).join(', ') : L('No teacher assigned', 'അധ്യാപകനെ നിയോഗിച്ചിട്ടില്ല')) + '</div></div>' +
            '<select class="assign" data-class="' + UI.esc(c.id) + '" style="max-width:210px"><option value="">' + L('Assign teacher…', 'അധ്യാപകനെ തിരഞ്ഞെടുക്കുക…') + '</option>' +
              approved.map(t => '<option value="' + t.id + '">' + UI.esc(t.full_name) + (t.subject ? ' · ' + UI.esc(t.subject) : '') + '</option>').join('') + '</select>' +
            '</div>').join('') + '</div>';
      },
      after: () => {
        const form = document.getElementById('class-form');
        const msg = document.getElementById('class-msg');
        form.addEventListener('submit', async e => {
          e.preventDefault();
          UI.hideMsg(msg);
          const name = new FormData(form).get('name').trim();
          if (!name) return UI.showMsg(msg, I18NS.t('err.required'), 'error');
          try {
            await API.addClass(name);
            renderPane('classes');
          } catch (err) { UI.showMsg(msg, API.errorText(err), 'error'); }
        });
        if (main.__classBound) return;
        main.__classBound = true;
        main.addEventListener('change', async e => {
          const sel = e.target.closest('select.assign');
          if (!sel || !sel.value) return;
          try {
            await API.assignTeacher(sel.dataset.class, sel.value, true);
            UI.toast(L('Teacher assigned.', 'അധ്യാപകനെ നിയോഗിച്ചു.'), 'success');
            renderPane('classes');
          } catch (err) { UI.toast(API.errorText(err), 'error'); }
        });
      }
    };

    // ================= admin: admission enquiries =================
    PANES.enquiries = {
      label: () => L('Admissions inbox', 'അന്വേഷണങ്ങൾ'),
      async render() {
        let rows = [];
        try { rows = await API.enquiries(); } catch (e) { return head(L('Admissions inbox', 'അന്വേഷണങ്ങൾ'), '') + none(API.errorText(e)); }
        CSV.enquiries = rows;
        return head(L('Admissions inbox', 'പ്രവേശന അന്വേഷണങ്ങൾ'), L('Enquiries submitted from the admissions page.', 'പ്രവേശന പേജിൽ നിന്നുള്ള അന്വേഷണങ്ങൾ.'), rows.length ? csvBtn('enquiries') : '') +
          (rows.length ? '<div class="list-card">' + rows.map(r =>
            '<div class="list-row"><div class="grow"><strong>' + UI.esc(r.student_name) + ' · ' + UI.esc(r.class || '') + '</strong>' +
            '<div class="sub">' + UI.esc(r.parent_name) + ' · ' + UI.esc(r.phone) + (r.email ? ' · ' + UI.esc(r.email) : '') + '</div>' +
            (r.message ? '<div class="sub">' + UI.esc(r.message) + '</div>' : '') + '</div>' +
            '<span class="sub">' + UI.formatDate(r.created_at) + '</span></div>').join('') + '</div>'
            : none(L('No enquiries yet.', 'അന്വേഷണങ്ങൾ ഇല്ല.')));
      }
    };

    // ================= admin: moderation history =================
    PANES.history = {
      label: () => L('Moderation history', 'മോഡറേഷൻ ചരിത്രം'),
      async render() {
        let rows = [];
        try { rows = await API.moderationLog(); } catch (e) { return head(L('Moderation history', 'മോഡറേഷൻ ചരിത്രം'), '') + none(API.errorText(e)); }
        CSV.history = rows;
        return head(L('Moderation history', 'മോഡറേഷൻ ചരിത്രം'), L('Every approval, result publication and chat action is recorded.', 'ഓരോ അംഗീകാരവും ഫല പ്രസിദ്ധീകരണവും ചാറ്റ് നടപടിയും രേഖപ്പെടുത്തുന്നു.'), rows.length ? csvBtn('history') : '') +
          (rows.length ? '<div class="list-card" style="overflow:auto"><table class="tbl"><thead><tr><th>' + L('When', 'സമയം') + '</th><th>' + L('By', 'ആൾ') + '</th><th>' + L('Action', 'നടപടി') + '</th><th>' + L('Target', 'ലക്ഷ്യം') + '</th></tr></thead><tbody>' +
            rows.map(r => '<tr><td class="sub">' + UI.formatDate(r.created_at) + '</td><td>' + UI.esc(r.actor_name || r.actor || 'system') + '</td><td><span class="pill">' + UI.esc(r.action) + '</span></td><td class="sub">' + UI.esc(r.details || r.target || '') + '</td></tr>').join('') +
            '</tbody></table></div>' : none(L('No moderation activity yet.', 'നടപടികൾ ഇല്ല.')));
      }
    };
  }

  // ================= navigation & router =================
  const MENU = ['overview'];
  if (role === 'student') MENU.push('myresults', 'ai');
  if (role === 'parent') MENU.push('children');
  if (isStaff) MENU.push('publish', 'notices', 'moderation', 'students', 'content');
  if (isAdmin) MENU.push('registrations', 'parents', 'accounts', 'classes', 'enquiries', 'history');
  MENU.push('profile');
  const visible = MENU.filter(k => PANES[k]);
  let current = 'overview';

  nav.innerHTML = visible.map(k =>
    '<button type="button" data-pane="' + k + '">' + PANES[k].label() + '</button>').join('') +
    ((role === 'student')
      ? '<a class="btn btn-ghost btn-sm" href="ai.html" style="justify-content:space-between;display:flex;margin-top:.3rem">' +
        L('AI study buddy', 'എ.ഐ പഠന സഹായി') + ' <span>🤖</span></a>'
      : '') +
    ((role === 'student' || isStaff)
      ? '<a class="btn btn-ghost btn-sm" href="chat.html" style="justify-content:space-between;display:flex;margin-top:.3rem">' +
        L('Class chat', 'ക്ലാസ് ചാറ്റ്') + ' <span>💬</span></a>'
      : '');

  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-pane]');
    if (b) renderPane(b.dataset.pane);
  });

  async function renderPane(name) {
    if (!PANES[name]) name = 'overview';
    current = name;
    nav.querySelectorAll('[data-pane]').forEach(b => b.classList.toggle('active', b.dataset.pane === name));
    main.innerHTML = '<div class="skeleton" style="height:110px;margin-bottom:1rem"></div><div class="skeleton" style="height:220px"></div>';
    try {
      main.innerHTML = '<div class="pane active">' + (await PANES[name].render()) + '</div>';
      if (PANES[name].after) await PANES[name].after();
    } catch (err) {
      main.innerHTML = '<div class="pane active">' + none(API.errorText(err)) + '</div>';
    }
    if (history.replaceState) history.replaceState(null, '', '#' + name);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (h && h !== current && visible.indexOf(h) !== -1) renderPane(h);
  });

  window.addEventListener('langchange', async () => {
    nav.querySelectorAll('[data-pane]').forEach(b => { b.textContent = PANES[b.dataset.pane].label(); });
    await renderPane(current);
  });

  const start = location.hash.replace('#', '');
  await renderPane(visible.indexOf(start) !== -1 ? start : 'overview');
})();
