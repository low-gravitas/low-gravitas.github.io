/* Low Gravitas — iridescent + ripple effect injection
   Adds .iri-layer2 spans to .iridescent elements and
   .ripple-ring spans to .clay-ripple elements. */
(function () {
  document.querySelectorAll('.iridescent').forEach((el) => {
    const layer = document.createElement('span');
    layer.className = 'iri-layer2';
    layer.setAttribute('aria-hidden', 'true');
    el.appendChild(layer);
  });

  document.querySelectorAll('.clay-ripple').forEach((el) => {
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('span');
      ring.className = 'ripple-ring';
      ring.setAttribute('aria-hidden', 'true');
      el.appendChild(ring);
    }
  });

  // Pause the :root iridescent hue rotation if there are no iridescent
  // elements on this page — saves CPU/battery on non-decorative pages.
  if (!document.querySelector('.iridescent')) {
    document.documentElement.style.animationPlayState = 'paused';
  }
})();
