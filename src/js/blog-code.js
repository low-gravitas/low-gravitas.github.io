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
      }).catch(function () {
        btn.innerHTML = '<span class="lg">\uF00D</span> Failed';
        setTimeout(function () {
          btn.innerHTML = '<span class="lg">\uF0C5</span>';
        }, 1500);
      });
    });
    header.appendChild(btn);

    wrapper.insertBefore(header, pre);

    // Wrap each source line in a .highlight-line span when line numbers or
    // highlighting is requested. Prism doesn't emit per-line wrappers, so we
    // walk the post-tokenised DOM and split text nodes on \n, redistributing
    // nodes into new line wrappers.
    var wantsLines = pre.hasAttribute('data-line-numbers') || pre.hasAttribute('data-highlight');
    if (wantsLines) {
      var code = pre.querySelector('code');
      if (code) {
        var doc = code.ownerDocument;
        var current = doc.createElement('span');
        current.className = 'highlight-line';
        var lines = [current];
        Array.from(code.childNodes).forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE && node.nodeValue.indexOf('\n') !== -1) {
            var parts = node.nodeValue.split('\n');
            parts.forEach(function (part, idx) {
              if (part) current.appendChild(doc.createTextNode(part));
              if (idx < parts.length - 1) {
                current = doc.createElement('span');
                current.className = 'highlight-line';
                lines.push(current);
              }
            });
          } else {
            current.appendChild(node);
          }
        });
        if (lines.length && !lines[lines.length - 1].hasChildNodes()) lines.pop();
        while (code.firstChild) code.removeChild(code.firstChild);
        lines.forEach(function (line, idx) {
          code.appendChild(line);
          if (idx < lines.length - 1) code.appendChild(doc.createTextNode('\n'));
        });
        // Size the line-number gutter to the widest line number; floor at 2 so
        // single-digit blocks don't collapse to a hair-thin column. 99 lines
        // = 2ch, 999 = 3ch, etc.
        var digits = Math.max(2, String(lines.length).length);
        pre.style.setProperty('--lnum-width', digits + 'ch');
      }
    }

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
