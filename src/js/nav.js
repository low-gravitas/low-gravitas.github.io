(function () {
  const nav = document.querySelector('.top-nav');
  if (!nav) return;

  // Keep --nav-height accurate for sticky toolbars (e.g. glyph browser).
  // Measured after layout so the two-row mobile height is captured correctly.
  function syncNavHeight() {
    document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
  }
  syncNavHeight();
  window.addEventListener('resize', syncNavHeight, { passive: true });

  // Auto-hide on scroll down, reveal on scroll up.
  // Only activates after 80px of scroll so top-of-page bounces don't hide the nav.
  let lastY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      const y = window.scrollY;
      if (y > 80) {
        nav.classList.toggle('nav-hidden', y > lastY);
      } else {
        nav.classList.remove('nav-hidden');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();
