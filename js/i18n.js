(function () {
  var STORAGE_KEY = 'lang';
  var SUPPORTED = ['no', 'en'];
  var DEFAULT_LANG = 'no';

  function detectLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browserLangs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < browserLangs.length; i++) {
      var code = (browserLangs[i] || '').toLowerCase();
      if (code.indexOf('no') === 0 || code.indexOf('nb') === 0 || code.indexOf('nn') === 0) return 'no';
      if (code.indexOf('en') === 0) return 'en';
    }
    return DEFAULT_LANG;
  }

  function loadDict() {
    var el = document.getElementById('i18n-dict');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function apply(lang, dict) {
    document.documentElement.setAttribute('lang', lang === 'no' ? 'nb' : lang);

    if (dict) {
      var nodes = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < nodes.length; i++) {
        var entry = dict[nodes[i].getAttribute('data-i18n')];
        if (entry && entry[lang] != null) nodes[i].textContent = entry[lang];
      }

      var attrNodes = document.querySelectorAll('[data-i18n-attr]');
      for (var j = 0; j < attrNodes.length; j++) {
        var node = attrNodes[j];
        var pairs = node.getAttribute('data-i18n-attr').split(',');
        for (var k = 0; k < pairs.length; k++) {
          var parts = pairs[k].split(':');
          var attrEntry = dict[parts[1]];
          if (attrEntry && attrEntry[lang] != null) node.setAttribute(parts[0], attrEntry[lang]);
        }
      }
    }

    var buttons = document.querySelectorAll('.lang-btn');
    for (var b = 0; b < buttons.length; b++) {
      var isActive = buttons[b].getAttribute('data-lang') === lang;
      buttons[b].classList.toggle('active', isActive);
      buttons[b].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  var dict = loadDict();
  var current = detectLang();
  apply(current, dict);

  var switchEl = document.querySelector('.lang-switch');
  if (switchEl) {
    switchEl.addEventListener('click', function (event) {
      var btn = event.target.closest('.lang-btn');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang');
      if (!lang || lang === current) return;
      current = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      apply(current, dict);
    });
  }
})();
