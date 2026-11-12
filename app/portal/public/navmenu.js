/* The grouped menu of the breeder portal and the admin (Alex, 2026-11-11, mobile review option A,
   app/docs/batch-2026-11-11-mobile-review.md). Shared like combo.js: edit the portal's copy, and
   app/dev/setup.mjs copies it to the admin.

   Each group is a button that opens and closes its screens, with aria-expanded and aria-controls.
   On a phone (860px and below) the groups start closed apart from the one holding this screen, and
   a closed group lists its screens on one line under its name. On a wider screen every group
   starts open, so the rail reads as it did. The rail is drawn again on every screen, so the state
   follows the screen rather than being remembered.

     pcNavSections([['Today', [{ href: '#/', label: 'Overview', on: true, tally: 3, aria: 'Overview, 3', attrs: '' }]]])
*/
(function () {
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var phone = function () { return window.matchMedia && window.matchMedia('(max-width: 860px)').matches; };
  var count = 0;

  window.pcNavSections = function (groups) {
    var small = phone();
    var anyOn = groups.some(function (g) { return g[1].some(function (n) { return n.on; }); });
    return groups.map(function (g, i) {
      var id = 'ng-' + (++count);
      var here = g[1].some(function (n) { return n.on; });
      var open = !small || here || (!anyOn && i === 0);
      var list = g[1].map(function (n) { return n.label + (n.tally ? ' (' + n.tally + ')' : ''); }).join(', ');
      return '<div class="nav-sec">' +
        '<button class="nav-group" type="button" aria-expanded="' + open + '" aria-controls="' + id + '">' +
          '<span class="ng-name">' + esc(g[0]) + '</span><span class="ng-list" aria-hidden="true">' + esc(list) + '</span></button>' +
        '<div class="nav-items" id="' + id + '"' + (open ? '' : ' hidden') + '>' + g[1].map(function (n) {
          return '<a href="' + esc(n.href) + '"' + (n.on ? ' class="is-on" aria-current="page"' : '') + (n.aria ? ' aria-label="' + esc(n.aria) + '"' : '') + (n.attrs || '') + '>' +
            '<span>' + esc(n.label) + '</span>' + (n.tally ? '<span class="tally">' + esc(n.tally) + '</span>' : '') + '</a>';
        }).join('') + '</div></div>';
    }).join('');
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.nav-group[aria-controls]');
    if (!b) return;
    var box = document.getElementById(b.getAttribute('aria-controls'));
    if (!box) return;
    var open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    box.hidden = !open;
  });

  // Escape closes the open phone menu and puts focus back on the Menu button.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var rail = document.querySelector('.rail.open');
    if (!rail || document.querySelector('.drawer, dialog[open]')) return;
    rail.classList.remove('open');
    var btn = rail.querySelector('.menu-btn');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  });
})();
