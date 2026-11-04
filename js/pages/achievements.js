(async function () {
  await Site.mount();
  const C = window.Components;
  const grid = document.getElementById('ach-grid');
  const filters = document.getElementById('ach-filters');
  let all = [];

  function render(cat) {
    const rows = cat === 'all' ? all : all.filter(a => a.category === cat);
    grid.innerHTML = rows.map(C.achievementCard).join('') ||
      C.emptyState('🏆', I18NS.t('misc.none'));
  }

  async function load() {
    try {
      all = await API.achievements();
      const active = filters.querySelector('.filter-chip.active');
      render(active ? active.dataset.cat : 'all');
    } catch (e) {
      grid.innerHTML = C.emptyState('⚠️', API.errorText(e));
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
