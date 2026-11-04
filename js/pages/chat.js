(async function () {
  await Site.mount();
  const session = await Site.requireRole(['student', 'teacher', 'admin'], 'login.html');
  if (!session) return;

  const me = session.profile;
  const isStaff = me.role === 'teacher' || me.role === 'admin';
  const roomsBox = document.getElementById('chat-rooms');
  const feed = document.getElementById('chat-feed');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const msgBox = document.getElementById('chat-msg');
  const title = document.getElementById('chat-room-title');
  const sub = document.getElementById('chat-room-sub');
  const count = document.getElementById('chat-count');

  let rooms = [];
  let room = null;
  let unsub = null;
  let lastCount = 0;

  function renderRooms() {
    roomsBox.innerHTML = rooms.map(r =>
      '<button type="button" class="chat-room-btn' + (room === r.id ? ' active' : '') + '" data-room="' + UI.esc(r.id) + '">' +
      '<strong>' + UI.esc(r.name) + '</strong><span>' +
      (isStaff ? (I18NS.pick('Teacher member', 'അധ്യാപക അംഗം')) : (I18NS.pick('Member', 'അംഗം'))) +
      '</span></button>').join('');
  }

  function messageHtml(m) {
    const mine = m.sender_id === me.id;
    const teacher = m.sender_role === 'teacher' || m.sender_role === 'admin';
    if (m.hidden) {
      return '<div class="chat-row system"><span class="chat-hidden">' +
        I18NS.t('chat.hidden') + '</span></div>';
    }
    const actions = isStaff
      ? '<button class="chat-act" data-hide="' + m.id + '">' + I18NS.t('act.hide') + '</button>'
      : (mine ? '' : '<button class="chat-act" data-report="' + m.id + '">' + I18NS.t('act.report') + '</button>');
    return '<div class="chat-row' + (mine ? ' mine' : '') + '">' +
      '<div class="chat-bubble">' +
        '<div class="chat-meta"><strong>' + UI.esc(m.sender_name) + '</strong>' +
        (teacher ? '<span class="tag maroon tiny">' + (I18NS.pick('Teacher', 'അധ്യാപകൻ')) + '</span>' : '') +
        '<time>' + UI.formatTime(m.created_at) + '</time></div>' +
        '<p>' + UI.esc(m.body) + '</p>' +
        '<div class="chat-actions">' + actions + '</div>' +
      '</div></div>';
  }

  async function loadMessages(scroll) {
    if (!room) return;
    try {
      const rows = await API.messages(room);
      feed.innerHTML = rows.map(messageHtml).join('') ||
        window.Components.emptyState('💬', I18NS.t('chat.empty'));
      if (scroll) feed.scrollTop = feed.scrollHeight;
      lastCount = rows.length;
    } catch (e) {
      feed.innerHTML = window.Components.emptyState('⚠️', API.errorText(e));
    }
  }

  async function selectRoom(id) {
    room = id;
    renderRooms();
    const r = rooms.find(x => x.id === id);
    title.textContent = r ? r.name : id;
    sub.textContent = I18NS.pick('Visible only to this class and its teachers', 'ഈ ക്ലാസിലെ വിദ്യാർത്ഥികൾക്കും അധ്യാപകർക്കും മാത്രം');
    await loadMessages(true);
    if (unsub) unsub();
    unsub = API.subscribe(id, function () {
      if (document.hidden) return;
      loadMessages(true);
    });
  }

  roomsBox.addEventListener('click', e => {
    const b = e.target.closest('.chat-room-btn');
    if (b) selectRoom(b.dataset.room);
  });

  feed.addEventListener('click', async e => {
    const hide = e.target.closest('[data-hide]');
    const report = e.target.closest('[data-report]');
    if (hide) {
      try {
        UI.busy(hide, true);
        await API.hideMessage(hide.dataset.hide, true);
        loadMessages(false);
      } catch (err) { UI.toast(API.errorText(err), 'error'); }
    }
    if (report) {
      const reason = window.prompt(I18NS.pick('Why are you reporting this message?', 'എന്തുകൊണ്ട് റിപ്പോർട്ട് ചെയ്യുന്നു?'));
      if (!reason) return;
      try {
        await API.reportMessage(report.dataset.report, reason);
        UI.toast(I18NS.t('chat.reported'), 'success');
      } catch (err) { UI.toast(API.errorText(err), 'error'); }
    }
  });

  input.addEventListener('input', () => { count.textContent = input.value.length + '/500'; });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    UI.hideMsg(msgBox);
    const body = input.value.trim();
    if (!body || !room) return;
    if (body.length > 500) return UI.showMsg(msgBox, 'Maximum 500 characters.', 'error');
    const btn = form.querySelector('button[type=submit]');
    UI.busy(btn, true);
    try {
      await API.sendMessage(room, body);
      input.value = '';
      count.textContent = '0/500';
      await loadMessages(true);
    } catch (err) {
      UI.showMsg(msgBox, API.errorText(err), 'error');
    } finally {
      UI.busy(btn, false);
    }
  });

  try {
    rooms = await API.rooms();
  } catch (e) {
    feed.innerHTML = window.Components.emptyState('🔒', API.errorText(e));
    form.hidden = true;
    return;
  }
  if (!rooms.length) {
    roomsBox.innerHTML = '<p class="small muted" style="padding:1rem">' + I18NS.t('chat.noRooms') + '</p>';
    feed.innerHTML = window.Components.emptyState('🚫', I18NS.t('chat.noRooms'));
    form.hidden = true;
    return;
  }
  await selectRoom(rooms[0].id);
  window.addEventListener('langchange', () => { renderRooms(); loadMessages(false); });
})();
