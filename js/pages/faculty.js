(async function () {
  await Site.mount();
  const grid = document.getElementById('faculty-grid');
  const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  async function load() {
    try {
      const list = await API.teachersPublic();
      grid.innerHTML = list.map(t => (
        '<div class="card person-card"><div class="avatar green">' + UI.esc(initials(t.full_name)) + '</div>' +
        '<h3>' + UI.esc(t.full_name) + '</h3>' +
        '<div class="person-role">' + UI.esc(t.designation || 'Teacher') + '</div>' +
        '<p class="person-meta">' + UI.esc(t.subject || '') +
        (t.classes && t.classes.length ? ' · ' + UI.esc(t.classes.join(', ')) : '') + '</p></div>'
      )).join('') || window.Components.emptyState('👩‍🏫', I18NS.t('misc.none'));
    } catch (e) {
      grid.innerHTML = window.Components.emptyState('⚠️', API.errorText(e));
    }
  }

  await load();
  window.addEventListener('langchange', load);
})();
