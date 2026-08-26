function simCardHTML(sim) {
  return `
    <article class="post-card">
      <a href="/${sim.slug}/"><img src="${sim.image}" alt="${sim.title}"></a>
      <span class="post-category"><a href="/alle-simuleringer/?kategori=${sim.categorySlug}">${sim.category}</a></span>
      <h4 class="post-title"><a href="/${sim.slug}/">${sim.title}</a></h4>
      <p class="post-description">${sim.description}</p>
    </article>`;
}

function simFilterHTML(sims, activeSlug) {
  const categories = [...new Map(sims.map(s => [s.categorySlug, s.category])).entries()];
  const allBtn = `<button type="button" data-kategori="" class="filter-btn${activeSlug ? '' : ' is-active'}">Alle simuleringer</button>`;
  const catBtns = categories
    .map(([slug, name]) => `<button type="button" data-kategori="${slug}" class="filter-btn${slug === activeSlug ? ' is-active' : ''}">${name}</button>`)
    .join('');
  return allBtn + catBtns;
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('[data-simulations-grid]');
  if (!grid) return;

  const response = await fetch('/data/simulations.json');
  const sims = await response.json();
  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;
  const filters = document.querySelector('[data-simulations-filters]');

  function applyFilter(activeSlug) {
    const filtered = activeSlug ? sims.filter(s => s.categorySlug === activeSlug) : sims;
    const shown = limit ? filtered.slice(0, limit) : filtered;
    grid.innerHTML = shown.map(simCardHTML).join('') || '<p>Ingen simuleringer i denne kategorien ennå.</p>';
    if (filters) filters.innerHTML = simFilterHTML(sims, activeSlug);
  }

  const initialSlug = new URLSearchParams(location.search).get('kategori') || '';
  applyFilter(initialSlug);

  if (filters) {
    filters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-kategori]');
      if (!btn) return;
      const slug = btn.dataset.kategori;
      const url = new URL(location.href);
      if (slug) url.searchParams.set('kategori', slug);
      else url.searchParams.delete('kategori');
      history.pushState({}, '', url);
      applyFilter(slug);
    });
  }
});
