(async function () {
  await Site.mount();
  const C = window.Components;
  const list = document.getElementById('notice-list');
  const filters = document.getElementById('notice-filters');
  let all = [];

  function render(cat) {
    const rows = cat === 'all' ? all : all.filter(n => n.category === cat);
    list.innerHTML = rows.map(n => C.noticeCard(n)).join('') ||
      C.emptyState('📢', I18NS.t('misc.none'));
  }

  async function load() {
    try {
      all = await API.notices({});
      const active = filters.querySelector('.filter-chip.active');
      render(active ? active.dataset.cat : 'all');
    } catch (e) {
      list.innerHTML = C.emptyState('⚠️', API.errorText(e));
    }
  }

  filters.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    render(chip.dataset.cat);
  });

  await load();
  window.addEventListener('langchange', load);
})();
