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

  if (statNumber) statNumber.textContent = sims.length;

  const subjectOptions = [...new Map(sims.flatMap(s => s.subjects.map(sub => [sub.slug, sub.name]))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'no'));

  if (subjectBox) subjectBox.innerHTML = subjectLinksHTML(subjectOptions);

  if (!grid) return;

  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;
  const PAGE_SIZE = 12;
  const subjectFilters = document.querySelector('[data-simulations-filters-fag]');
  const topicFilters = document.querySelector('[data-simulations-filters-tema]');
  const loadMoreBox = document.querySelector('[data-load-more]');

  const params = new URLSearchParams(location.search);
  let activeFag = params.get('fag') || '';
  let activeTema = params.get('tema') || '';
  let visibleCount = PAGE_SIZE;

  function topicOptionsForFag(fagSlug) {
    return [...new Map(
      sims.filter(s => s.subjects.some(sub => sub.slug === fagSlug) && s.topic)
        .map(s => [s.topic.slug, s.topic.name])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'no'));
  }

  // If the URL arrived with a tema that doesn't belong to the given fag, drop it.
  if (activeFag && activeTema) {
    const valid = topicOptionsForFag(activeFag).some(([slug]) => slug === activeTema);
    if (!valid) activeTema = '';
  }

  function render() {
    const filtered = sims.filter(s => {
      const fagOk = !activeFag || s.subjects.some(sub => sub.slug === activeFag);
      const temaOk = !activeTema || (s.topic && s.topic.slug === activeTema);
      return fagOk && temaOk;
    });
    const shown = limit ? filtered.slice(0, limit) : filtered.slice(0, visibleCount);
    const emptyMsg = i18nText(dict, 'empty-state', 'Ingen simuleringer i denne kategorien ennå.');
    grid.innerHTML = shown.map(simCardHTML).join('') || `<p>${emptyMsg}</p>`;

    if (loadMoreBox) {
      loadMoreBox.innerHTML = filtered.length > shown.length
        ? `<button type="button" class="btn" data-load-more-btn>${i18nText(dict, 'load-more-btn', 'Vis flere')}</button>`
        : '';
    }

    if (subjectFilters) {
      const allFagLabel = i18nText(dict, 'filter-all-fag', 'Alle fag');
      subjectFilters.innerHTML = filterGroupHTML(subjectOptions, activeFag, 'fag', allFagLabel);
    }
    if (topicFilters) {
      if (!activeFag) {
        const hint = i18nText(dict, 'filter-tema-hint', 'Velg et fag for å se tema.');
        topicFilters.innerHTML = `<p class="filter-hint">${hint}</p>`;
      } else {
        const allTemaLabel = i18nText(dict, 'filter-all-tema', 'Alle tema');
        topicFilters.innerHTML = filterGroupHTML(topicOptionsForFag(activeFag), activeTema, 'tema', allTemaLabel);
      }
    }
  }

  function updateUrl() {
    const url = new URL(location.href);
    if (activeFag) url.searchParams.set('fag', activeFag); else url.searchParams.delete('fag');
    if (activeTema) url.searchParams.set('tema', activeTema); else url.searchParams.delete('tema');
    history.pushState({}, '', url);
  }

  render();

  if (subjectFilters) {
    subjectFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-fag]');
      if (!btn) return;
      activeFag = btn.dataset.fag;
      // Not just "when a fag IS set but doesn't own the current tema" — also clear tema
      // whenever fag is reset to "all", since the tema box hides/empties in that case too
      // and a stale tema slug must not keep silently filtering the grid.
      if (!activeFag || !topicOptionsForFag(activeFag).some(([slug]) => slug === activeTema)) {
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
