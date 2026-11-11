// Sizes each <iframe class="tool-frame"> to the height of its content, so a
// submitted single-file tool that is embedded unchanged (byte-identical, as the
// teacher sent it) reads as part of the page rather than a box with its own
// scrollbar. Only works for same-origin frames, which these always are: the
// tool's file sits next to the page as /<slug>/opplegg.html.
//
// Height is measured from the bottom edge of the frame body's children, not from
// scrollHeight: several submitted tools set `body { min-height: 100vh }`, and
// inside an iframe 100vh is the frame's own height, so scrollHeight could only
// ever grow, never shrink back.
(function () {
  function contentHeight(doc) {
    var body = doc.body;
    if (!body) return 0;
    var win = doc.defaultView;
    var max = 0;
    Array.prototype.forEach.call(body.children, function (el) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      var mb = parseFloat(win.getComputedStyle(el).marginBottom) || 0;
      max = Math.max(max, r.bottom + mb);
    });
    return Math.ceil(max + (win.pageYOffset || 0));
  }

  function setup(frame) {
    var doc, win;
    try {
      doc = frame.contentDocument;
      win = frame.contentWindow;
    } catch (e) { return; }
    if (!doc || !doc.body) return;

    function fit() {
      var h = contentHeight(doc);
      if (h > 0) frame.style.height = h + 'px';
    }

    // A tool that scrolls its own window to the top (e.g. after a new level
    // opens) would do nothing once the frame is as tall as its content, so
    // turn a scroll-to-top into scrolling the host page to the frame's top.
    var origScrollTo = win.scrollTo;
    win.scrollTo = function (a, b) {
      var top = (a && typeof a === 'object') ? a.top : b;
      if (top === 0) {
        frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      return origScrollTo.apply(win, arguments);
    };

    fit();
    if (win.ResizeObserver) {
      var ro = new win.ResizeObserver(fit);
      ro.observe(doc.documentElement);
      Array.prototype.forEach.call(doc.body.children, function (el) { ro.observe(el); });
    } else {
      setInterval(fit, 500);
    }
    window.addEventListener('resize', fit);
  }

  document.querySelectorAll('iframe.tool-frame').forEach(function (frame) {
    // The frame may already have loaded by the time this deferred script runs.
    if (frame.contentDocument && frame.contentDocument.readyState === 'complete' &&
        frame.contentDocument.body && frame.contentDocument.body.children.length) {
      setup(frame);
    }
    frame.addEventListener('load', function () { setup(frame); });
  });
})();
