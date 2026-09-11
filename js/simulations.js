function currentLang() {
  try {
    var stored = localStorage.getItem('lang');
    if (stored) return stored;
  } catch (e) {}
  return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'no';
}

function i18nText(dict, key, fallback) {
  var entry = dict && dict[key];
  var lang = currentLang();
  return (entry && entry[lang]) || fallback;
}

function simCardHTML(sim) {
  const subjectBadges = sim.subjects.map(s =>
    `<a class="badge badge-subject" href="/alle-simuleringer/?fag=${s.slug}">${s.name}</a>`
  ).join('');
  const topicBadge = sim.topic
    ? `<a class="badge badge-topic" href="/alle-simuleringer/?tema=${sim.topic.slug}">${sim.topic.name}</a>`
    : '';
  return `
    <article class="post-card">
      <a href="/${sim.slug}/"><img src="${sim.image}" alt="${sim.title}"></a>
      <div class="post-card-body">
        <div class="post-badges">${subjectBadges}${topicBadge}</div>
        <h4 class="post-title"><a href="/${sim.slug}/">${sim.title}</a></h4>
        <p class="post-description">${sim.description}</p>
      </div>
    </article>`;
}

function filterGroupHTML(items, activeSlug, param, allLabel) {
  const allBtn = `<button type="button" data-${param}="" class="filter-btn${activeSlug ? '' : ' is-active'}">${allLabel}</button>`;
  const btns = items
    .map(([slug, name]) => `<button type="button" data-${param}="${slug}" class="filter-btn${slug === activeSlug ? ' is-active' : ''}">${name}</button>`)
    .join('');
  return allBtn + btns;
}

function subjectLinksHTML(subjectOptions) {
  return subjectOptions
    .map(([slug, name]) => `<a class="filter-btn" href="/alle-simuleringer/?fag=${slug}">${name}</a>`)
    .join('');
}

// Trinn has a fixed pedagogical order (grunnskole before videregående, vg1
// before vg2 before vg3) rather than alphabetical — Norwegian alphabetical
// order happens to agree today (Barneskole < Ungdomsskole < Vg1 < Vg2 < Vg3)
// but that's a coincidence not worth relying on.
const TRINN_ORDER = ['barneskole', 'ungdomsskole', 'vg1', 'vg2', 'vg3'];

document.addEventListener('DOMContentLoaded', async () => {
  const dictEl = document.getElementById('i18n-dict');
  let dict = null;
  try { dict = dictEl ? JSON.parse(dictEl.textContent) : null; } catch (e) {}

  const grid = document.querySelector('[data-simulations-grid]');
  const subjectBox = document.querySelector('[data-subject-box]');
  const statNumber = document.querySelector('.stat-number');
  if (!grid && !subjectBox && !statNumber) return;

  const response = await fetch('/data/simulations.json');
  const sims = await response.json();
  // Newest first, so "Siste simuleringer" (and the default /alle-simuleringer/ order)
  // actually reflect recency instead of json array position.
  sims.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));

  if (statNumber) statNumber.textContent = sims.length;

  // Trinn is the outer category (every fag belongs to one or more trinn),
  // so it's the only option list that's never itself filtered by anything else.
  const trinnOptions = [...new Map(
    sims.flatMap(s => s.subjects.flatMap(sub => sub.trinn.map(t => [t.slug, t.name])))
  ).entries()].sort((a, b) => TRINN_ORDER.indexOf(a[0]) - TRINN_ORDER.indexOf(b[0]));

  function subjectOptionsForTrinn(trinnSlug) {
    return [...new Map(
      sims.flatMap(s => s.subjects)
        .filter(sub => !trinnSlug || sub.trinn.some(t => t.slug === trinnSlug))
        .map(sub => [sub.slug, sub.name])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'no'));
  }

  if (subjectBox) subjectBox.innerHTML = subjectLinksHTML(subjectOptionsForTrinn(''));

  if (!grid) return;

  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;
  const PAGE_SIZE = 12;
  const trinnFilters = document.querySelector('[data-simulations-filters-trinn]');
  const subjectFilters = document.querySelector('[data-simulations-filters-fag]');
  const topicFilters = document.querySelector('[data-simulations-filters-tema]');
  const loadMoreBox = document.querySelector('[data-load-more]');

  const params = new URLSearchParams(location.search);
  let activeTrinn = params.get('trinn') || '';
  let activeFag = params.get('fag') || '';
  let activeTema = params.get('tema') || '';
  let visibleCount = PAGE_SIZE;

  // Tema (topic) options are scoped by whatever of fag/trinn is currently
  // set — a specific fag narrows to just that fag's topics regardless of
  // trinn; with fag on "alle fag" it falls back to every topic within the
  // active trinn, or every topic site-wide if trinn is "alle trinn" too.
  function topicOptionsFor(fagSlug, trinnSlug) {
    return [...new Map(
      sims.filter(s => {
        const fagOk = !fagSlug || s.subjects.some(sub => sub.slug === fagSlug);
        const trinnOk = !trinnSlug || s.subjects.some(sub => sub.trinn.some(t => t.slug === trinnSlug));
        return fagOk && trinnOk && s.topic;
      }).map(s => [s.topic.slug, s.topic.name])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'no'));
  }

  // If the URL arrived with a fag that doesn't belong to the given trinn, or a
  // tema that doesn't belong to the resulting fag/trinn scope, drop them.
  if (activeTrinn && activeFag && !subjectOptionsForTrinn(activeTrinn).some(([slug]) => slug === activeFag)) {
    activeFag = '';
  }
  if (activeTema && !topicOptionsFor(activeFag, activeTrinn).some(([slug]) => slug === activeTema)) {
    activeTema = '';
  }

  function render() {
    const filtered = sims.filter(s => {
      const trinnOk = !activeTrinn || s.subjects.some(sub => sub.trinn.some(t => t.slug === activeTrinn));
      const fagOk = !activeFag || s.subjects.some(sub => sub.slug === activeFag);
      const temaOk = !activeTema || (s.topic && s.topic.slug === activeTema);
      return trinnOk && fagOk && temaOk;
    });
    const shown = limit ? filtered.slice(0, limit) : filtered.slice(0, visibleCount);
    const emptyMsg = i18nText(dict, 'empty-state', 'Ingen simuleringer i denne kategorien ennå.');
    grid.innerHTML = shown.map(simCardHTML).join('') || `<p>${emptyMsg}</p>`;

    if (loadMoreBox) {
      loadMoreBox.innerHTML = filtered.length > shown.length
        ? `<button type="button" class="btn" data-load-more-btn>${i18nText(dict, 'load-more-btn', 'Vis flere')}</button>`
        : '';
    }

    if (trinnFilters) {
      const allTrinnLabel = i18nText(dict, 'filter-all-trinn', 'Alle trinn');
      trinnFilters.innerHTML = filterGroupHTML(trinnOptions, activeTrinn, 'trinn', allTrinnLabel);
    }
    if (subjectFilters) {
      const allFagLabel = i18nText(dict, 'filter-all-fag', 'Alle fag');
      subjectFilters.innerHTML = filterGroupHTML(subjectOptionsForTrinn(activeTrinn), activeFag, 'fag', allFagLabel);
    }
    if (topicFilters) {
      const allTemaLabel = i18nText(dict, 'filter-all-tema', 'Alle tema');
      topicFilters.innerHTML = filterGroupHTML(topicOptionsFor(activeFag, activeTrinn), activeTema, 'tema', allTemaLabel);
    }
  }

  function updateUrl() {
    const url = new URL(location.href);
    if (activeTrinn) url.searchParams.set('trinn', activeTrinn); else url.searchParams.delete('trinn');
    if (activeFag) url.searchParams.set('fag', activeFag); else url.searchParams.delete('fag');
    if (activeTema) url.searchParams.set('tema', activeTema); else url.searchParams.delete('tema');
    history.pushState({}, '', url);
  }

  render();

  if (trinnFilters) {
    trinnFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-trinn]');
      if (!btn) return;
      activeTrinn = btn.dataset.trinn;
      // Same cascade rule as fag → tema below: resetting a parent to "alle"
      // (or picking one that no longer owns the current child) clears the
      // child too, so the grid never stays silently scoped to a stale pick.
      if (!activeTrinn || !subjectOptionsForTrinn(activeTrinn).some(([slug]) => slug === activeFag)) {
        activeFag = '';
      }
      if (!activeFag || !topicOptionsFor(activeFag, activeTrinn).some(([slug]) => slug === activeTema)) {
        activeTema = '';
      }
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }
  if (subjectFilters) {
    subjectFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-fag]');
      if (!btn) return;
      activeFag = btn.dataset.fag;
      if (!activeFag || !topicOptionsFor(activeFag, activeTrinn).some(([slug]) => slug === activeTema)) {
        activeTema = '';
      }
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }
  if (topicFilters) {
    topicFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-tema]');
      if (!btn) return;
      activeTema = btn.dataset.tema;
      visibleCount = PAGE_SIZE;
      updateUrl();
      render();
    });
  }
  if (loadMoreBox) {
    loadMoreBox.addEventListener('click', (event) => {
      if (!event.target.closest('[data-load-more-btn]')) return;
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  document.addEventListener('langchange', render);
});
