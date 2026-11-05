/* =========================================================
   AI study buddy — standalone page (students only).
   The role check happens in the database; this page only
   redirects when the signed-in account is not a student.
   ========================================================= */
(function () {
  const root = document.getElementById('ai-page');
  if (!root) return;

  const L = (en, ml) => I18NS.pick(en, ml);
  const state = { nickname: '', name: '' };

  const NICK_SUGGESTIONS = ['Pandi Buddy', 'Minnal', 'Thara', 'Guru', 'Chandran', 'Kunjappu'];

  const bubble = (role, text) =>
    '<div class="ai-bubble ' + (role === 'user' ? 'user' : 'bot') + '">' +
    (role === 'assistant' ? '<span class="ai-who">' + UI.esc(state.nickname || 'AI') + '</span>' : '') +
    '<div class="ai-text">' + UI.esc(text).replace(/\n/g, '<br>') + '</div></div>';

  const head = (title, sub) =>
    '<div class="ai-chat-head"><span class="ai-avatar">🤖</span><div><strong>' + UI.esc(title) + '</strong>' +
    '<div class="small muted">' + sub + '</div></div>' +
    '<button class="btn btn-ghost btn-sm" id="ai-nick-edit">' + L('Change name', 'പേര് മാറ്റുക') + '</button></div>';

  function setupHtml() {
    return '<div class="ai-setup card" id="ai-setup">' +
      '<h3>' + L('Give your assistant a name', 'നിങ്ങളുടെ സഹായിക്ക് ഒരു പേര് നൽകുക') + '</h3>' +
      '<p class="small muted">' + L('Pick any nickname you like — it is shown only to you and saved to your student account. You can change it whenever you want.',
        'ഇഷ്ടമുള്ള വിളിപ്പേര് തിരഞ്ഞെടുക്കാം — ഇത് നിങ്ങൾക്ക് മാത്രം കാണാം, നിങ്ങളുടെ വിദ്യാർത്ഥി അക്കൗണ്ടിൽ സേവ് ചെയ്യും. എപ്പോൾ വേണമെങ്കിലും മാറ്റാം.') + '</p>' +
      '<div class="ai-chips">' + NICK_SUGGESTIONS.map(s =>
        '<button type="button" class="chip" data-nick="' + UI.esc(s) + '">' + UI.esc(s) + '</button>').join('') + '</div>' +
      '<div class="ai-nick-row"><input id="ai-nick" maxlength="24" placeholder="' + L('Your own nickname', 'സ്വന്തം വിളിപ്പേര്') + '">' +
      '<button class="btn btn-primary" id="ai-nick-save">' + L('Save name', 'പേര് സേവ് ചെയ്യുക') + '</button></div>' +
      '<div class="form-msg" id="ai-nick-msg" role="alert"></div></div>';
  }

  function chatHtml(history) {
    return '<div class="ai-chat-wrap" id="ai-chat">' +
      head(state.nickname || L('Your assistant', 'നിങ്ങളുടെ സഹായി'),
        L('Study helper · bot replies, not a teacher', 'പഠന സഹായി · ബോട്ട് മറുപടി, അധ്യാപകനല്ല')) +
      '<div class="ai-log" id="ai-log" aria-live="polite">' +
      (history.length ? history.map(m => bubble(m.role, m.content)).join('')
        : bubble('assistant', window.AI.welcome(state))) +
      '</div>' +
      '<div class="ai-chips" id="ai-suggest">' + window.AI.suggestions().map(s =>
        '<button type="button" class="chip" data-say="' + UI.esc(s) + '">' + UI.esc(s) + '</button>').join('') + '</div>' +
      '<form class="ai-form" id="ai-form"><input id="ai-input" maxlength="600" autocomplete="off" placeholder="' +
      L('Ask about a subject, exam or school…', 'വിഷയം, പരീക്ഷ അല്ലെങ്കിൽ സ്കൂളിനെക്കുറിച്ച് ചോദിക്കുക…') + '">' +
      '<button class="btn btn-primary" type="submit">' + L('Send', 'അയക്കുക') + '</button></form>' +
      '<p class="small muted ai-note">' + L('Your chat is private to you and your class teachers. Never share passwords or personal details.',
        'നിങ്ങളുടെ ചാറ്റ് നിങ്ങൾക്കും ക്ലാസ് അധ്യാപകർക്കും മാത്രം. പാസ്‌വേഡോ വ്യക്തിവിവരങ്ങളോ ഒരിക്കലും പങ്കുവയ്ക്കരുത്.') + '</p></div>';
  }

  async function saveNick(name) {
    const msg = document.getElementById('ai-nick-msg');
    try {
      const saved = await API.setAiNickname(name);
      state.nickname = saved;
      UI.toast(L('Saved. Say hello to ', 'സേവ് ചെയ്തു. ഹായ് ') + saved);
      await render();
    } catch (err) {
      const map = {
        nickname_short: L('A nickname needs at least 2 letters.', 'വിളിപ്പേരിന് കുറഞ്ഞത് 2 അക്ഷരം വേണം.'),
        nickname_long: L('Keep the nickname under 25 letters.', 'വിളിപ്പേര് 25 അക്ഷരത്തിൽ താഴെ ആയിരിക്കണം.'),
        nickname_chars: L("Letters, numbers, spaces and - . ' only.", "അക്ഷരങ്ങൾ, അക്കങ്ങൾ, സ്പേസ്, - . ' മാത്രം.")
      };
      const text = map[err.message] || API.errorText(err);
      if (msg) UI.showMsg(msg, text, 'error'); else UI.toast(text);
    }
  }

  function bindSetup() {
    document.querySelectorAll('[data-nick]').forEach(b => {
      b.addEventListener('click', () => {
        const input = document.getElementById('ai-nick');
        input.value = b.dataset.nick;
        input.focus();
      });
    });
    const save = document.getElementById('ai-nick-save');
    if (save) save.addEventListener('click', () => saveNick(document.getElementById('ai-nick').value));
  }

  function bindChat() {
    const log = document.getElementById('ai-log');
    const form = document.getElementById('ai-form');
    const input = document.getElementById('ai-input');
    if (!log || !form || !input) return;

    const send = async value => {
      const text = String(value || '').trim();
      if (!text) return;
      log.insertAdjacentHTML('beforeend', bubble('user', text));
      try { await API.aiSave('user', text); } catch (e) { /* keep the local copy */ }
      log.insertAdjacentHTML('beforeend', '<div class="ai-bubble bot typing" id="ai-typing"><span class="ai-who">' +
        UI.esc(state.nickname || 'AI') + '</span><div class="ai-text">…</div></div>');
      log.scrollTop = log.scrollHeight;
      let answer = '';
      try { answer = await window.AI.reply(text, state); }
      catch (e) { answer = L('I could not reach my notes. Ask me again in a moment.', 'എന്റെ കുറിപ്പുകളിൽ എത്താനായില്ല. അൽപ്പസമയം കഴിഞ്ഞ് വീണ്ടും ചോദിക്കുക.'); }
      const typing = document.getElementById('ai-typing');
      if (typing) typing.remove();
      log.insertAdjacentHTML('beforeend', bubble('assistant', answer));
      log.scrollTop = log.scrollHeight;
      try { await API.aiSave('assistant', answer); } catch (e) {}
      input.focus();
    };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      send(v);
    });

    const suggest = document.getElementById('ai-suggest');
    if (suggest) {
      suggest.addEventListener('click', e => {
        const b = e.target.closest('[data-say]');
        if (b) send(b.dataset.say);
      });
    }

    const edit = document.getElementById('ai-nick-edit');
    if (edit) {
      edit.addEventListener('click', async () => {
        const name = window.prompt(L('New nickname for your assistant', 'സഹായിക്ക് പുതിയ വിളിപ്പേര്'), state.nickname || '');
        if (name) await saveNick(name);
      });
    }

    log.scrollTop = log.scrollHeight;
  }

  async function render() {
    let history = [];
    if (state.nickname) {
      try { history = await API.aiHistory(); } catch (e) { /* start with a greeting */ }
    }
    root.innerHTML = state.nickname ? chatHtml(history) : setupHtml();
    if (state.nickname) bindChat(); else bindSetup();
  }

  (async function start() {
    await Site.mount();
    const session = await Site.requireRole(['student']);
    if (!session) return;

    try {
      const p = await API.aiProfile();
      state.nickname = p.nickname || '';
      state.name = p.name || (session.profile && session.profile.full_name) || '';
    } catch (e) {
      root.innerHTML = '<div class="card"><p class="mb-0">' +
        UI.esc(L('The study helper is not set up for your account yet. Ask the school office to enable it.',
          'സഹായി ഇപ്പോൾ ലഭ്യമല്ല. സ്കൂൾ ഓഫീസിനെ ബന്ധപ്പെടുക.')) + '</p></div>';
      return;
    }
    await render();
  })();
})();
