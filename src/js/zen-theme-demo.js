// Zen theme demo page — per-section theme sync + fade-in observers.
(function () {
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function syncDemos(theme) {
    document.querySelectorAll('.demo-section').forEach(function (section) {
      section.querySelector('.demo').setAttribute('data-theme', theme);
      var sw = section.querySelector('.demo-switch');
      if (sw) sw.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    });
  }

  syncDemos(getTheme());

  // Sync demos when the global theme toggle changes data-theme on <html>.
  new MutationObserver(function () {
    syncDemos(getTheme());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Per-section toggle buttons
  document.querySelectorAll('.demo-switch').forEach(function (btn) {
    var section = btn.closest('.demo-section');
    var demo = section.querySelector('.demo');
    btn.addEventListener('click', function () {
      var current = demo.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      demo.setAttribute('data-theme', next);
      btn.setAttribute('aria-checked', next === 'light' ? 'true' : 'false');
    });
  });

  // Fade-in on scroll
  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () { entry.target.classList.add('visible'); }, i * 100);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(function (el) { fadeObserver.observe(el); });
})();
