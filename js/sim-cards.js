// Wires up the 2x2 "Forklaring / Forslag til utforskning / Lignende simuleringer" card
// grid on individual simulation pages: opens a shared popup per card, and for the
// "lignende simuleringer" card, auto-populates it from data/simulations.json by matching
// the current page's topic (falling back to subject) — no per-page data needed beyond the
// grid markup itself, since the current slug is read from the URL.
(function () {
  const overlay = document.getElementById('simModalOverlay');
  if (!overlay) return;
  const body = document.getElementById('simModalBody');
  const closeBtn = overlay.querySelector('.sim-modal-close');

  function openModal(html) {
    body.innerHTML = html;
    overlay.hidden = false;
    closeBtn.focus();
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([body]);
    }
  }

  function closeModal() {
    overlay.hidden = true;
    body.innerHTML = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  document.querySelectorAll('.sim-card[data-modal]').forEach((cardBtn) => {
    cardBtn.addEventListener('click', () => {
      const key = cardBtn.getAttribute('data-modal');
      if (key === 'lignende') {
        const heading = document.getElementById('modal-content-lignende-heading');
        openModal((heading ? heading.innerHTML : '') + '<p>…</p>');
        renderLignende(heading ? heading.innerHTML : '');
      } else {
        const source = document.getElementById('modal-content-' + key);
        openModal(source ? source.innerHTML : '');
      }
    });
  });

  function currentSlug() {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  function renderLignende(headingHtml) {
    fetch('/data/simulations.json')
      .then((r) => r.json())
      .then((all) => {
        const slug = currentSlug();
        const current = all.find((s) => s.slug === slug);
        if (!current) {
          openModal(headingHtml + '<p class="sim-modal-empty" data-i18n="card-lignende-empty">Fant ingen lignende simuleringer.</p>');
          return;
        }
        const subjectSlugs = current.subjects.map((s) => s.slug);
        let matches = all.filter((s) => s.slug !== slug && s.topic.slug === current.topic.slug);
        if (matches.length === 0) {
          matches = all.filter((s) => s.slug !== slug && s.subjects.some((sub) => subjectSlugs.includes(sub.slug)));
        }
        matches = matches.slice(0, 3);
        if (matches.length === 0) {
          openModal(headingHtml + '<p class="sim-modal-empty" data-i18n="card-lignende-empty">Fant ingen lignende simuleringer ennå.</p>');
          return;
        }
        const list = matches.map((s) => `
          <a class="sim-modal-related-item" href="/${s.slug}/">
            <img src="${s.image}" alt="">
            <span>
              <p class="sim-modal-related-item-title">${s.title}</p>
              <p class="sim-modal-related-item-topic">${s.topic.name}</p>
            </span>
          </a>
        `).join('');
        openModal(headingHtml + `<div class="sim-modal-related-list">${list}</div>`);
      })
      .catch(() => {
        openModal('<p class="sim-modal-empty">Kunne ikke laste lignende simuleringer.</p>');
      });
  }
})();
