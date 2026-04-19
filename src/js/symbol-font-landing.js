// Symbol font landing page — version/count display + icon-set pill grid.
(function () {
  function countUp(el, target, duration) {
    var start = performance.now();
    var update = function (now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(update);
  }

  var versionEl = document.getElementById('version');
  if (versionEl) {
    var version = versionEl.dataset.version || '';
    versionEl.textContent = version + ' \u00B7 ';
  }

  fetch(window.GLYPHS_URL || '/vendor/glyphs.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var counts = {};
      data.forEach(function (g) { counts[g.set] = (counts[g.set] || 0) + 1; });
      var grid = document.getElementById('sets-grid');
      if (grid) {
        Object.keys(counts).sort().forEach(function (set) {
          var pill = document.createElement('a');
          pill.className = 'pill';
          pill.href = '/symbol-font/browser/?set=' + encodeURIComponent(set);
          pill.textContent = set + ' ';
          var ct = document.createElement('span');
          ct.className = 'badge badge--count';
          ct.textContent = counts[set].toLocaleString();
          pill.appendChild(ct);
          grid.appendChild(pill);
        });
      }

      if (versionEl) {
        var countSpan = document.createElement('span');
        versionEl.appendChild(countSpan);
        countUp(countSpan, data.length, 1200);
        versionEl.appendChild(document.createTextNode(' glyphs'));
      }
    })
    .catch(function () {});
})();
