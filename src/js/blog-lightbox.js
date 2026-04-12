(function () {
  var dlg = document.createElement('dialog');
  dlg.className = 'img-lightbox';
  dlg.setAttribute('aria-label', 'Image lightbox');
  var dlgImg = document.createElement('img');
  var closeBtn = document.createElement('button');
  closeBtn.className = 'img-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '\u2715';
  closeBtn.addEventListener('click', function () { dlg.close(); });
  dlg.appendChild(dlgImg);
  dlg.appendChild(closeBtn);
  document.body.appendChild(dlg);

  var triggerEl = null;

  function openLightbox(href, alt, trigger) {
    triggerEl = trigger || null;
    dlgImg.src = href;
    dlgImg.alt = alt || '';
    dlg.showModal();
  }

  // Restore focus to the triggering element when closed
  dlg.addEventListener('close', function () {
    if (triggerEl) {
      triggerEl.focus();
      triggerEl = null;
    }
  });

  // Close when clicking the backdrop (outside the image)
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });

  // Wire each img-link anchor
  document.querySelectorAll('a.img-link').forEach(function (link) {
    link.setAttribute('aria-haspopup', 'dialog');
    var thumb = link.querySelector('img');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openLightbox(link.href, thumb ? thumb.alt : '', link);
    });
  });
})();
