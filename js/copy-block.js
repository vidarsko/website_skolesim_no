(function () {
  var COPIED_LABEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Kopiert!';
  var RESET_DELAY = 1500;

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.copy-btn');
    if (!btn) return;

    var block = btn.closest('.copy-block');
    var content = block && block.querySelector('.copy-block-content');
    if (!content) return;

    navigator.clipboard.writeText(content.textContent.trim()).then(function () {
      var original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = COPIED_LABEL;
      setTimeout(function () {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, RESET_DELAY);
    });
  });
})();
