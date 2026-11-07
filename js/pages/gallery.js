(async function () {
  await Site.mount();
  const C = window.Components || { emptyState: (icon, text) => '<p class="muted">' + (text || '') + '</p>' };
  const grid = document.getElementById('gallery-grid');
  const filters = document.getElementById('gallery-filters');
  let all = [];

  function render(cat) {
    const rows = cat === 'all' ? all : all.filter(g => g.category === cat);
    grid.innerHTML = rows.map(C.galleryCard).join('') ||
      C.emptyState('🖼️', I18NS.t('misc.none'));
  }

  async function load() {
    try {
      all = await API.gallery();
      const active = filters.querySelector('.filter-chip.active');
      render(active ? active.dataset.cat : 'all');
      C.initLightbox(grid);
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
