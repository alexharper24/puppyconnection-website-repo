/* The confirmation dialog both apps use in place of the browser's own confirm() box (Alex,
   2026-11-01: "they're like generic browser pop-up windows"). Copied to the admin by
   app/dev/setup.mjs, the same way as combo.js.

   pcAsk(message, opts) shows the dialog and resolves true or false.
   pcConfirm(el, message, opts) is for code that used `if (!confirm(...)) return;` inside a click,
   change or submit handler. The first time it shows the dialog and returns false. When the
   person confirms, it replays the click (or the form submit) on `el`, and on that replay it
   returns true, so the handler runs on unchanged.

   opts.yes is the confirm button's label (default Continue), opts.no the cancel label (default
   Cancel), and opts.danger marks an action that removes or turns something off. */
(function () {
  'use strict';

  function pcAsk(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var dlg = document.createElement('dialog');
      dlg.className = 'pc-dialog';
      dlg.setAttribute('aria-labelledby', 'pc-dialog-text');
      var form = document.createElement('form');
      form.method = 'dialog';
      var p = document.createElement('p');
      p.id = 'pc-dialog-text';
      p.textContent = message;
      var row = document.createElement('div');
      row.className = 'pc-dialog-actions';
      var no = document.createElement('button');
      no.className = 'btn';
      no.value = 'no';
      no.textContent = opts.no || 'Cancel';
      var yes = document.createElement('button');
      yes.className = 'btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary');
      yes.value = 'yes';
      yes.textContent = opts.yes || 'Continue';
      row.appendChild(no); row.appendChild(yes);
      form.appendChild(p); form.appendChild(row);
      dlg.appendChild(form);
      // A press on the dimmed page around the dialog cancels, as Escape does.
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close('no'); });
      dlg.addEventListener('close', function () {
        var ok = dlg.returnValue === 'yes';
        dlg.remove();
        resolve(ok);
      });
      document.body.appendChild(dlg);
      dlg.showModal();
      // Cancel takes the focus, so Enter never removes something by accident.
      no.focus();
    });
  }

  function pcConfirm(el, message, opts) {
    if (el && el._pcConfirmed) { el._pcConfirmed = false; return true; }
    pcAsk(message, opts).then(function (ok) {
      if (!ok || !el) return;
      el._pcConfirmed = true;
      if (el.tagName === 'FORM') { if (el.requestSubmit) el.requestSubmit(); else el.dispatchEvent(new Event('submit', { cancelable: true })); }
      else el.click();
    });
    return false;
  }

  window.pcAsk = pcAsk;
  window.pcConfirm = pcConfirm;
})();
