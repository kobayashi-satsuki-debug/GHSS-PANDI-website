(async function () {
  await Site.mount();
  const grid = document.querySelector('.grid');
  if (grid && window.Components) window.Components.initLightbox(grid);
})();
