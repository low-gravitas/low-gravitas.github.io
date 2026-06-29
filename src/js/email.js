// Assemble mailto: links on the client so the address never appears as a
// literal string in the page source — a basic spam-harvester deterrent.
// Markup: <a class="email-link" data-user="support" data-domain="lowgravitas.com">…</a>
for (const a of document.querySelectorAll(".email-link")) {
  const addr = a.dataset.user + "@" + a.dataset.domain;
  a.href = "mailto:" + addr;
  a.textContent = addr;
}
