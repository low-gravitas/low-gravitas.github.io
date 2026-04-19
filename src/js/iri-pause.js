// Pause-motion toggle. data-iri is set before CSS loads by an inline head
// script in base.njk; this handles click + icon swap.
// Codepoints: play-pause U+F040E (default), play U+F04B (when paused).
(function () {
  var btn = document.getElementById('iri-pause-toggle');
  if (!btn) return;

  var ICON_PLAY_PAUSE = String.fromCodePoint(0xF040E);
  var ICON_PLAY       = String.fromCodePoint(0xF04B);

  function render(paused) {
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    btn.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
    btn.setAttribute('title', paused ? 'Resume motion' : 'Pause motion');
    btn.textContent = paused ? ICON_PLAY : ICON_PLAY_PAUSE;
  }

  render(document.documentElement.getAttribute('data-iri') === 'paused');

  btn.addEventListener('click', function () {
    var paused = document.documentElement.getAttribute('data-iri') === 'paused';
    var next = paused ? null : 'paused';
    try {
      if (next) localStorage.setItem('iri', next);
      else localStorage.removeItem('iri');
    } catch (e) {}
    if (next) document.documentElement.setAttribute('data-iri', next);
    else document.documentElement.removeAttribute('data-iri');
    render(!paused);
  });
})();
