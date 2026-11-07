(async function () {
  await Site.mount();
  const C = window.Components || { emptyState: (icon, text) => '<p class="muted">' + (text || '') + '</p>' };

  async function loadNotices() {
    const box = document.getElementById('home-notices');
    try {
      const list = await API.notices({});
      box.innerHTML = list.slice(0, 4).map(n => C.noticeCard(n)).join('') ||
        C.emptyState('📢', I18NS.t('misc.none'));
    } catch (e) {
      box.innerHTML = C.emptyState('⚠️', I18NS.t('err.generic'));
    }
  }

  async function loadGallery() {
    const box = document.getElementById('home-gallery');
    try {
      const list = await API.gallery();
      box.innerHTML = list.slice(0, 4).map(C.galleryCard).join('');
      C.initLightbox(box);
    } catch (e) {
      box.innerHTML = C.emptyState('🖼️', I18NS.t('err.generic'));
    }
  }

  async function loadAchievements() {
    const box = document.getElementById('home-achievements');
    try {
      const list = await API.achievements();
      box.innerHTML = list.slice(0, 3).map(C.achievementCard).join('');
    } catch (e) {
      box.innerHTML = C.emptyState('🏆', I18NS.t('err.generic'));
    }
  }

  loadNotices(); loadGallery(); loadAchievements();
  window.addEventListener('langchange', () => { loadNotices(); loadGallery(); loadAchievements(); });
})();
