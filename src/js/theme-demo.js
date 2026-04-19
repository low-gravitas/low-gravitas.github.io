// Theme demo page — per-section light/dark toggle.
// Each <div class="demo"> pairs with a .demo-section-head containing a
// .segmented control. Buttons in the segmented set the adjacent demo's
// data-theme attribute, which scopes vendor --lgz-* / semantic tokens.
(function () {
  function syncSegmented(seg, theme) {
    seg.querySelectorAll('button[data-demo-theme]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.demoTheme === theme ? 'true' : 'false');
    });
  }

  function findDemoFor(head) {
    var el = head.nextElementSibling;
    while (el && !el.classList.contains('demo')) el = el.nextElementSibling;
    return el;
  }

  // Initialize each demo to match the site theme on load.
  var siteTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('.demo').forEach(function (demo) {
    demo.setAttribute('data-theme', siteTheme);
  });
  document.querySelectorAll('.demo-section-head .segmented').forEach(function (seg) {
    syncSegmented(seg, siteTheme);
  });

  // Per-section buttons flip their own demo only.
  document.querySelectorAll('.demo-section-head .segmented button[data-demo-theme]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var head = btn.closest('.demo-section-head');
      var demo = findDemoFor(head);
      if (!demo) return;
      var target = btn.dataset.demoTheme;
      demo.setAttribute('data-theme', target);
      syncSegmented(head.querySelector('.segmented'), target);
    });
  });

  // When the site theme flips, re-sync every demo section to match.
  new MutationObserver(function () {
    var t = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.demo').forEach(function (demo) {
      demo.setAttribute('data-theme', t);
    });
    document.querySelectorAll('.demo-section-head .segmented').forEach(function (seg) {
      syncSegmented(seg, t);
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
})();
