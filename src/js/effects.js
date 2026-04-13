/* Low Gravitas — iridescent + ripple effect injection
   Adds .iri-layer2 spans to .iridescent elements and
   .ripple-ring spans to .clay-ripple elements. */
(function () {
  document.querySelectorAll('.iridescent').forEach(function (el) {
    var layer = document.createElement('span');
    layer.className = 'iri-layer2';
    layer.setAttribute('aria-hidden', 'true');
    el.appendChild(layer);
  });

  document.querySelectorAll('.clay-ripple').forEach(function (el) {
    for (var i = 0; i < 2; i++) {
      var ring = document.createElement('span');
      ring.className = 'ripple-ring';
      ring.setAttribute('aria-hidden', 'true');
      el.appendChild(ring);
    }
  });
})();
