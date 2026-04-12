/* ── Code block enhancements ── */
(function () {
  document.querySelectorAll('pre[class*="language-"]').forEach(function (pre) {
    // Wrap pre in .code-block
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Build header: label + copy button
    var header = document.createElement('div');
    header.className = 'code-block-header';

    var label = document.createElement('span');
    label.className = 'code-block-label';
    var title = pre.getAttribute('data-title');
    if (title) {
      label.textContent = title;
      label.setAttribute('data-is-title', '');
    } else if (!pre.hasAttribute('data-no-lang')) {
      var langMatch = pre.className.match(/language-(\w+)/);
      if (langMatch) label.textContent = langMatch[1];
    }
    header.appendChild(label);

    var btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.innerHTML = '<span class="lg">\uF0C5</span>';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.innerHTML = '<span class="lg">\uF00C</span> Copied!';
        btn.setAttribute('data-copied', '');
        setTimeout(function () {
          btn.innerHTML = '<span class="lg">\uF0C5</span>';
          btn.removeAttribute('data-copied');
        }, 1500);
      });
    });
    header.appendChild(btn);

    wrapper.insertBefore(header, pre);

    // Apply line highlighting if data-highlight is set
    var highlight = pre.getAttribute('data-highlight');
    if (highlight) {
      var lines = new Set();
      highlight.split(',').forEach(function (part) {
        part = part.trim();
        if (part.indexOf('-') > -1) {
          var range = part.split('-').map(Number);
          for (var i = range[0]; i <= range[1]; i++) lines.add(i);
        } else {
          lines.add(Number(part));
        }
      });
      var lineEls = pre.querySelectorAll('.highlight-line');
      lineEls.forEach(function (el, idx) {
        if (lines.has(idx + 1)) {
          el.setAttribute('data-highlighted', '');
        }
      });
    }
  });
})();
