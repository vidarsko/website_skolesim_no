(function () {
  var canvas = document.getElementById('hero-wave-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var LANE_HEIGHT = 56;
  var LANE_GAP = 12;
  var PARTICLE_SPACING = 18;
  var AMPLITUDE = 7;
  var WAVELENGTH = 46;
  var FREQUENCY = 0.5;

  var accent = '';
  var fgMuted = '';
  function readColors() {
    var styles = getComputedStyle(document.documentElement);
    accent = styles.getPropertyValue('--accent').trim() || '#C26148';
    fgMuted = styles.getPropertyValue('--fg').trim() || '#1D1F25';
  }

  var dpr = 1;
  var cssWidth = 0;
  var cssHeight = LANE_HEIGHT * 2 + LANE_GAP;
  var particleCount = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    cssWidth = canvas.parentElement.clientWidth;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particleCount = Math.max(6, Math.round(cssWidth / PARTICLE_SPACING));
    readColors();
  }

  function drawLane(yCenter, mode, t) {
    var spacing = cssWidth / (particleCount + 1);
    var k = (2 * Math.PI) / WAVELENGTH;
    var omega = 2 * Math.PI * FREQUENCY;
    ctx.fillStyle = mode === 'transverse' ? accent : fgMuted;
    ctx.globalAlpha = mode === 'transverse' ? 1 : 0.55;
    for (var i = 1; i <= particleCount; i++) {
      var xRest = i * spacing;
      var phase = k * xRest - omega * t;
      var x = mode === 'longitudinal' ? xRest + AMPLITUDE * Math.sin(phase) : xRest;
      var y = mode === 'transverse' ? yCenter + AMPLITUDE * Math.sin(phase) : yCenter;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(time) {
    if (!cssWidth) return;
    var t = time * 0.001;
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    drawLane(LANE_HEIGHT / 2, 'transverse', t);
    drawLane(LANE_HEIGHT + LANE_GAP + LANE_HEIGHT / 2, 'longitudinal', t);
    if (!document.hidden) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) requestAnimationFrame(draw);
  });
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', readColors);

  resize();
  requestAnimationFrame(draw);
})();
