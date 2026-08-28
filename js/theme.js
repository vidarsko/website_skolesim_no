(function () {
  var STORAGE_KEY = 'theme';
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  function apply(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  apply(current);

  toggle.addEventListener('click', function () {
    current = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
    apply(current);
  });
})();
