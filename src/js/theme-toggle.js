// Theme toggle button. data-theme is set before CSS loads by an inline
// head script in base.njk; this handles click + OS change after load.
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) {}
    document.documentElement.setAttribute('data-theme', next);
  });

  // Follow OS changes only if the user hasn't explicitly chosen a theme.
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (err) {}
    if (!stored) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    }
  });
})();
