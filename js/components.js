/* =========================================================
   Shared renderers for notices, gallery and achievements.
   ========================================================= */
(function () {
  const { esc, formatDate, dayMonth, emptyState } = window.UI;
  const lang = () => (window.I18NS ? window.I18NS.getLang() : 'en');
  const pick = (row, base) => {
    const en = row[base + '_en'] || '';
    const ml = row[base + '_ml'] || en;
    return lang() === 'ml' ? ml : en;
  };

  function noticeCard(n, compact) {
    const dm = dayMonth(n.created_at);
    const cat = n.category || 'general';
    const catLabel = {
      exam: ['Exam', 'പരീക്ഷ'], admission: ['Admission', 'പ്രവേശനം'],
      event: ['Event', 'പരിപാടി'], general: ['General', 'പൊതുവായത്'],
      holiday: ['Holiday', 'അവധി']
    }[cat] || [cat, cat];
    return '<article class="notice-item' + (n.is_pinned ? ' is-pinned' : '') + '">' +
      '<div class="notice-date"><span class="d">' + dm.d + '</span><span class="m">' + esc(dm.m) + '</span></div>' +
      '<div class="notice-body"><h4>' + esc(pick(n, 'title')) + '</h4>' +
      (!compact ? '<p>' + esc(pick(n, 'body')) + '</p>' : '') +
      '</div>' +
      '<span class="tag ' + (cat === 'admission' ? 'green' : cat === 'exam' ? 'maroon' : '') + '">' + esc(lang() === 'ml' ? catLabel[1] : catLabel[0]) + '</span>' +
      '</article>';
  }

  function galleryCard(g) {
    return '<figure class="gallery-card" data-src="' + esc(g.src) + '" data-title="' + esc(pick(g, 'title')) + '" tabindex="0" role="button" aria-label="' + esc(pick(g, 'title')) + '">' +
      '<img src="' + esc(g.src) + '" alt="' + esc(pick(g, 'title')) + '" loading="lazy">' +
      '<figcaption>' + esc(pick(g, 'title')) + '</figcaption></figure>';
  }

  function achievementCard(a) {
    return '<article class="card achievement-card">' +
      '<div class="medal">' + esc(a.icon || '🏆') + '</div>' +
      '<div><span class="who">' + esc(a.student_name) + (a.class_name ? ' · ' + esc(a.class_name) : '') + '</span>' +
      '<h3>' + esc(pick(a, 'title')) + '</h3>' +
      '<p>' + esc(pick(a, 'description')) + '</p>' +
      '<span class="tag ' + (a.level === 'State' ? 'maroon' : 'green') + ' mt-1">' + esc(a.level || '') + '</span></div>' +
      '</article>';
  }

  function initLightbox(container) {
    let box = document.querySelector('.lightbox');
    if (!box) {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = '<button class="lightbox-close" aria-label="Close">✕</button>' +
        '<img alt=""><div class="lightbox-caption"></div>';
      document.body.appendChild(box);
      const close = () => box.classList.remove('open');
      box.querySelector('.lightbox-close').addEventListener('click', close);
      box.addEventListener('click', e => { if (e.target === box) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    if (!container || container.dataset.lbBound) return;
    container.dataset.lbBound = '1';
    container.addEventListener('click', e => {
      const card = e.target.closest('.gallery-card');
      if (!card) return;
      box.querySelector('img').src = card.dataset.src;
      box.querySelector('img').alt = card.dataset.title;
      box.querySelector('.lightbox-caption').textContent = card.dataset.title;
      box.classList.add('open');
    });
    container.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.gallery-card');
        if (card) { e.preventDefault(); card.click(); }
      }
    });
  }

  window.Components = { noticeCard, galleryCard, achievementCard, initLightbox, pick, emptyState };
})();
