/* ==========================================================================
   analytics.js — GoatCounter loader.
   Include on any page with: <script src="/js/analytics.js"></script>
   in <head>, right after the stylesheets.

   GoatCounter site: skolesim.goatcounter.com. Chosen 2026-10-08 in place
   of Google Analytics, as on aiskilltrees.com: no cookies, nothing stored on
   the visitor's device, no IP addresses kept, so no consent banner.
   ========================================================================== */
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://skolesim.goatcounter.com/count');
  document.head.appendChild(s);
})();
