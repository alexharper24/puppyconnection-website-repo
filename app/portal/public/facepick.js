/* Tap the face (Alex, 2026-11-04). A dialog that shows a photo whole, takes a tap or click on the
   puppy's face, and previews the 4:5 phone card and the 3:2 desktop card the site cuts from it,
   so the person who knows the puppy checks the crop before it goes live. Both apps use it, and
   app/dev/setup.mjs copies it to the admin the same way as dialog.js.

   pcFacePick({ src, name, fx, fy }) resolves { fx, fy, w, h } with the point as 0..1 of the photo
   and the photo's own size, or null when the person cancels. The previews place the crop with
   the rule in app/build/generate.mjs objectPosition(), so what the dialog shows is what the site
   shows. A photo narrower than 1.2:1 sits whole on the desktop card, as js/main.js draws it. */
(function () {
  'use strict';

  // The same placement as objectPosition() in generate.mjs, as a CSS object-position.
  function position(a, t, fx, fy) {
    var at = function (f, v) { return v >= 1 ? 50 : Math.round(Math.min(Math.max((f - v / 2) / (1 - v), 0), 1) * 1000) / 10; };
    return a > t ? at(fx, t / a) + '% 50%' : '50% ' + at(fy, a / t) + '%';
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function pcFacePick(o) {
    return new Promise(function (resolve) {
      var fx = o.fx == null ? 0.5 : o.fx, fy = o.fy == null ? 0.4 : o.fy, w = 0, h = 0;
      var dlg = el('dialog', 'pc-dialog face-dialog');
      dlg.setAttribute('aria-labelledby', 'face-title');
      var form = el('form'); form.method = 'dialog';
      var title = el('h2', 'face-title', 'Tap ' + (o.name ? o.name + '’s' : 'the puppy’s') + ' face');
      title.id = 'face-title';
      var hint = el('p', 'face-hint', 'The cards on the site are cut around this point. Check that the face shows on both before you save.');
      var stage = el('div', 'face-stage');
      var big = el('img'); big.alt = 'Photo of ' + (o.name || 'the puppy') + '. Tap the face.'; big.draggable = false;
      var dot = el('span', 'face-dot'); dot.setAttribute('aria-hidden', 'true');
      stage.appendChild(big); stage.appendChild(dot);
      stage.tabIndex = 0;
      stage.setAttribute('role', 'application');
      stage.setAttribute('aria-label', 'Face position. Use the arrow keys to move it.');
      var cards = el('div', 'face-cards');
      function card(label, cls) {
        var f = el('figure', 'face-card ' + cls), box = el('div', 'face-card-box'), im = el('img');
        im.alt = ''; box.appendChild(im); f.appendChild(box); f.appendChild(el('figcaption', '', label)); cards.appendChild(f);
        return { box: box, img: im };
      }
      var phone = card('Phone', 'is-phone'), desk = card('Computer', 'is-desk');
      var row = el('div', 'pc-dialog-actions');
      var no = el('button', 'btn', 'Cancel'); no.type = 'button';
      var yes = el('button', 'btn btn-primary', 'Save'); yes.type = 'button'; yes.disabled = true;
      row.appendChild(no); row.appendChild(yes);
      form.appendChild(title); form.appendChild(hint); form.appendChild(stage); form.appendChild(cards); form.appendChild(row);
      dlg.appendChild(form);

      function draw() {
        dot.style.left = (fx * 100) + '%'; dot.style.top = (fy * 100) + '%';
        if (!w) return;
        var a = w / h;
        phone.img.style.objectPosition = position(a, 0.8, fx, fy);
        var whole = a < 1.2;
        desk.box.classList.toggle('is-whole', whole);
        desk.img.style.objectFit = whole ? 'contain' : 'cover';
        desk.img.style.objectPosition = whole ? 'center' : position(a, 1.5, fx, fy);
      }
      function set(x, y) { fx = Math.round(Math.min(Math.max(x, 0), 1) * 1000) / 1000; fy = Math.round(Math.min(Math.max(y, 0), 1) * 1000) / 1000; draw(); }
      stage.addEventListener('click', function (e) {
        var r = big.getBoundingClientRect();
        if (!r.width) return;
        set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      });
      stage.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[e.key];
        if (!k) return;
        e.preventDefault(); set(fx + k[0], fy + k[1]);
      });
      big.onload = function () { w = big.naturalWidth; h = big.naturalHeight; yes.disabled = false; draw(); };
      big.onerror = function () { hint.textContent = 'The photo did not load. Close this and try again.'; };
      [big, phone.img, desk.img].forEach(function (im) { im.src = o.src; });

      var done = false;
      function finish(v) { if (done) return; done = true; dlg.close(); dlg.remove(); resolve(v); }
      no.addEventListener('click', function () { finish(null); });
      yes.addEventListener('click', function () { finish({ fx: fx, fy: fy, w: w, h: h }); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      document.body.appendChild(dlg);
      dlg.showModal();
      draw();
      stage.focus();
    });
  }

  window.pcFacePick = pcFacePick;
})();
