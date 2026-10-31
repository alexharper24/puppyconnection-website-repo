/* Alex, 2026-10-31. A Show button on every password box in the portal, so a person can check what
   they typed. It covers the server pages and the screens portal.js draws later. */
(function () {
  function add(input) {
    if (input.dataset.showable) return;
    input.dataset.showable = '1';
    var wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-show';
    btn.textContent = 'Show';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });
    wrap.appendChild(btn);
  }
  function scan(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('input[type=password]'), add);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].addedNodes.length) { scan(); return; }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
