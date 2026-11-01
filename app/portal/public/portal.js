/* The breeder portal. One page, hash routes, every edit in one drawer beside the list
   (the Teapup editor's pattern). All data comes from the portal Worker's JSON API. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var state = { config: null, me: null, breeds: [], listings: null, parents: null, route: '' };

  // ------------------------------------------------------------ helpers
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(c) { return c == null ? '' : '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 }); }
  function dollars(c) { return c == null ? '' : String(c / 100); }
  function day(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ------------------------------------------------------------ busy states
  /* Amber, 2026-10-26: a slight lag when adding puppies, with no sign the press was taken. The
     button or form that starts a change is held busy until every request it led to has finished,
     including the reload after a save, so a second press cannot add a second copy. The label
     changes to Saving, Adding and so on only when the wait passes 150 ms, so quick actions do not
     flicker. Uploads that shrink a photo first say what they are doing through fileBusy. */
  var trigger = null, held = null, inflight = 0;
  var BUSY_WORDS = [[/^(save|accept|i accept)/i, 'Saving…'], [/^add/i, 'Adding…'], [/^submit/i, 'Submitting…'], [/^send/i, 'Sending…'],
    [/^sign in/i, 'Signing in…'], [/^(pay|relist)/i, 'Opening checkout…'], [/^remove/i, 'Removing…'], [/^copy/i, 'Copying…'],
    [/^(mark|make|move)/i, 'Updating…'], [/^(create|set|turn|confirm|verify|continue)/i, 'Working…']];
  function busyWord(el) {
    var t = (el.textContent || '').trim();
    for (var i = 0; i < BUSY_WORDS.length; i++) if (BUSY_WORDS[i][0].test(t)) return BUSY_WORDS[i][1];
    return 'Working…';
  }
  function markBusy(el, word) {
    el.dataset.busy = '1';
    el.setAttribute('aria-busy', 'true');
    if (el.tagName === 'BUTTON' || el.tagName === 'LABEL') {
      if (el.tagName === 'BUTTON' && !el.disabled) { el.disabled = true; el.dataset.busyDisabled = '1'; }
      el.style.minWidth = el.offsetWidth + 'px';
      el.dataset.busyLabel = el.innerHTML;
      el.textContent = word || busyWord(el);
    }
    el.classList.add('is-busy');
  }
  function clearBusy(el) {
    if (!el || !el.dataset.busy) return;
    delete el.dataset.busy;
    el.removeAttribute('aria-busy');
    el.classList.remove('is-busy');
    if (el.dataset.busyLabel != null) { el.innerHTML = el.dataset.busyLabel; delete el.dataset.busyLabel; el.style.minWidth = ''; }
    if (el.dataset.busyDisabled) { el.disabled = false; delete el.dataset.busyDisabled; }
  }
  function hold(el, form) {
    if (held) return;
    held = { el: el, form: form, shown: false };
    if (form) form.dataset.busy = '1';
    el.dataset.busy = '1';
    held.timer = setTimeout(function () { if (held && held.el === el && !held.done) { held.shown = true; markBusy(el); } }, 150);
  }
  function release() {
    if (!held || inflight) return;
    var h = held; held = null; h.done = true;
    clearTimeout(h.timer);
    if (h.shown) clearBusy(h.el); else delete h.el.dataset.busy;
    if (h.form) delete h.form.dataset.busy;
  }
  function requestStarted(method) {
    inflight++;
    if (method !== 'GET' && trigger && !held) hold(trigger.el, trigger.form);
  }
  function requestEnded() {
    inflight--;
    // A save is usually followed by a reload of the list, started in the same turn, so wait one
    // turn before letting go.
    setTimeout(release, 0);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    if (b.dataset.busy || (b.form && b.form.dataset.busy)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    trigger = { el: b, form: b.form || null };
    setTimeout(function () { if (trigger && trigger.el === b) trigger = null; }, 0);
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.dataset.busy) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    var b = e.submitter || $('button[type=submit]', f) || $('button', f);
    if (!b) return;
    trigger = { el: b, form: f };
    setTimeout(function () { if (trigger && trigger.el === b) trigger = null; }, 0);
  }, true);
  /* For a file picker: the label that opens it says what is happening and the picker is locked
     until done(). set(text) changes the words, for a batch of photos. */
  function fileBusy(input, text) {
    var label = input.id ? $('label[for="' + input.id + '"]') : null;
    input.disabled = true;
    if (label) { markBusy(label, text); label.setAttribute('role', 'status'); }
    return {
      set: function (t) { if (label) label.textContent = t; },
      done: function () { input.disabled = false; if (label) { label.removeAttribute('role'); clearBusy(label); } },
    };
  }

  function api(method, path, body, raw) {
    requestStarted(method);
    return apiFetch(method, path, body, raw).then(function (v) { requestEnded(); return v; }, function (e) { requestEnded(); throw e; });
  }
  function apiFetch(method, path, body, raw) {
    var opts = { method: method, credentials: 'same-origin', headers: {} };
    if (raw) { opts.body = raw; opts.headers['content-type'] = raw.type || 'application/octet-stream'; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['content-type'] = 'application/json'; }
    return fetch(path, opts).then(function (res) {
      return res.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = { error: t }; }
        if (res.status === 401) { state.me = null; render(); }
        // Workplan A27. Signed in to more than one kennel with none picked yet.
        if (res.status === 409 && data && data.choose) { location.href = data.choose; }
        if (!res.ok) { var err = new Error((data && data.error) || 'Something went wrong.'); err.data = data; err.status = res.status; throw err; }
        return data;
      });
    });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function formData(form) {
    var out = {};
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked; else out[el.name] = el.value;
    });
    return out;
  }

  function showError(form, err) {
    var box = $('.error', form);
    if (!box) { box = document.createElement('p'); box.className = 'error'; box.setAttribute('role', 'alert'); form.appendChild(box); }
    var extra = err.data && err.data.problems ? '<br>' + err.data.problems.map(function (p) { return esc(p.puppy) + ': ' + esc(p.reason); }).join('<br>') : '';
    box.innerHTML = esc(err.message) + extra;
  }

  // ------------------------------------------------------------ drawer
  var lastFocus = null;
  /* Alex, 2026-10-27, after Teapup's editor: a record opens wide, about two thirds of a laptop
     window, with its details on the left and its photos, videos and documents on the right, so
     less of it needs scrolling. SPLIT marks where the right column starts. Under 1,200px wide the
     drawer keeps its narrow width and the two columns stack. */
  var SPLIT = '<i data-split hidden></i>';
  function splitColumns(body) {
    var mark = $('[data-split]', body);
    if (!mark || mark.parentNode !== body) return;
    var cols = document.createElement('div'); cols.className = 'd-cols';
    var main = document.createElement('div'); main.className = 'd-main';
    var side = document.createElement('div'); side.className = 'd-side';
    var into = main;
    Array.prototype.slice.call(body.childNodes).forEach(function (n) {
      if (n === mark) { into = side; body.removeChild(n); return; }
      into.appendChild(n);
    });
    cols.appendChild(main); cols.appendChild(side); body.appendChild(cols);
  }
  function openDrawer(title, bodyHtml, onReady) {
    // Alex, 2026-10-31. A panel that redraws itself after a change (a photo moved, a note added)
    // keeps its scroll place, skips the slide-in and leaves the focus alone, so nothing jumps.
    var old = $('#drawer'), again = !!old && old.getAttribute('aria-label') === title;
    var keepTop = again ? $('.drawer-body', old).scrollTop : 0, keepFocus = lastFocus;
    if (again) lastFocus = null;
    closeDrawer();
    lastFocus = again ? keepFocus : document.activeElement;
    var scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.id = 'scrim';
    var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', title);
    d.innerHTML = '<div class="drawer-head"><h2>' + esc(title) + '</h2><button class="btn btn-quiet" data-close aria-label="Close">Close</button></div>' +
      '<div class="drawer-body">' + bodyHtml + '</div>';
    if (bodyHtml.indexOf(SPLIT) >= 0) { d.classList.add('wide'); splitColumns($('.drawer-body', d)); }
    document.body.appendChild(scrim); document.body.appendChild(d);
    scrim.addEventListener('click', closeDrawer);
    $('[data-close]', d).addEventListener('click', closeDrawer);
    if (again) { d.classList.add('no-anim'); $('.drawer-body', d).scrollTop = keepTop; }
    else { var first = $('input, select, textarea, button:not([data-close])', d); if (first) first.focus(); }
    if (onReady) onReady(d);
    if (again) $('.drawer-body', d).scrollTop = keepTop;
  }
  function closeDrawer() {
    var d = $('#drawer'), s = $('#scrim');
    if (d) d.remove(); if (s) s.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  // Workplan A12. Add a photo and Relist, wherever the banner or a standing line shows them. Add a
  // photo opens the puppy at its photos, the same place the reminder emails link to.
  document.addEventListener('click', function (e) {
    var ph = e.target.closest && e.target.closest('[data-photos]');
    if (ph) {
      var target = '#/litters?photos=' + ph.dataset.photos;
      if (location.hash === target) render(); else location.hash = target;
      return;
    }
    var b = e.target.closest && e.target.closest('[data-relist]');
    if (!b) return;
    b.disabled = true;
    api('POST', '/api/checkouts', { puppy_ids: [b.dataset.relist] }).then(function (r) { location.href = r.url; })
      .catch(function (err) { b.disabled = false; toast(err.message); });
  });

  // ------------------------------------------------------------ sign in
  /* Launch workplan A26. A password, with an authenticator app if the person set one up, or Google.
     Email carries only new-account confirmations, invitations and password links, never a way in.
     mode is signin, code (the authenticator step, with its ticket), forgot, signup or sent. */
  var GOOGLE_SVG = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.7-2.9-.7-4.6s.3-3.2.7-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
  function renderSignIn(mode, extra) {
    mode = mode || 'signin'; extra = extra || {};
    document.body.className = 'plain';
    var c = state.config || {};
    var mailbox = c.mailbox ? (c.notices ? '<p class="sim-flag">This is the test version, so nothing is really emailed. <a href="/dev/mail">Open the test mailbox</a> to find the link.</p>'
      : '<p class="muted small">Email delivery is not switched on yet, so the link is waiting in the <a href="/dev/mail">portal mailbox</a>.</p>') : '';
    var body;
    if (mode === 'sent') {
      body = '<h1>Check your email</h1><p>' + esc(extra.message) + '</p>' + mailbox + '<p class="muted small"><a href="/" data-mode="signin">Back to sign in</a></p>';
    } else if (mode === 'code') {
      body = '<h1>Enter your code</h1><p>Open your authenticator app and type the six numbers it shows for Puppy Connection.</p>' +
        '<form id="codeform" novalidate><div class="field"><label for="code">Authenticator code</label>' +
        '<input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required class="code-input"></div>' +
        '<button class="btn btn-primary" type="submit">Sign in</button></form>' +
        '<p class="muted small">Lost your phone? Type one of your recovery codes in the same box. Each one works once. If you have none left, contact Puppy Connection to reset your authenticator.</p>' +
        '<p class="muted small"><a href="/" data-mode="signin">Start again</a></p>';
    } else if (mode === 'forgot') {
      body = '<h1>Set a password</h1><p>Enter the email address you sign in with. We will email you a link to set a new password. If you list with us already but have never had a password, this sets your first one.</p>' +
        '<form id="forgot" novalidate><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="' + esc(extra.email || '') + '"></div>' +
        '<button class="btn btn-primary" type="submit">Email me a link</button></form>' +
        '<p class="muted small"><a href="/" data-mode="signin">Back to sign in</a></p>';
    } else if (mode === 'signup') {
      body = '<h1>List with Puppy Connection</h1><p>Enter your email and business name. We will email you a link to confirm the address, and then you choose your password.</p>' +
        '<form id="signup" novalidate><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="' + esc(extra.email || '') + '"></div>' +
        '<div class="field"><label for="bn">Business name</label><input id="bn" name="business_name" type="text" autocomplete="organization"></div>' +
        (c.turnstile_site_key ? '<div class="field"><div class="cf-turnstile" data-sitekey="' + esc(c.turnstile_site_key) + '" data-action="auth"></div></div>' : '') +
        '<button class="btn btn-primary" type="submit">Create my account</button></form>' +
        '<p class="muted small">Already listed with us? <a href="/" data-mode="signin">Sign in</a>.</p>';
    } else {
      body = '<h1>Breeder portal</h1><p>List your litters and puppies on Puppy Connection.</p>' +
        (/google=failed/.test(location.search) ? '<p class="notice notice-alert">Google sign-in did not go through. Please try again, or use your email and password below.</p>' : '') +
        (c.google ? '<div id="gsi-button" class="gsi-button" aria-live="polite"></div><a class="btn btn-google" id="google-redirect" href="/auth/google">' + GOOGLE_SVG + 'Continue with Google</a>' +
          '<p class="or"><span>or use your email and password</span></p>' : '') +
        '<form id="signin" novalidate><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required></div>' +
        '<div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>' +
        '<button class="btn btn-primary" type="submit">Sign in</button></form>' +
        '<p class="small"><a href="/" data-mode="forgot">Forgot password?</a></p>' +
        '<p class="notice small">Already list with us but never set a password? Use <a href="/" data-mode="forgot">Forgot password</a> and we will email you a link to set one.</p>' +
        '<p class="small">New to Puppy Connection? <a href="/" data-mode="signup">Create an account</a></p>' +
        (c.local && c.notices ? '<p class="sim-flag" style="margin-top:1rem">This is the test version. Email is shown in the <a href="/dev/mail">test mailbox</a> and payments use a practice checkout.</p>' : '');
    }
    app.innerHTML = (c.site_origin ? '<a class="plain-site" href="' + esc(c.site_origin) + '/">Visit site</a>' : '') +
      '<main class="plain-card"><div class="plain-mark"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></div>' + body +
      '</main><footer class="plain-foot"><a href="/privacy">Privacy</a><a href="/terms">Listing terms</a></footer>';
    $$('[data-mode]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); var em = $('#email'); renderSignIn(a.dataset.mode, { email: em ? em.value : '' }); });
    });
    var signedIn = function () { location.hash = '#/'; location.reload(); };
    var cf = $('#codeform');
    if (cf) {
      $('#code', cf).focus();
      cf.addEventListener('submit', function (e) {
        e.preventDefault();
        var b = $('button[type=submit]', cf); b.disabled = true;
        api('POST', '/auth/totp', { ticket: extra.ticket, code: $('#code', cf).value })
          .then(function (r) {
            if (r && r.recovery_left != null) { try { sessionStorage.setItem('pc-recovery-left', String(r.recovery_left)); } catch (x) { /* storage off */ } }
            signedIn();
          })
          .catch(function (err) { b.disabled = false; showError(cf, err); });
      });
    }
    if (c.google && mode === 'signin') startGoogle();
    if (mode === 'signup' && c.turnstile_site_key && !window.turnstile) {
      var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; document.head.appendChild(s);
    }
    var f = $('#signin');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(f);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return showError(f, new Error('Enter a valid email address.'));
      if (!d.password) return showError(f, new Error('Enter your password.'));
      var btn = $('button[type=submit]', f); btn.disabled = true;
      api('POST', '/auth/password', { email: d.email, password: d.password })
        .then(function (r) { if (r && r.need_code) renderSignIn('code', { ticket: r.ticket }); else signedIn(); })
        .catch(function (err) { btn.disabled = false; showError(f, err); });
    });
    var fg = $('#forgot');
    if (fg) fg.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(fg);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return showError(fg, new Error('Enter a valid email address.'));
      var btn = $('button[type=submit]', fg); btn.disabled = true;
      api('POST', '/auth/forgot', { email: d.email }).then(function (r) { renderSignIn('sent', { message: r.message }); })
        .catch(function (err) { btn.disabled = false; showError(fg, err); });
    });
    var su = $('#signup');
    if (su) su.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(su);
      var tok = $('[name="cf-turnstile-response"]', su);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return showError(su, new Error('Enter a valid email address.'));
      var btn = $('button[type=submit]', su); btn.disabled = true;
      api('POST', '/auth/signup', { email: d.email, business_name: d.business_name, turnstile_token: tok ? tok.value : '' })
        .then(function (r) { renderSignIn('sent', { message: r.message }); })
        .catch(function (err) { btn.disabled = false; showError(su, err); });
    });
  }

  /* Google's own library shows One Tap ("Continue as Alex") and its standard button on this
     page, so a breeder signs in without leaving it. If the library cannot load, the plain
     redirect button below it is what they see and use. */
  function startGoogle() {
    api('GET', '/auth/google/nonce').then(function (g) {
      function ready() {
        if (!window.google || !google.accounts || !google.accounts.id) return;
        google.accounts.id.initialize({
          client_id: g.client_id, nonce: g.nonce, context: 'signin', ux_mode: 'popup',
          use_fedcm_for_prompt: true, itp_support: true, cancel_on_tap_outside: true,
          callback: function (resp) {
            api('POST', '/auth/google/onetap', { credential: resp.credential })
              .then(function () { location.hash = '#/'; location.reload(); })
              .catch(function (err) { var f = $('#signin'); if (f) showError(f, err); });
          },
        });
        var box = $('#gsi-button');
        if (box) {
          // The box is display:none while empty, so its own width reads 0. Size the button to
          // the form beside it, or a 400 px button pushes the card past a phone screen.
          var form = $('#signin');
          var w = Math.max(200, Math.min((form && form.clientWidth) || box.clientWidth || 400, 400));
          google.accounts.id.renderButton(box, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', width: w });
          var fallback = $('#google-redirect'); if (fallback) fallback.hidden = true;
        }
        google.accounts.id.prompt();
      }
      if (window.google && window.google.accounts) return ready();
      var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ready;
      document.head.appendChild(s);
    }).catch(function () { /* the redirect button stays */ });
  }

  // ------------------------------------------------------------ shell
  // A pending or declined breeder sees only the screens that work for them (plan P1.5).
  function nav(status) {
    var listing = [['', 'Overview'], ['litters', 'Litters and puppies'], ['parents', 'Moms and dads'], ['pay', 'Pay to list'], ['stats', 'Views and clicks']];
    var account = [['profile', 'Profile'], ['payments', 'Payments'], ['account', 'Account'], ['help', 'Help']];
    if (status === 'pending') return [['Getting started', [['', 'Overview'], ['profile', 'Profile']]], ['Account', [['account', 'Account'], ['help', 'Help']]]];
    if (status === 'declined') return [['Account', [['', 'Overview'], ['account', 'Account'], ['help', 'Help']]]];
    return [['Your listings', listing], ['Account', account]];
  }
  // The screens each status may open. Anything else goes back to the overview.
  var OPEN_TO = { pending: ['', 'profile', 'account', 'help'], declined: ['', 'account', 'help'] };

  function statusPill(s) {
    return { pending: '<span class="pill pill-warn">Waiting for approval</span>', approved: '<span class="pill pill-ok">Approved</span>',
      suspended: '<span class="pill pill-alert">Paused</span>', declined: '<span class="pill pill-alert">Not approved</span>' }[s] || '';
  }

  // Below 860px the menu folds behind a Menu button (Alex, 2026-10-19). The rail is redrawn on every screen, so it closes on its own.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.menu-btn'); if (!b) return;
    b.setAttribute('aria-expanded', String(b.closest('.rail').classList.toggle('open')));
  });

  function shell(inner, narrow) {
    // The same screen drawn again after a save keeps the page where it was (Alex, 2026-10-31).
    var keepY = shell.lastRoute === state.route ? window.scrollY : 0;
    shell.lastRoute = state.route;
    if (keepY) requestAnimationFrame(function () { window.scrollTo(0, keepY); });
    document.body.className = '';
    var me = state.me;
    var route = state.route.split('?')[0];
    var here = ''; nav(me.status).forEach(function (g) { g[1].forEach(function (n) { if (n[0] === route) here = n[1]; }); });
    var foot = { pending: me.profile_submitted_at ? ['Waiting for approval', 'Puppy Connection will email you'] : ['Signing up', 'Finish your profile to submit'],
      approved: ['Approved', 'You can list and pay'], suspended: ['Paused', 'Changes and payments are on hold'], declined: ['Not approved', 'Reply to the email you received'] }[me.status] || ['', ''];
    app.innerHTML = '<div class="app"><aside class="rail" aria-label="Main menu">' +
      '<div class="rail-head"><a href="#/" aria-label="Puppy Connection breeder portal, overview"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></a><span class="role">Breeder portal</span>' + '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu' + (here ? '<span>' + esc(here) + '</span>' : '') + '</button>' + '</div>' +
      '<nav class="nav" id="nav">' + nav(me.status).map(function (g) {
        return '<div class="nav-group">' + esc(g[0]) + '</div>' + g[1].map(function (n) {
          return '<a href="#/' + n[0] + '"' + (route === n[0] ? ' class="is-on" aria-current="page"' : '') + '><span>' + esc(n[1]) + '</span></a>';
        }).join('');
      }).join('') + (me.status === 'pending' ? '<p class="nav-note">Litters, puppies and payments open once Puppy Connection approves your account.</p>' : '') + '</nav>' +
      '<div class="rail-foot"><span class="dot' + (me.status === 'approved' ? '' : ' wait') + '"></span><div><b>' + esc(foot[0]) + '</b><span>' + esc(foot[1]) + '</span></div></div></aside>' +
      '<div class="main"><header class="topbar' + (narrow ? ' narrow' : '') + '"><div class="who"><span class="name">' + esc(me.profile.business_name || me.email) + '</span>' + statusPill(me.status) +
      // Plan P2.2. The breeder's own page on the public site, once they are public.
      (me.site_url ? '<a class="btn btn-sm" href="' + esc(me.site_url) + '" target="_blank" rel="noopener">View on the site</a>' : '') +
      // Workplan A11. A quiet way back to the public site, in the same tab.
      ((state.config || {}).site_origin ? '<a class="btn btn-sm btn-quiet" href="' + esc(state.config.site_origin) + '/">Visit site</a>' : '') +
      // Workplan A27. A person on more than one kennel goes back to Choose a kennel from here.
      (me.kennel_count > 1 && !me.operator ? '<a class="btn btn-sm" id="switch-kennel" href="/choose">Switch kennel</a>' : '') +
      '<button class="btn btn-sm" id="signout">Sign out</button></div></header>' +
      '<main class="work" id="content"><div class="view' + (narrow ? ' view-narrow' : '') + '">' +
      (me.payments_mode === 'sim' && me.test_notices ? '<p class="notice notice-sim">This is the test version. Payments go to a practice checkout and no card is charged, and email appears in the <a href="/dev/mail" target="_blank" rel="noopener">test mailbox</a>.</p>' : '') +
      // Plan P3.4. New listing terms were published since this breeder accepted. Everything
      // stays open, and the banner stays until they accept.
      // Workplan A6. A breeder on the current terms who has not yet confirmed they are the seller
      // gets the same banner and drawer, asking only for that.
      (me.terms && me.terms.needs_accept ? (me.terms.accepted_version === me.terms.version
        ? '<div class="notice terms-banner" id="terms-banner"><p><b>Please confirm you are the seller.</b> Puppy Connection does not sell puppies, so each breeder confirms once that they sell the puppies they list.</p><button class="btn btn-sm btn-gold" id="terms-read">Read and confirm</button></div>'
        : '<div class="notice terms-banner" id="terms-banner"><p><b>The listing terms have changed.</b> Puppy Connection published a new version' +
        (me.terms.published_at ? ' on ' + esc(day(me.terms.published_at)) : '') + '. Please read it and accept it.</p><button class="btn btn-sm btn-gold" id="terms-read">Read and accept</button></div>') : '') +
      operatorBanner() + nudgeBanner() + photoBanner() + inner + '<footer class="work-foot"><a href="/privacy">Privacy</a><a href="/terms">Listing terms</a></footer></div></main></div></div>';
    $('#signout').addEventListener('click', endSession);
    var oe = $('#operator-end'); if (oe) oe.addEventListener('click', endSession);
    var tl = $('#totp-later');
    if (tl) tl.addEventListener('click', function () {
      api('POST', '/api/account/authenticator/dismiss', {}).then(function () { state.me.authenticator_nudge = false; var n = $('#totp-nudge'); if (n) n.remove(); });
    });
    var left = null; try { left = sessionStorage.getItem('pc-recovery-left'); sessionStorage.removeItem('pc-recovery-left'); } catch (x) { left = null; }
    if (left != null) toast('You signed in with a recovery code. You have ' + left + ' left.');
    var tr = $('#terms-read');
    if (tr) tr.addEventListener('click', termsDrawer);
  }

  /* Workplan A24. An operator's session says so on every screen, with the kennel, the operator and
     End, which ends the session and goes back to the admin. */
  function operatorBanner() {
    var o = state.me.operator;
    if (!o) return '';
    return '<div class="notice operator-banner" id="operator-banner" role="status"><p><b>Managing ' + esc(state.me.profile.business_name || state.me.email) +
      ' for Puppy Connection.</b> Signed in as ' + esc(o.email) + '. Every change here is recorded as yours, acting for this kennel.</p>' +
      '<button class="btn btn-sm" type="button" id="operator-end">End</button></div>';
  }
  function endSession() {
    var o = state.me && state.me.operator;
    api('POST', '/auth/signout', {}).then(function (r) {
      state.me = null;
      if (o && r && r.back) { location.href = r.back; return; }
      location.hash = '#/'; render();
    });
  }
  /* Workplan A26. Recommended, never required. Not now hides it for good, and the Account screen
     always has the set-up. */
  function nudgeBanner() {
    if (!state.me.authenticator_nudge || state.route.split('?')[0] === 'account') return '';
    return '<div class="notice" id="totp-nudge"><p><b>Add an authenticator app to your sign-in.</b> It asks for a six-digit code from your phone after your password, so a stolen password alone cannot open your kennel.</p>' +
      '<div class="btn-row"><a class="btn btn-sm btn-gold" href="#/account">Set it up</a><button class="btn btn-sm btn-quiet" type="button" id="totp-later">Not now</button></div></div>';
  }

  /* Workplan A12 and A14. Every listing that needs a new photo, and by when, at the top of each
     screen once the listings are loaded. A listing stays up while it gets a new photo at least
     every four weeks, and a listing Puppy Connection took offline for its photos is listed too. */
  function needsPhoto() {
    var out = [];
    ((state.listings && state.listings.litters) || []).forEach(function (l) {
      l.puppies.forEach(function (x) {
        if (x.publication_state === 'archived') return;
        if (x.operator_hold && x.hold_kind === 'photos') out.push({ x: x, text: 'taken offline by Puppy Connection until new photos are uploaded.' + (x.hold_reason ? ' ' + x.hold_reason : ''), order: 0 });
        else if (x.schedule && x.schedule.stage === 'warned') out.push({ x: x, text: 'add a new photo' + (x.schedule.by ? ' by ' + day(x.schedule.by) : '') + ' to keep it on the site.', order: 1, by: x.schedule.by });
        else if (x.schedule && x.schedule.stage === 'offline') out.push({ x: x, text: 'off the site. Add a new photo by ' + day(x.schedule.by) + ' and it comes back free.', order: 2, by: x.schedule.by });
      });
    });
    return out.sort(function (a, b) { return a.order - b.order || String(a.by).localeCompare(String(b.by)); });
  }
  function photoBanner() {
    var items = needsPhoto();
    if (!items.length) return '';
    return '<div class="notice photo-banner" id="photo-banner" role="status"><p><b>' + (items.length === 1 ? 'A listing needs a new photo' : items.length + ' listings need a new photo') + '</b></p>' +
      '<ul class="banner-list">' + items.map(function (i) {
        return '<li><span><b>' + esc(i.x.name) + '</b>: ' + esc(i.text) + '</span><button type="button" class="btn btn-sm btn-gold" data-photos="' + esc(i.x.id) + '">Add a photo</button></li>';
      }).join('') + '</ul></div>';
  }

  /* The current listing terms, drawn by the same rule as termsHtml in portal/legal.js. Blank lines
     separate blocks, a REPLACE THIS block is marked, "* " lines are a list and a short line with no
     closing punctuation is a heading. */
  function termsParas(body) {
    return String(body || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (para) {
      var m = /^REPLACE THIS:\s*([\s\S]*)$/.exec(para);
      if (m) return '<p class="replace-block"><b>REPLACE THIS:</b> ' + esc(m[1]) + '</p>';
      var out = [], lines = [], items = [];
      function flush() {
        if (lines.length) out.push('<p>' + lines.join('<br>') + '</p>');
        if (items.length) out.push('<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>');
        lines = []; items = [];
      }
      para.split('\n').forEach(function (raw) {
        var line = raw.trim(), li = /^\*\s+(.+)$/.exec(line);
        if (!line) return;
        if (li) { if (lines.length) flush(); items.push(esc(li[1])); }
        else if (line.length <= 80 && !/[.,:;!?"')\]]$/.test(line)) { flush(); out.push('<h2>' + esc(line) + '</h2>'); }
        else { if (items.length) flush(); lines.push(esc(line)); }
      });
      flush();
      return out.join('');
    }).join('');
  }
  // Workplan A6 (Amber and Alex, 2026-10-24). The box a breeder ticks once, with the listing terms.
  function sellerBox() {
    return '<label class="check" for="confirm-seller"><input type="checkbox" id="confirm-seller" name="confirm_seller"> I am the seller of every puppy I list. Puppy Connection does not sell puppies, and each sale is agreed between me and the buyer.</label>';
  }
  function termsDrawer() {
    var t = state.me.terms;
    var onlySeller = t.accepted_version === t.version;
    openDrawer('Listing terms', '<p class="muted small">Version ' + esc(t.version) + (t.published_at ? ', published ' + esc(day(t.published_at)) : '') + (onlySeller ? ', which you accepted' : '') + '.</p>' +
      '<div class="terms-preview">' + termsParas(t.body) + '</div>' +
      '<form id="terms-accept" novalidate>' + (t.seller_confirmed ? '' : sellerBox()) +
      '<div class="btn-row"><button class="btn btn-gold" type="submit">' + (onlySeller ? 'Confirm' : 'I accept these terms') + '</button><button class="btn btn-quiet" type="button" data-later>Not now</button></div></form>',
    function (d) {
      $('[data-later]', d).addEventListener('click', closeDrawer);
      var f = $('#terms-accept', d);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var body = { version: t.version };
        if (!t.seller_confirmed) {
          if (!formData(f).confirm_seller) return showError(f, new Error('Tick the box to confirm you are the seller of the puppies you list.'));
          body.confirm_seller = true;
        }
        api('POST', '/api/terms/accept', body).then(function (me2) { state.me = me2; closeDrawer(); toast(onlySeller ? 'Thank you. That is confirmed.' : 'Thank you. The new terms are accepted.'); render(); })
          .catch(function (err) { showError(f, err); });
      });
    });
  }

  // How long a payment lists a puppy, in words. listing_days 0 means it stays up until removed.
  function term(L) { return L.listing_days > 0 ? 'for ' + L.listing_days + ' days' : 'once, and it stays up for as long as you add a new photo at least every four weeks'; }
  function head(title, lede, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' +
      (actions ? '<div class="head-actions">' + actions + '</div>' : '') + '</div>';
  }
  function empty(title, text, action) {
    return '<div class="empty"><b>' + esc(title) + '</b>' + (text ? '<span>' + esc(text) + '</span>' : '') + (action || '') + '</div>';
  }

  // ------------------------------------------------------------ overview
  function overview() {
    var me = state.me;
    var p = me.profile;
    var filled = !!(p.business_name && (p.public_phone || p.public_email) && p.city && p.state);
    var html = head('Welcome' + (p.business_name ? ', ' + p.business_name : ''), me.status === 'pending' ? 'Four steps to your first listing. You are on step ' + (me.profile_submitted_at ? 4 : filled ? 3 : 2) + '.' : 'Your listings at a glance.');
    if (me.status === 'pending') {
      var submitted = !!me.profile_submitted_at;
      html += '<div class="card"><h2>Getting listed</h2><ol class="steps">' +
        '<li class="done"><span class="dot">1</span><div><b>Email confirmed</b><div class="muted small">You signed in with ' + esc(me.email) + '.</div></div></li>' +
        '<li class="' + (filled ? 'done' : 'now') + '"><span class="dot">2</span><div><b>Complete your profile</b><div class="muted small">Business name, a phone or email buyers can use, and your town and state.</div>' +
        (filled ? '' : '<a class="btn btn-sm" href="#/profile" style="margin-top:.4rem">Open your profile</a>') + '</div></li>' +
        '<li class="' + (submitted ? 'done' : filled ? 'now' : '') + '"><span class="dot">3</span><div><b>Name a reference, accept the listing terms and submit</b>' +
        (submitted ? '' : '<div class="muted small">One person who can confirm you are a real breeder, such as your veterinarian.</div>') +
        (submitted ? '<div class="muted small">Submitted ' + esc(day(me.profile_submitted_at)) + '.</div>' : filled ? '<a class="btn btn-sm btn-gold" href="#/profile" style="margin-top:.4rem">Submit for approval</a>' : '') + '</div></li>' +
        '<li class="' + (submitted ? 'now' : '') + '"><span class="dot">4</span><div><b>Puppy Connection approves your account</b><div class="muted small">You will get an email, and then you can add litters and puppies.</div></div></li>' +
        '</ol></div>';
      app.innerHTML = ''; shell(html, true); return;
    }
    if (me.status === 'declined') {
      shell(html + '<div class="notice notice-alert"><p><b>Your account was not approved.</b></p><p>If you think this is a mistake, reply to the email you received.</p></div>', true);
      return;
    }
    if (me.status === 'suspended') {
      html += '<div class="notice notice-alert"><p><b>Your account is paused.</b> You can see your listings, but changes and payments are on hold until Puppy Connection reinstates it.</p></div>';
    }
    loadListings().then(function (L) {
      var all = [];
      L.litters.forEach(function (l) { l.puppies.forEach(function (x) { if (x.publication_state !== 'archived') all.push(x); }); });
      var live = all.filter(function (x) { return x.is_public; }).length;
      var drafts = all.filter(function (x) { return x.publication_state === 'draft'; }).length;
      var ready = all.filter(function (x) { return !x.pay_block; }).length;
      var soon = all.filter(function (x) { return x.is_public && x.expires_at && new Date(x.expires_at) - Date.now() < 7 * 86400000; }).length;
      var placed = all.filter(function (x) { return x.availability === 'placed'; }).length;
      var views = all.reduce(function (n, x) { return n + (x.views || 0); }, 0);
      var clicks = all.reduce(function (n, x) { return n + (x.clicks || 0); }, 0);
      shell(html + '<div class="stats">' +
        '<a class="stat" href="#/litters"><b>' + live + '</b><span>Live on the site</span></a>' +
        '<a class="stat" href="#/litters"><b>' + drafts + '</b><span>Drafts</span></a>' +
        '<a class="stat" href="#/pay"><b>' + ready + '</b><span>Ready to pay for</span></a>' +
        (L.listing_days > 0 ? '<a class="stat" href="#/pay"><b>' + soon + '</b><span>Expiring within a week</span></a>' : '<a class="stat" href="#/litters"><b>' + placed + '</b><span>Placed</span></a>') + '</div>' +
        '<div class="card"><h2>' + (all.length ? 'Next steps' : 'Add your first litter') + '</h2><p>Add a litter, add each puppy with photos, then pay ' + esc(money(L.fee_cents)) + ' per puppy to list it ' + term(L) + '.</p>' +
        '<div class="btn-row"><a class="btn btn-primary" href="#/litters">Litters and puppies</a>' + (ready ? '<a class="btn btn-gold" href="#/pay">Pay to list ' + ready + '</a>' : '') +
        (me.site_url ? '<a class="btn" href="' + esc(me.site_url) + '" target="_blank" rel="noopener">See your page on the site</a>' : '') + '</div></div>' +
        (live || views ? '<div class="card"><h2>Views and clicks</h2><p>In the last 30 days buyers opened your puppies\' pages ' + plural(views, 'time') + ' and clicked through to you ' + plural(clicks, 'time') + '.</p>' +
          '<a class="btn btn-sm" href="#/stats">See each puppy</a></div>' : ''));
    });
  }

  // ------------------------------------------------------------ profile
  /* Workplan A13 (Amber, 2026-10-19). One reference who can confirm the breeder is real, asked for
     before the account is submitted for approval. Only Puppy Connection sees it. */
  function referenceFieldsHtml(me) {
    var r = me.reference || {};
    var roles = me.reference_roles || {};
    return '<fieldset class="reference"><legend>Your reference</legend>' +
      '<p class="hint">Name one person who can confirm you are a real breeder: an AKC representative, a board member of your local animal welfare council (such as ICAW), another respected breeder, or your veterinarian. Only Puppy Connection sees this.</p>' +
      '<div class="field"><label for="r-role">Who they are</label><select id="r-role" name="ref_role" required><option value="">Choose one</option>' +
      Object.keys(roles).map(function (k) { return '<option value="' + esc(k) + '"' + (r.role === k ? ' selected' : '') + '>' + esc(roles[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid-2"><div class="field"><label for="r-name">Their name</label><input id="r-name" name="ref_name" type="text" autocomplete="off" required value="' + esc(r.name || '') + '"></div>' +
      '<div class="field"><label for="r-contact">Their phone or email</label><input id="r-contact" name="ref_contact" type="text" autocomplete="off" required value="' + esc(r.contact || '') + '"></div></div></fieldset>';
  }
  function referenceBody(d) { return { name: d.ref_name, role: d.ref_role, contact: d.ref_contact }; }

  function profile() {
    var me = state.me, p = me.profile;
    var editable = me.status === 'pending' || me.status === 'approved';
    var dis = editable ? '' : ' disabled';
    function f(name, label, type, hint, attrs) {
      return '<div class="field"><label for="f-' + name + '">' + esc(label) + '</label><input id="f-' + name + '" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(p[name] || '') + '"' + dis + (attrs || '') + '>' + (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + '</div>';
    }
    var html = head('Your profile', 'This is what buyers see on your breeder page. Your sign-in email (' + esc(me.email) + ') stays private.' + (me.site_url ? ' Changes show on your page within a few minutes.' : '')) +
      '<form id="profile" class="card" novalidate><input type="hidden" name="version" value="' + esc(p.version) + '">' +
      f('business_name', 'Business name', 'text', null, ' required') +
      '<div class="grid-2">' + f('public_phone', 'Phone buyers can call', 'tel') + f('public_email', 'Email buyers can write to', 'email') + '</div>' +
      '<div class="grid-2">' + f('city', 'Town or city') + f('state', 'State') + '</div>' +
      '<p class="hint" style="margin-top:-.4rem">Town and state only. Your street address is never shown.</p>' +
      f('website_url', 'Your website', 'url', 'Optional. Starts with https://') +
      f('contact_name', 'Contact name', 'text', 'Private, for Puppy Connection only.') +
      '<div class="field"><label for="f-description">About your kennel</label><textarea id="f-description" name="description"' + dis + '>' + esc(p.description || '') + '</textarea><div class="hint">A few short paragraphs. Leave a blank line between them.</div></div>' +
      (editable ? '<button class="btn btn-primary" type="submit">Save profile</button>' : '') + '</form>' +
      '<div id="extras-slot"></div>';
    if (me.status === 'pending' && !me.profile_submitted_at) {
      html += '<form id="submit" class="card" novalidate><h2>Submit for approval</h2>' + referenceFieldsHtml(me) +
        // Plan P3.4. The current terms, as published on the admin's Terms screen.
        '<div class="terms-preview">' + termsParas(me.terms ? me.terms.body : '') + '</div>' +
        '<p class="hint">Version ' + esc(me.terms_version) + '. <a href="/terms" target="_blank" rel="noopener">Open the listing terms page</a>.</p>' +
        '<label class="check" for="accept-terms"><input type="checkbox" id="accept-terms" name="accept_terms"> I have read and accept the <a href="/terms" target="_blank" rel="noopener">listing terms</a>.</label>' +
        (me.seller_confirmed_at ? '' : sellerBox()) +
        '<div class="btn-row"><button class="btn btn-gold" type="submit">Submit for approval</button></div></form>';
    } else if (me.status === 'pending') {
      html += '<p class="notice">Submitted ' + esc(day(me.profile_submitted_at)) + '. Puppy Connection will email you when it is approved.</p>' +
        // Workplan A13. A breeder who submitted before references were asked for adds one here.
        '<form id="reference" class="card" novalidate><h2>' + (me.reference ? 'Your reference' : 'Add a reference') + '</h2>' + referenceFieldsHtml(me) +
        '<div class="btn-row"><button class="btn btn-primary" type="submit">Save reference</button></div></form>';
    }
    shell(html, true);
    loadBreeds().then(function () { extras(editable); });
    var pf = $('#profile');
    if (editable) pf.addEventListener('submit', function (e) {
      e.preventDefault();
      api('PUT', '/api/profile', formData(pf)).then(function (me2) { state.me = me2; toast('Profile saved'); profile(); }).catch(function (err) { showError(pf, err); });
    });
    var sf = $('#submit');
    if (sf) sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(sf);
      if (!d.accept_terms) return showError(sf, new Error('Tick the box to accept the listing terms.'));
      if (!me.seller_confirmed_at && !d.confirm_seller) return showError(sf, new Error('Tick the box to confirm you are the seller of the puppies you list.'));
      api('POST', '/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: referenceBody(d) }).then(function (me2) { state.me = me2; toast('Submitted for approval'); location.hash = '#/'; })
        .catch(function (err) { showError(sf, err); });
    });
    var rf = $('#reference');
    if (rf) rf.addEventListener('submit', function (e) {
      e.preventDefault();
      api('POST', '/api/profile/reference', referenceBody(formData(rf))).then(function (me2) { state.me = me2; toast('Reference saved'); profile(); })
        .catch(function (err) { showError(rf, err); });
    });
  }

  /* Plan P2.3. The optional extras on the breeder page: a logo, one kennel photo, the breeds
     they raise and a Facebook page. Images go through the same in-browser shrink as puppy
     photos and upload as soon as they are chosen. */
  function extras(editable) {
    var slot = $('#extras-slot');
    if (!slot) return;
    var x = state.me.extras || { breeds: [] };
    var dis = editable ? '' : ' disabled';
    var mine = {}; x.breeds.forEach(function (b) { mine[b.id] = true; });
    function pic(kind, label, url, hint) {
      return '<div class="brand-slot" data-kind="' + kind + '"><b>' + esc(label) + '</b>' +
        (url ? '<img src="' + esc(url) + '&size=card" alt="' + esc(label) + '">' : '<div class="brand-empty">None yet</div>') +
        '<div class="hint">' + esc(hint) + '</div>' +
        (editable ? '<div class="btn-row"><label class="btn btn-sm" for="in-' + kind + '">' + (url ? 'Replace' : 'Upload') + '</label>' +
          '<input id="in-' + kind + '" type="file" accept="image/*" hidden>' + (url ? '<button type="button" class="btn btn-sm btn-quiet" data-unbrand="' + kind + '">Remove</button>' : '') + '</div>' : '') +
        '<p class="error" hidden></p></div>';
    }
    slot.innerHTML = '<section class="card" id="extras"><h2>Extras for your page</h2><p class="muted small">All optional.</p>' +
      '<div class="brand-grid">' + pic('logo', 'Logo', x.logo_url, 'Shown on your breeder page.') + pic('kennel', 'Kennel photo', x.kennel_url, 'One photo of your home, kennel or family with the dogs.') + '</div>' +
      '<form id="extras-form" novalidate><fieldset class="breed-picks"><legend>Breeds you raise</legend>' + state.breeds.map(function (b) {
        return '<label class="check"><input type="checkbox" name="breed" value="' + esc(b.id) + '"' + (mine[b.id] ? ' checked' : '') + dis + '> ' + esc(b.name) + '</label>';
      }).join('') + '</fieldset>' +
      '<div class="field"><label for="f-facebook">Facebook page</label><input id="f-facebook" name="facebook_url" type="url" value="' + esc(x.facebook_url || '') + '" placeholder="https://www.facebook.com/yourkennel"' + dis + '>' +
      '<div class="hint">Optional. The address of your kennel\'s Facebook page.</div></div>' +
      (editable ? '<button class="btn btn-primary" type="submit">Save extras</button>' : '') + '</form></section>';
    // Alex, 2026-10-31. A find box over the breeds, with the ticked ones first and always shown.
    if (window.PCPicker) window.PCPicker.checks($('#extras-form .breed-picks'), { label: 'Find a breed', none: 'No other breed matches that' });
    if (!editable) return;
    var form = $('#extras-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = $$('input[name=breed]:checked', form).map(function (c) { return c.value; });
      api('PUT', '/api/profile/extras', { facebook_url: $('#f-facebook').value, breed_ids: ids })
        .then(function (me2) { state.me = me2; toast('Extras saved'); profile(); }).catch(function (err) { showError(form, err); });
    });
    $$('.brand-slot', slot).forEach(function (box) {
      var kind = box.dataset.kind, input = $('input[type=file]', box), err = $('.error', box);
      function done(msg) { return api('GET', '/api/me').then(function (me2) { state.me = me2; toast(msg); profile(); }); }
      if (input) input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        err.hidden = true;
        var fb = fileBusy(input, 'Uploading…');
        shrink(file).then(function (s) {
          return api('POST', '/api/profile/' + kind, undefined, s.full).then(function () {
            if (s.card) return api('POST', '/api/profile/' + kind + '/card', undefined, s.card).catch(function () {});
          });
        }).then(function () { return done(kind === 'logo' ? 'Logo saved' : 'Kennel photo saved'); })
          .catch(function (e2) { err.hidden = false; err.textContent = e2.message; })
          .then(fb.done);
      });
      var rm = $('[data-unbrand]', box);
      if (rm) rm.addEventListener('click', function () {
        if (!confirm(kind === 'logo' ? 'Remove your logo?' : 'Remove your kennel photo?')) return;
        api('DELETE', '/api/profile/' + kind).then(function () { return done(kind === 'logo' ? 'Logo removed' : 'Kennel photo removed'); })
          .catch(function (e2) { err.hidden = false; err.textContent = e2.message; });
      });
    });
  }

  // ------------------------------------------------------------ litters and puppies
  function loadListings() {
    return api('GET', '/api/listings').then(function (L) { state.listings = L; return L; });
  }
  function loadBreeds() {
    if (state.breeds.length) return Promise.resolve(state.breeds);
    return api('GET', '/api/breeds').then(function (b) { state.breeds = b; return b; });
  }
  // Alex, 2026-10-31. Every breed select takes a typed search (combo.js), since the list grows to
  // about 330. The select stays the form's control, and without combo.js it works as before.
  function breedSearch(sel) { if (sel && window.PCPicker) window.PCPicker.select(sel, { none: 'No breed matches that' }); }

  // End dates and renewals exist only when listings expire (listing_days above 0, plan D8).
  function expiring() { return !!(state.listings && state.listings.listing_days > 0); }

  function puppyChips(x) {
    var chips = [];
    if (x.publication_state === 'archived') chips.push('<span class="pill">Removed</span>');
    else if (x.is_public) chips.push('<span class="pill pill-ok">' + (expiring() && x.expires_at ? 'Listed until ' + esc(day(x.expires_at)) : 'Listed') + '</span>');
    else if (x.inactive_stage === 'offline') chips.push('<span class="pill pill-warn">Offline, needs a photo</span>');
    else if (x.inactive_stage === 'removed') chips.push('<span class="pill pill-warn">Removed, can relist</span>');
    else if (x.publication_state === 'expired') chips.push('<span class="pill pill-warn">Listing ended</span>');
    else if (x.publication_state === 'published') chips.push('<span class="pill pill-warn">Paid, not showing</span>');
    else if (!x.pay_block) chips.push('<span class="pill pill-gold">Draft, ready to pay for</span>');
    else chips.push('<span class="pill">Draft</span>');
    if (x.operator_hold) chips.push('<span class="pill pill-alert">' + (x.hold_kind === 'photos' ? 'Offline until new photos' : 'Paused by Puppy Connection') + '</span>');
    if (x.held_by) chips.push('<span class="pill pill-gold">In checkout</span>');
    if (x.availability !== 'available') chips.push('<span class="pill">' + (x.availability === 'placed' ? 'Placed' : 'Pending') + '</span>');
    return chips.join('');
  }

  /* Plan P2.1. Where a puppy stands, in one sentence a breeder can act on. A draft names
     exactly what it still needs before it can be paid for, from the server's own check. */
  function standing(x) {
    var L = state.listings || {};
    var fee = money(L.fee_cents);
    if (x.publication_state === 'archived') return { tone: '', text: 'Removed from your listings.' };
    if (x.operator_hold && x.hold_kind === 'photos') return { tone: 'alert', text: 'Taken off the site by Puppy Connection until new photos are uploaded.' + (x.hold_reason ? ' ' + x.hold_reason : '') + ' Upload a photo that meets the photo standard and it comes back on its own.', photos: true };
    if (x.operator_hold) return { tone: 'alert', text: 'Paused by Puppy Connection, so it is off the site for now. Contact Puppy Connection to restore it.' };
    if (x.held_by) return { tone: 'gold', text: 'In checkout. A payment has started and not finished. If it is not finished, the puppy is free to pay for again within the hour.' };
    var place = x.availability === 'placed' ? ' Buyers see it marked placed.' : x.availability === 'pending' ? ' Buyers see it marked pending.' : '';
    if (x.is_public && x.schedule && x.schedule.stage === 'warned') {
      return { tone: 'gold', text: 'Listed, and it needs a new photo. Add one' + (x.schedule.by ? ' by ' + day(x.schedule.by) : '') + ' to keep it on the site.' + place, photos: true };
    }
    if (x.is_public) {
      var until = expiring() && x.expires_at ? ' until ' + day(x.expires_at) : '';
      var renew = expiring() && !x.pay_block ? ' Renewal is open now.' : '';
      return { tone: 'ok', text: 'Listed on the site' + until + '.' + place + renew, renew: expiring() && !x.pay_block, plain: !until && !place && !renew };
    }
    if (x.inactive_stage === 'offline') {
      return { tone: 'warn', text: 'Off the site because it had no new photo for six weeks. Add a new photo by ' + day(x.schedule && x.schedule.by) + ' and it comes straight back, free.', photos: true };
    }
    if (x.inactive_stage === 'removed') {
      return { tone: 'warn', text: 'Removed from the site after twelve weeks with no new photo. Everything is kept, so you can relist it for ' + fee + ' without entering it again.' +
        (x.pay_block ? ' Before it can be relisted, it needs ' + ((x.needs && x.needs.length) ? x.needs.join(' and ') : 'attention') + '.' : ''), relist: !x.pay_block, photos: !!x.pay_block };
    }
    if (x.publication_state === 'expired') return { tone: 'warn', text: 'The listing ended' + (x.expires_at ? ' on ' + day(x.expires_at) : '') + '. Renew it for ' + fee + ' to put it back on the site.', renew: !x.pay_block };
    if (x.publication_state === 'published') return { tone: 'warn', text: 'Paid for, but not showing on the site right now, because your account is paused.' };
    if (!x.pay_block) return { tone: 'gold', text: 'Ready to list for ' + fee + '.' + place, pay: true };
    var needs = (x.needs && x.needs.length) ? 'Before it can be paid for, it needs ' + x.needs.join(' and ') + '.' : x.pay_block;
    return { tone: '', text: needs };
  }
  /* Alex, 2026-10-31. Littermates share a mom, a dad and a birth date. A puppy in the wrong litter moves to
     another litter of the same breed, or to a new one of its own, keeping its photos and documents. */
  function moveBox(x) {
    var here = findLitter(x.litter_id);
    if (!here) return '';
    var others = (state.listings.litters || []).filter(function (l) { return !l.archived_at && l.id !== here.id && l.breed_id === here.breed_id; });
    var label = function (l) {
      var mom = l.mom_id ? parentName(l.mom_id) : '', dad = l.dad_id ? parentName(l.dad_id) : '';
      return (l.born_on ? 'Born ' + day(l.born_on) : 'No birth date') + (mom || dad ? ', ' + [mom, dad].filter(Boolean).join(' and ') : ', no parents picked') + ', ' + plural(l.puppies.filter(function (p) { return p.publication_state !== 'archived'; }).length, 'puppy', 'puppies');
    };
    return '<details class="move-litter"><summary>Not in the right litter?</summary>' +
      '<form id="move-litter" class="dsec-line" novalidate><div class="field" style="margin:0"><label for="move-to">Move ' + esc(x.name) + ' to</label><select id="move-to"><option value="">Choose a litter</option>' +
      others.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(label(l)) + '</option>'; }).join('') +
      '<option value="new">A new litter of its own (same breed and dates)</option></select></div>' +
      '<button class="btn btn-sm btn-act" type="submit">Move</button></form>' +
      '<p class="hint">Littermates share a mom, a dad and a birth date. Photos and documents move with the puppy.</p></details>';
  }
  /* Alex, 2026-10-31. The next step for a saved puppy that can be listed, at the foot of its form. */
  function payNext(x) {
    var s = standing(x), fee = money((state.listings && state.listings.fee_cents) || 0);
    if (!s.pay && !s.renew) return '';
    return '<div class="pay-next"><p><b>' + esc(x.name) + (s.renew ? ' can be renewed.' : ' is ready to list.') + '</b> ' +
      (s.renew ? 'Renew to keep the listing on the site.' : 'Pay now, or add the rest of the litter first and pay for them together.') + '</p>' +
      '<a class="btn btn-gold" data-pay-next href="#/pay?p=' + esc(x.id) + '">' + (s.renew ? 'Renew ' : 'Pay to list ') + esc(x.name) + (fee ? ', ' + esc(fee) : '') + '</a></div>';
  }
  function standingLine(x) {
    var s = standing(x);
    // The Listed pill already says it all for a plain listing, so the line is left out.
    if (s.plain) return '';
    return '<div class="standing' + (s.tone ? ' standing-' + s.tone : '') + '">' + esc(s.text) +
      (s.pay ? ' <a href="#/pay">Pay to list</a>' : s.renew ? ' <a href="#/pay">Renew</a>' : '') +
      (s.photos ? ' <button type="button" class="btn btn-sm btn-gold" data-photos="' + esc(x.id) + '">Add a photo</button>' : '') +
      (s.relist ? ' <button type="button" class="btn btn-sm btn-primary" data-relist="' + esc(x.id) + '">Relist for ' + esc(money((state.listings || {}).fee_cents)) + '</button>' : '') + '</div>';
  }

  function litters() {
    var me = state.me;
    var canEdit = me.status === 'approved';
    Promise.all([loadListings(), loadBreeds()]).then(function (res) {
      var L = res[0];
      var active = L.litters.filter(function (l) { return !l.archived_at; });
      var html = head('Litters and puppies', 'Each litter holds its puppies. Add photos to a puppy, then pay to list it.', canEdit ? '<button class="btn btn-primary" id="add-litter">Add a litter</button>' : '');
      if (!canEdit) html += '<p class="notice">' + (me.status === 'suspended' ? 'Your account is paused, so this is read only.' : 'Litters open once your account is approved.') + '</p>';
      if (!active.length) html += '<div class="card">' + empty('No litters yet', canEdit ? 'Start with a litter, then add each puppy to it.' : '', canEdit ? '<button class="btn btn-primary" data-first-litter>Add a litter</button>' : '') + '</div>';
      // Alex, 2026-10-31. Find a puppy by name, breed, color or sex, and narrow by status, for kennels with many puppies.
      var total = active.reduce(function (n, l) { return n + l.puppies.filter(function (x) { return x.publication_state !== 'archived'; }).length; }, 0);
      if (total > 1) html += '<div class="pup-search"><label class="sr" for="pup-q">Find a puppy</label><input id="pup-q" type="search" placeholder="Find a puppy by name, breed, color or sex" autocomplete="off">' +
        '<label class="sr" for="pup-st">Show</label><select id="pup-st"><option value="">All puppies</option><option value="available">Available</option><option value="pending">Pending</option><option value="placed">Placed</option>' +
        '<option value="listed">On the site</option><option value="unlisted">Not on the site</option></select><span class="muted small" id="pup-count" aria-live="polite"></span></div>';
      active.forEach(function (l) {
        var pups = l.puppies.filter(function (x) { return x.publication_state !== 'archived'; });
        html += '<section class="card" data-litter-card aria-label="' + esc(l.breed_name) + ' litter"><div class="card-head"><div><h2>' + esc(l.breed_name) + '</h2>' +
          '<div class="muted small">' + (l.born_on ? 'Born ' + esc(day(l.born_on)) : 'Birth date not set') + (l.ready_on ? ', ready ' + esc(day(l.ready_on)) : '') +
          (l.mom_weight_lb || l.dad_weight_lb ? '. Parents ' + (l.mom_weight_lb ? esc(l.mom_weight_lb) + ' lb mom' : '') + (l.mom_weight_lb && l.dad_weight_lb ? ', ' : '') + (l.dad_weight_lb ? esc(l.dad_weight_lb) + ' lb dad' : '') : '') +
          // Workplan A19. The saved mom and dad, by name.
          (l.mom_id || l.dad_id ? '. ' + [l.mom_id ? 'Mom ' + esc(parentName(l.mom_id)) : '', l.dad_id ? 'Dad ' + esc(parentName(l.dad_id)) : ''].filter(Boolean).join(', ') : '') + '</div></div>' +
          (canEdit ? '<div class="btn-row" style="margin:0"><button class="btn btn-sm" data-edit-litter="' + esc(l.id) + '">Edit litter</button><button class="btn btn-sm" data-add-many="' + esc(l.id) + '">Add several</button><button class="btn btn-sm btn-primary" data-add-puppy="' + esc(l.id) + '">Add a puppy</button></div>' : '') + '</div>' +
          (pups.length ? '<div class="puppy-grid">' + pups.map(function (x) {
            var img = x.photos[0] ? '<img class="thumb" src="' + esc(cardUrl(x.photos[0].url)) + '" alt="">' : '<div class="thumb-empty">No photo</div>';
            var live = x.availability === 'placed' ? ['available', 'Mark available'] : ['placed', 'Mark placed'];
            return '<div class="puppy-card" data-q="' + esc([x.name, l.breed_name, x.color, x.sex].filter(Boolean).join(' ').toLowerCase()) + '" data-st="' + esc(x.availability + ' ' + (x.is_public ? 'listed' : 'unlisted')) + '"><div class="pc-top">' + img + '<div class="meta"><b>' + esc(x.name) + '</b><span class="muted small">' + (x.price_cents == null ? 'No price yet' : esc(money(x.price_cents))) +
              (x.sex ? ', ' + esc(x.sex) : '') + (x.color ? ', ' + esc(x.color) : '') + '. ' + plural(x.photos.length, 'photo') +
              (x.is_public ? '. ' + plural(x.views || 0, 'view') + ', ' + plural(x.clicks || 0, 'click') + ' in 30 days' : '') + '</span>' +
              '<div class="chips">' + puppyChips(x) + '</div></div>' +
              '<button class="btn btn-sm" data-edit-puppy="' + esc(x.id) + '">' + (canEdit ? 'Edit' : 'View') + '</button></div>' + standingLine(x) +
              '<div class="row-actions">' +
              (canEdit && (x.is_public || x.availability !== 'available') ? '<button class="btn btn-sm btn-quiet" data-avail="' + esc(x.id) + '" data-to="' + live[0] + '">' + live[1] + '</button>' : '') +
              (canEdit ? '<button class="btn btn-sm btn-quiet" data-dup="' + esc(x.id) + '">Duplicate</button>' : '') +
              (x.site_url ? '<a class="btn btn-sm btn-quiet" href="' + esc(x.site_url) + '" target="_blank" rel="noopener">View on the site</a>' : '') + '</div></div>';
          }).join('') + '</div>' : '<p class="muted small">No puppies in this litter yet.</p>') + '</section>';
      });
      shell(html);
      var pq = $('#pup-q'), pst = $('#pup-st');
      function findPups() {
        var words = String(pq.value || '').toLowerCase().split(/\s+/).filter(Boolean), st = pst.value, shown = 0, on = words.length || st;
        state.pupFilter = { q: pq.value, st: st };
        $$('[data-litter-card]').forEach(function (sec) {
          var any = false;
          $$('.puppy-card', sec).forEach(function (c) {
            var ok = words.every(function (w) { return c.dataset.q.indexOf(w) >= 0; }) && (!st || (' ' + c.dataset.st + ' ').indexOf(' ' + st + ' ') >= 0);
            c.hidden = !ok; if (ok) { any = true; shown += 1; }
          });
          sec.hidden = on && !any;
        });
        $('#pup-count').textContent = on ? (shown ? plural(shown, 'puppy', 'puppies') + ' found' : 'No puppy matches') : '';
      }
      if (pq) {
        if (state.pupFilter) { pq.value = state.pupFilter.q || ''; pst.value = state.pupFilter.st || ''; findPups(); }
        pq.addEventListener('input', findPups); pst.addEventListener('change', findPups);
      }
      $$('#add-litter, [data-first-litter]').forEach(function (b) { b.addEventListener('click', function () { litterDrawer(null); }); });
      $$('[data-edit-litter]').forEach(function (b) { b.addEventListener('click', function () { litterDrawer(findLitter(b.dataset.editLitter)); }); });
      $$('[data-add-puppy]').forEach(function (b) { b.addEventListener('click', function () { puppyDrawer(null, b.dataset.addPuppy); }); });
      $$('[data-edit-puppy]').forEach(function (b) { b.addEventListener('click', function () { puppyDrawer(findPuppy(b.dataset.editPuppy)); }); });
      $$('[data-add-many]').forEach(function (b) { b.addEventListener('click', function () { manyDrawer(findLitter(b.dataset.addMany)); }); });
      // Workplan A12. #/litters?photos=<puppy> opens that puppy at its photos. The reminder emails
      // and the banner link here. The address goes back to #/litters without a second render.
      var want = /(?:^|&)photos=([\w-]+)/.exec(state.route.split('?')[1] || '');
      if (want && findPuppy(want[1])) {
        history.replaceState(null, '', '#/litters');
        state.route = 'litters';
        puppyDrawer(findPuppy(want[1]));
        var sec = $('#photo-step');
        if (sec) { sec.scrollIntoView({ block: 'start' }); var lab = $('label[for=ph-input]', sec); if (lab) lab.focus(); }
      }
      // Plan P2.4. Placed or available straight from the list, and a copy of a puppy in one press.
      $$('[data-avail]').forEach(function (b) {
        b.addEventListener('click', function () {
          var x = findPuppy(b.dataset.avail);
          b.disabled = true;
          api('PUT', '/api/puppies/' + x.id + '/availability', { availability: b.dataset.to, version: x.version })
            .then(function () { toast(x.name + (b.dataset.to === 'placed' ? ' marked placed' : ' marked available')); litters(); })
            .catch(function (err) { b.disabled = false; toast(err.message); });
        });
      });
      $$('[data-dup]').forEach(function (b) {
        b.addEventListener('click', function () {
          var x = findPuppy(b.dataset.dup);
          b.disabled = true;
          api('POST', '/api/puppies/' + x.id + '/duplicate', {})
            .then(function (r) { toast('Copied ' + x.name + '. Add its photos next.'); return loadListings().then(function () { litters(); puppyDrawer(findPuppy(r.id)); }); })
            .catch(function (err) { b.disabled = false; toast(err.message); });
        });
      });
    });
  }

  /* Plan P2.4. A whole litter in one step. Each puppy gets a plain name to change later, and
     the shared price, deposit and color can be changed puppy by puppy afterwards. */
  function manyDrawer(l) {
    function n(name, label) {
      return '<div class="field"><label for="m-' + name + '">' + esc(label) + '</label><input id="m-' + name + '" name="' + name + '" type="number" min="0" max="15" step="1" inputmode="numeric" value=""></div>';
    }
    openDrawer('Add several puppies',
      '<p class="muted small">' + esc(l.breed_name) + ' litter. Puppies are named Girl 1, Boy 1 or Puppy 1 and so on, and you can rename each one and add its photos afterwards.</p>' +
      '<form id="many" novalidate><div class="grid-3">' + n('girls', 'Girls') + n('boys', 'Boys') + n('unknown', 'Not sure yet') + '</div>' +
      '<div class="grid-2"><div class="field"><label for="m-price">Price for each ($)</label><input id="m-price" name="price" type="text" inputmode="decimal"></div>' +
      '<div class="field"><label for="m-dep">Deposit for each ($)</label><input id="m-dep" name="deposit" type="text" inputmode="decimal"></div></div>' +
      colorField('m', '', breedOfLitter(l.id), '', 'Optional. Leave it blank if the colors differ.') +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Add puppies</button></div></form>',
      function (d) {
        var form = $('#many', d);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          api('POST', '/api/litters/' + l.id + '/puppies', body)
            .then(function (r) { closeDrawer(); toast(plural(r.ids.length, 'puppy', 'puppies') + ' added. Add photos to each one next.'); litters(); })
            .catch(function (err) { showError(form, err); });
        });
      });
  }

  function findLitter(id) { return state.listings.litters.filter(function (l) { return l.id === id; })[0]; }
  function findPuppy(id) {
    var out = null;
    state.listings.litters.forEach(function (l) { l.puppies.forEach(function (x) { if (x.id === id) out = x; }); });
    return out;
  }

  // Workplan A19. The saved moms and dads to pick from. A removed one stays on a litter that has it.
  function parentName(id) { var p = ((state.listings && state.listings.parents) || []).filter(function (x) { return x.id === id; })[0]; return p ? p.name : ''; }
  function parentPickers(l) {
    var all = (state.listings && state.listings.parents) || [];
    function pick(col, sex, label) {
      var cur = l ? l[col] : '';
      var opts = all.filter(function (p) { return p.sex === sex && (!p.archived_at || p.id === cur); });
      return '<div class="field"><label for="l-' + col + '">' + label + '</label><select id="l-' + col + '" name="' + col + '"><option value="">Not chosen</option>' +
        opts.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === cur ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>';
    }
    return '<div class="grid-2">' + pick('mom_id', 'female', 'Mom') + pick('dad_id', 'male', 'Dad') + '</div>' +
      '<p class="hint" style="margin:-.4rem 0 1rem">' + (all.length ? 'Families see both parents on every puppy page. ' : 'Save each mom and dad once, then pick them here. ') + '<a href="#/parents">Moms and dads</a></p>';
  }

  function litterDrawer(l) {
    var opts = state.breeds.map(function (b) { return '<option value="' + esc(b.id) + '"' + (l && l.breed_id === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('');
    openDrawer(l ? 'Edit litter' : 'Add a litter',
      '<form id="litter" novalidate>' + (l ? '<input type="hidden" name="version" value="' + esc(l.version) + '">' : '') +
      '<div class="field"><label for="l-breed">Breed</label><select id="l-breed" name="breed_id" required><option value="">Choose a breed</option>' + opts + '</select></div>' +
      '<div class="grid-2"><div class="field"><label for="l-born">Born</label><input id="l-born" name="born_on" type="date" value="' + esc(l ? l.born_on : '') + '"></div>' +
      '<div class="field"><label for="l-ready">Ready to go home</label><input id="l-ready" name="ready_on" type="date" value="' + esc(l ? l.ready_on : '') + '"></div></div>' +
      '<div class="grid-2"><div class="field"><label for="l-mom">Mom\'s weight (lb)</label><input id="l-mom" name="mom_weight_lb" type="number" min="0" step="0.1" value="' + esc(l ? l.mom_weight_lb : '') + '"></div>' +
      '<div class="field"><label for="l-dad">Dad\'s weight (lb)</label><input id="l-dad" name="dad_weight_lb" type="number" min="0" step="0.1" value="' + esc(l ? l.dad_weight_lb : '') + '"></div></div>' +
      parentPickers(l) +
      '<div class="field"><label for="l-desc">About this litter</label><textarea id="l-desc" name="description">' + esc(l ? l.description : '') + '</textarea></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (l ? 'Save litter' : 'Add litter') + '</button>' +
      (l ? '<button class="btn btn-danger" type="button" id="archive-litter">Remove litter</button>' : '') + '</div></form>',
      function (d) {
        var form = $('#litter', d);
        breedSearch($('#l-breed', d));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          (l ? api('PUT', '/api/litters/' + l.id, body) : api('POST', '/api/litters', body))
            .then(function () { closeDrawer(); toast(l ? 'Litter saved' : 'Litter added'); litters(); })
            .catch(function (err) { showError(form, err); });
        });
        var ar = $('#archive-litter', d);
        if (ar) ar.addEventListener('click', function () {
          if (!confirm('Remove this litter and every puppy in it from your listings? Placed puppies leave the site with it.')) return;
          api('POST', '/api/litters/' + l.id + '/archive', {}).then(function () { closeDrawer(); toast('Litter removed'); litters(); }).catch(function (err) { showError(form, err); });
        });
      });
  }

  // The breed's suggested colors and coat types (migrations/0009), offered in the editor. A breeder
  // can still type any color; the coat choice appears only for breeds with more than one coat.
  function breedOfLitter(id) {
    var lit = ((state.listings && state.listings.litters) || []).filter(function (l) { return l.id === id; })[0];
    return lit ? state.breeds.filter(function (b) { return b.id === lit.breed_id; })[0] || null : null;
  }
  function colorField(idp, value, br, dis, hint) {
    var opts = br && br.colors && br.colors.length ? br.colors : [];
    return '<div class="field"><label for="' + idp + '-color">Color</label><input id="' + idp + '-color" name="color" type="text" autocomplete="off"' +
      (opts.length ? ' list="' + idp + '-colors"' : '') + ' value="' + esc(value || '') + '"' + (dis || '') + '>' +
      (opts.length ? '<datalist id="' + idp + '-colors">' + opts.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' : '') +
      '<div class="hint">' + (hint || (opts.length ? 'Pick a suggestion or type your own.' : 'Optional.')) + '</div></div>';
  }
  function coatField(value, br, dis) {
    if (!br || !br.coats || !br.coats.length) return '';
    var opts = br.coats.slice();
    if (value && opts.indexOf(value) < 0) opts.push(value);
    return '<div class="field"><label for="p-coat">Coat type</label><select id="p-coat" name="coat"' + (dis || '') + '><option value="">Not set</option>' +
      opts.map(function (c) { return '<option' + (c === value ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>';
  }

  /* Alex, 2026-10-31. One page for a new puppy, mom or dad: the photo and document sections sit
     beside the fields from the start. Choosing a file on a record that is not saved yet saves it
     first, then the drawer reopens as the saved record and the same file goes up through the
     normal upload, so there is no second step to find. */
  var pendingUpload = null;
  function saveFirstUploads(d, form) {
    $$('.d-side input[type=file], .new-uploads input[type=file]', d).forEach(function (input) {
      input.addEventListener('change', function () {
        var files = Array.prototype.slice.call(input.files || []);
        if (!files.length) return;
        var own = input.closest('form'), fields = {};
        if (own && own !== form) $$('select, input[type=text], input[type=radio]:checked', own).forEach(function (el) { if (el.name) fields[el.name] = el.value; });
        pendingUpload = { sel: '#' + input.id, files: files, fields: fields };
        if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });
  }
  function carryUpload(d) {
    var p = pendingUpload; pendingUpload = null;
    if (!p) return;
    var input = $(p.sel, d);
    if (!input) return;
    var own = input.closest('form');
    if (own) Object.keys(p.fields).forEach(function (k) {
      $$('[name="' + k + '"]', own).forEach(function (el) { if (el.type === 'radio') el.checked = el.value === p.fields[k]; else el.value = p.fields[k]; });
    });
    try {
      var dt = new DataTransfer(); p.files.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    } catch (e) { toast('Saved. Choose the file again to upload it.'); }
  }
  var NEW_UPLOAD_NOTE = '<p class="hint new-upload-note">Choosing a photo or document saves what you have entered first.</p>';

  /* Alex, 2026-10-31, after the Wix listing form: what a puppy comes with, ticked from a list rather
     than typed line by line, with a box for anything else. Saved as the same list as before. */
  var INCLUDE_GROUPS = [
    ['Health', ['Veterinary exam', 'Health certificate', 'Health guarantee', 'Current vaccinations', 'Dewormed', 'Microchipped', 'Parents health tested', 'Genetic (DNA) testing']],
    ['Registration and lines', ['Registered', 'Registrable', 'Pedigree', 'Champion bloodline', 'Champion sired', 'Show quality']],
    ['Goes home with', ['Puppy starter kit', 'Food sample', 'Blanket or toy with the litter scent', 'Crate training started', 'Potty training started', 'Raised with children', 'Raised with other pets']],
    ['Pickup and delivery', ['Available for on-site pickup', 'Available for local delivery', 'Available for shipping']],
  ];
  function includesField(list, dis) {
    var known = {}, picked = {};
    INCLUDE_GROUPS.forEach(function (g) { g[1].forEach(function (o) { known[o.toLowerCase()] = o; }); });
    var other = [];
    (list || []).forEach(function (v) { var k = known[String(v).toLowerCase()]; if (k) picked[k] = true; else other.push(v); });
    return '<fieldset class="field includes-field"><legend>Comes with</legend><div class="includes-groups">' + INCLUDE_GROUPS.map(function (g) {
      return '<div class="includes-group"><p class="includes-title">' + esc(g[0]) + '</p>' + g[1].map(function (o) {
        return '<label class="check"><input type="checkbox" name="inc" value="' + esc(o) + '"' + (picked[o] ? ' checked' : '') + dis + '><span>' + esc(o) + '</span></label>';
      }).join('') + '</div>';
    }).join('') + '</div>' +
      '<div class="field" style="margin:.6rem 0 0"><label for="p-inc">Anything else</label><textarea id="p-inc" name="includes" style="min-height:60px"' + dis + '>' + esc(other.join('\n')) + '</textarea><div class="hint">One item per line.</div></div></fieldset>';
  }

  function puppyDrawer(x, litterId) {
    var canEdit = state.me.status === 'approved';
    var dis = canEdit ? '' : ' disabled';
    var br = breedOfLitter(x ? x.litter_id : litterId);
    function seg(val) {
      return '<div class="seg" role="group" aria-label="Status">' + [['available', 'Available'], ['pending', 'Pending'], ['placed', 'Placed']].map(function (o) {
        return '<button type="button" data-av="' + o[0] + '" class="' + ((x ? x.availability : 'available') === o[0] ? 'on' : '') + '" aria-pressed="' + ((x ? x.availability : 'available') === o[0]) + '"' + dis + '>' + o[1] + '</button>';
      }).join('') + '</div><input type="hidden" name="availability" value="' + esc(x ? x.availability : 'available') + '">';
    }
    openDrawer(x ? x.name : 'Add a puppy',
      (x ? '<div class="chips">' + puppyChips(x) + '</div>' + standingLine(x) +
        (x.site_url ? '<p class="small" style="margin:.4rem 0 0"><a href="' + esc(x.site_url) + '" target="_blank" rel="noopener">View ' + esc(x.name) + ' on the site</a></p>' : '') +
        (x.is_public ? '<p class="hint" style="margin:.4rem 0 0">Changes you save here, photos included, show on the site within a few minutes.</p>' : '') +
        '<div style="margin-bottom:.8rem"></div>' : '') +
      '<form id="puppy" novalidate>' + (x ? '<input type="hidden" name="version" value="' + esc(x.version) + '">' : '') +
      (canEdit ? prefillBox('puppy', 'puppy') : '') +
      '<div class="field"><label for="p-name">Name</label><input id="p-name" name="name" type="text" value="' + esc(x ? x.name : '') + '" required' + dis + '></div>' +
      '<div class="grid-2"><div class="field"><label for="p-sex">Sex</label><select id="p-sex" name="sex"' + dis + '><option value="">Not set</option><option value="female"' + (x && x.sex === 'female' ? ' selected' : '') + '>Female</option><option value="male"' + (x && x.sex === 'male' ? ' selected' : '') + '>Male</option></select></div>' +
      colorField('p', x ? x.color : '', br, dis) + '</div>' + coatField(x ? x.coat : '', br, dis) +
      '<div class="grid-2"><div class="field"><label for="p-price">Price ($)</label><input id="p-price" name="price" type="text" inputmode="decimal" value="' + esc(x ? dollars(x.price_cents) : '') + '" required' + dis + '></div>' +
      '<div class="field"><label for="p-dep">Deposit ($)</label><input id="p-dep" name="deposit" type="text" inputmode="decimal" value="' + esc(x ? dollars(x.deposit_cents) : '') + '"' + dis + '></div></div>' +
      '<div class="field"><label>Status</label>' + seg() + '<div class="hint">Placed puppies stay visible in their litter, marked placed.</div></div>' +
      '<div class="field"><label for="p-desc">Description</label><textarea id="p-desc" name="description"' + dis + '>' + esc(x ? x.description : '') + '</textarea></div>' +
      includesField(x ? x.includes : [], dis) +
      '<div class="field"><label for="p-url">Link to this puppy on your site</label><input id="p-url" name="breeder_url" type="url" value="' + esc(x ? x.breeder_url : '') + '"' + dis + '><div class="hint">Optional. Buyers are sent here to contact you.</div></div>' +
      detailFields(x, dis) +
      (canEdit ? '<div id="quality" aria-live="polite">' + qualityBox(x, findLitter(x ? x.litter_id : litterId), null) + '</div>' : '') +
      (canEdit ? '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (x ? 'Save puppy' : 'Add puppy') + '</button>' + (x ? '<button class="btn btn-danger" type="button" id="archive-puppy">Remove puppy</button>' : '') + '</div>' : '') +
      '</form>' + (canEdit && x ? payNext(x) + moveBox(x) : '') +
      (x ? SPLIT + photoSection(x, canEdit) + videoSection(x, canEdit) + docSection(x.documents || [], canEdit, 'puppy')
        : canEdit ? SPLIT + NEW_UPLOAD_NOTE + photoSection({ photos: [], name: 'this puppy' }, true) + docSection([], true, 'puppy') + '<p class="hint">Add videos once the puppy is saved.</p>' : ''),
      function (d) {
        var form = $('#puppy', d);
        $$('[data-av]', d).forEach(function (b) {
          b.addEventListener('click', function () {
            $$('[data-av]', d).forEach(function (o) { o.classList.remove('on'); o.setAttribute('aria-pressed', 'false'); });
            b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
            $('[name=availability]', form).value = b.dataset.av;
          });
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          body.includes = $$('[name=inc]:checked', form).map(function (c) { return c.value; })
            .concat(String(body.includes || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean));
          delete body.inc;
          if (!x) body.litter_id = litterId;
          (x ? api('PUT', '/api/puppies/' + x.id, body) : api('POST', '/api/puppies', body))
            .then(function (r) {
              return attachHeld(form, '/api/puppies/' + (x ? x.id : r.id) + '/documents').then(function (n) {
                toast((x ? 'Puppy saved' : pendingUpload || n ? 'Puppy added' : 'Puppy added. Now add photos.') + (n ? ', with the document kept as private' : ''));
                return loadListings().then(function () { puppyDrawer(findPuppy(x ? x.id : r.id)); litters(); });
              });
            })
            .catch(function (err) { pendingUpload = null; showError(form, err); });
        });
        if (!x && canEdit) saveFirstUploads(d, form);
        if (canEdit) wirePrefill(d, form, 'puppy', { litter: x ? x.litter_id : litterId });
        var ar = $('#archive-puppy', d);
        if (ar) ar.addEventListener('click', function () {
          if (!confirm('Remove ' + x.name + ' from your listings?')) return;
          api('POST', '/api/puppies/' + x.id + '/archive', {}).then(function () { closeDrawer(); toast('Puppy removed'); litters(); }).catch(function (err) { showError(form, err); });
        });
        if (x) { wirePhotos(d, x, canEdit); wireVideos(d, x, canEdit); wireDocs(d, canEdit, '/api/puppies/' + x.id + '/documents', function () { return loadListings().then(function () { puppyDrawer(findPuppy(x.id)); litters(); }); }); carryUpload(d); }
        var pn = $('[data-pay-next]', d); if (pn) pn.addEventListener('click', closeDrawer);
        var mv = $('#move-litter', d);
        if (mv) mv.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = $('#move-to', mv).value;
          if (!v) return;
          var body = v === 'new' ? { new_litter: true } : { litter_id: v };
          api('POST', '/api/puppies/' + x.id + '/move', body).then(function () {
            toast(v === 'new' ? x.name + ' has a litter of their own. Pick the mom and dad on it.' : x.name + ' moved');
            return loadListings().then(function () { puppyDrawer(findPuppy(x.id)); litters(); });
          }).catch(function (err) { showError(mv, err); });
        });
        // Workplan A21. The prompts follow the form as the breeder types.
        var qbox = $('#quality', d), qlit = findLitter(x ? x.litter_id : litterId);
        if (qbox) form.addEventListener('input', function () { qbox.innerHTML = qualityBox(x, qlit, form); });
      });
  }

  /* Workplan A3. Registration, markings, health and the breeder's deposit link, all optional,
     folded away so the form stays short on a phone. It opens by itself when anything is filled. */
  function detailFields(x, dis) {
    var regs = (state.listings && state.listings.registries) || [];
    var cur = x ? x.registry : '';
    if (cur && regs.indexOf(cur) < 0) regs = regs.concat([cur]);
    function area(id, name, label, hint) {
      return '<div class="field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" name="' + name + '" style="min-height:70px"' + dis + '>' + esc(x ? x[name] : '') + '</textarea>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
    }
    var filled = x && ['registry', 'markings', 'health_notes', 'vaccinations', 'deworming', 'disclosures', 'deposit_url'].some(function (k) { return x[k]; });
    return '<details class="more-details"' + (filled ? ' open' : '') + ' style="margin:0 0 1rem"><summary style="cursor:pointer;font-weight:600;padding:.4rem 0">Registration, health and deposit link (optional)</summary>' +
      '<div class="grid-2"><div class="field"><label for="p-reg">Registration</label><select id="p-reg" name="registry"' + dis + '><option value="">Not registered or not set</option>' +
        regs.map(function (r) { return '<option' + (r === cur ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="p-mark">Markings</label><input id="p-mark" name="markings" type="text" value="' + esc(x ? x.markings : '') + '"' + dis + '></div></div>' +
      area('p-health', 'health_notes', 'Health notes', 'Vet checks, health testing of the parents, or a guarantee.') +
      area('p-vacc', 'vaccinations', 'Vaccinations', 'Which shots and when.') +
      area('p-worm', 'deworming', 'Deworming', '') +
      area('p-disc', 'disclosures', 'Disclosures', 'Anything a family should know before they decide.') +
      '<div class="field"><label for="p-depurl">Deposit link</label><input id="p-depurl" name="deposit_url" type="url" value="' + esc(x ? x.deposit_url : '') + '"' + dis + '><div class="hint">Your own deposit page. Families pay you there, never Puppy Connection.</div></div>' +
      '</details>';
  }

  function videoSection(x, canEdit) {
    var V = (state.listings && state.listings.videos) || {};
    if (!V.on && !x.videos.length) return '';
    var live = x.videos.filter(function (v) { return v.status !== 'error'; });
    var mins = Math.round((V.max_seconds || 120) / 6) / 10;
    return '<section style="margin-top:1.4rem"><h3>Videos</h3><p class="hint">Up to ' + plural(V.max || 0, 'video') + ', each up to ' + plural(mins, 'minute') + ' and 200 MB.</p>' +
      '<div class="videos" id="videos">' + x.videos.map(function (v) {
        var body = v.status === 'ready' && v.iframe
          ? '<div style="position:relative;padding-top:56.25%"><iframe src="' + esc(v.iframe) + '" title="Video of ' + esc(x.name) + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>'
          : '<p class="small" style="margin:.4rem 0">' + (v.status === 'error' ? 'This video could not be processed. Remove it and try again.' : 'Processing. It shows here, and on the site, when it is ready.') + '</p>';
        return '<div class="video" data-id="' + esc(v.id) + '" data-status="' + esc(v.status) + '" style="margin:.6rem 0">' + body +
          (canEdit ? '<button type="button" class="btn btn-sm" data-remove-video style="margin-top:.4rem">Remove video</button>' : '') + '</div>';
      }).join('') + '</div>' +
      (canEdit && V.on && live.length < V.max ? '<div class="upload"><label for="vid-input" class="btn btn-sm">Add a video</label><input id="vid-input" type="file" accept="video/*" hidden>' +
        '<p class="small" id="vid-progress" hidden></p><p class="error" id="vid-error" hidden></p></div>' : '') + '</section>';
  }

  function wireVideos(d, x, canEdit) {
    var V = (state.listings && state.listings.videos) || {};
    function reopen() { return loadListings().then(function () { if ($('#puppy')) puppyDrawer(findPuppy(x.id)); }); }
    // Stream takes a little while after the upload. Each video still processing is checked
    // every few seconds while the drawer is open, and the drawer redraws when one is ready.
    var waiting = $$('.video[data-status=processing], .video[data-status=uploading]', d).map(function (el) { return el.dataset.id; });
    if (waiting.length) {
      var tries = 0;
      var poll = setInterval(function () {
        if (!document.body.contains(d) || !$('#videos', d) || ++tries > 60) return clearInterval(poll);
        Promise.all(waiting.map(function (id) { return api('POST', '/api/videos/' + id + '/check', {}); })).then(function (rs) {
          if (rs.some(function (r) { return r.status === 'ready' || r.status === 'error'; })) { clearInterval(poll); reopen(); }
        }).catch(function () { clearInterval(poll); });
      }, 5000);
    }
    if (!canEdit) return;
    $$('[data-remove-video]', d).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Remove this video?')) return;
        b.disabled = true;
        api('DELETE', '/api/videos/' + b.closest('.video').dataset.id).then(function () { toast('Video removed'); reopen(); })
          .catch(function (err) { b.disabled = false; toast(err.message); });
      });
    });
    var input = $('#vid-input', d);
    if (!input) return;
    var prog = $('#vid-progress', d), errBox = $('#vid-error', d);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      errBox.hidden = true;
      if (file.size > V.max_bytes) { errBox.hidden = false; errBox.textContent = 'That video is larger than 200 MB. A shorter clip, or one saved at a lower quality, will fit.'; return; }
      var started = null, fb = fileBusy(input, 'Uploading video…');
      api('POST', '/api/puppies/' + x.id + '/videos', {}).then(function (r) {
        started = r.id;
        return new Promise(function (ok, fail) {
          var fd = new FormData(); fd.append('file', file);
          var xhr = new XMLHttpRequest();
          xhr.open('POST', r.upload_url);
          xhr.upload.onprogress = function (e) { if (e.lengthComputable) { prog.hidden = false; prog.textContent = 'Uploading ' + Math.round(e.loaded / e.total * 100) + '%'; } };
          xhr.onload = function () { if (xhr.status < 300) ok(r); else fail(new Error(xhr.status === 413 ? 'That video is too large.' : 'The upload did not finish. Try again.')); };
          xhr.onerror = function () { fail(new Error('The upload did not finish. Check the connection and try again.')); };
          xhr.send(fd);
        });
      }).then(function (r) {
        prog.textContent = 'Uploaded. Processing the video.';
        return api('POST', '/api/videos/' + r.id + '/check', {});
      }).then(function () { fb.done(); toast('Video added'); reopen(); })
        .catch(function (err) {
          fb.done();
          prog.hidden = true; errBox.hidden = false; errBox.textContent = err.message;
          // An upload that never finished is taken back off the puppy, so it does not hold a place.
          if (started) api('DELETE', '/api/videos/' + started).catch(function () {});
        });
    });
  }

  // Amber's photo standard (2026-10-19, workplan A14), word for word in the listing terms draft too.
  var PHOTO_STANDARD = 'Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.';
  function photoSection(x, canEdit) {
    return '<section id="photo-step" style="margin-top:1.4rem"><h3>Photos</h3>' +
      (x.operator_hold && x.hold_kind === 'photos' ? '<p class="error">Taken off the site until new photos are uploaded.' + (x.hold_reason ? ' ' + esc(x.hold_reason) : '') + ' A new photo that passes the photo check brings it back.</p>' : '') +
      '<p class="photo-standard"><b>Photo standard.</b> ' + esc(PHOTO_STANDARD) + '</p>' +
      '<p class="hint">A new photo at least every four weeks keeps the listing on the site. New photos go first, and the first photo is the cover.</p>' +
      (canEdit ? '<div class="upload"><label for="ph-input" class="btn btn-sm">Add photos</label><input id="ph-input" type="file" accept="image/*" multiple hidden>' +
        '<div class="hint">JPEG, PNG or WebP, at least 1,000 pixels across and up to 15 MB each. Each photo is checked that the puppy can be seen clearly.</div><p class="error" id="ph-error" hidden></p></div>' : '') +
      (canEdit && x.photos.length > 1 ? '<div class="photo-batch"><button type="button" class="btn btn-sm btn-quiet" data-pick-all>Select all</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-remove-picked disabled>Remove selected</button></div>' : '') +
      '<div class="photos" id="photos">' + x.photos.map(function (ph, i) {
        var flag = ph.quality === 'sent_back' ? '<span class="pill pill-alert cover" title="' + esc((ph.messages || []).join(' ')) + '">Sent back</span>'
          : ph.quality === 'review' ? '<span class="pill pill-warn cover">Being looked at</span>' : ph.quality === 'pending' ? '<span class="pill pill-warn cover">Checking</span>' : '';
        return '<div class="photo" data-id="' + esc(ph.id) + '"' + (canEdit ? ' draggable="true"' : '') + (ph.quality === 'sent_back' ? ' style="outline:2px solid #b42318"' : '') + '>' + (flag || (i === 0 ? '<span class="pill pill-gold cover">Cover</span>' : '')) +
          '<img src="' + esc(cardUrl(ph.url)) + '" alt="Photo ' + (i + 1) + ' of ' + esc(x.name) + '">' +
          (canEdit ? '<label class="photo-pick" title="Select to remove"><input type="checkbox" data-pick aria-label="Select photo ' + (i + 1) + ' to remove"></label>' : '') +
          (canEdit ? '<div class="tools"><button type="button" data-move="-1" aria-label="Move earlier"' + (i === 0 ? ' disabled' : '') + '>&larr;</button>' +
            '<button type="button" data-remove aria-label="Remove photo">Remove</button>' +
            '<button type="button" data-move="1" aria-label="Move later"' + (i === x.photos.length - 1 ? ' disabled' : '') + '>&rarr;</button></div>' +
            '<div class="tools tools-2"><label class="sr" for="ph-pos-' + esc(ph.id) + '">Position</label><select id="ph-pos-' + esc(ph.id) + '" data-pos aria-label="Position of photo ' + (i + 1) + '">' +
              x.photos.map(function (_, k) { return '<option value="' + k + '"' + (k === i ? ' selected' : '') + '>' + (k === 0 ? '1, cover' : String(k + 1)) + '</option>'; }).join('') + '</select>' +
              (i > 0 ? '<button type="button" data-cover>Make cover</button>' : '') + '</div>' : '') + '</div>';
      }).join('') + '</div>' +
      (x.photos.some(function (ph) { return ph.quality === 'sent_back'; }) ? '<p class="error" style="white-space:pre-line">' + x.photos.filter(function (ph) { return ph.quality === 'sent_back'; }).map(function (ph) {
        return 'A photo marked Sent back needs replacing. ' + (ph.messages || []).join(' ') + ' It is not shown on the site.'; }).join('\n') + '</p>' : '') +
      '</section>';
  }

  /* A phone photo can be 4 to 12 MB and 4000 px wide, and the site never shows one wider than
     1200 px. Each photo is redrawn here before upload, once at FULL_EDGE for the puppy page
     and once at CARD_EDGE for cards and thumbnails, as WebP where the browser can write it and
     JPEG where it cannot. Redrawing also drops the camera metadata, which the server strips
     again anyway. A file the browser cannot decode goes up as it is. */
  var FULL_EDGE = 1600, CARD_EDGE = 640;
  function cardUrl(u) { return /^\/media\/[\w-]+$/.test(u || '') ? u + '/card' : u; }
  function decode(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' });
    return new Promise(function (ok, fail) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); fail(new Error('decode')); };
      im.src = u;
    });
  }
  function draw(src, edge) {
    var w = src.width, h = src.height, k = Math.min(1, edge / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
    return new Promise(function (ok) {
      c.toBlob(function (b) {
        if (b && b.type === 'image/webp') return ok(b);
        c.toBlob(function (j) { ok(j); }, 'image/jpeg', 0.85);
      }, 'image/webp', 0.82);
    });
  }
  /* Workplan A9. A photo under MIN_EDGE on its longest side is refused here, and a dark one asks
     first. The 100-photo sample's passing photos were all at least 1,080 px and none had a mean
     brightness under 76, while the two dark ones it sent back measured 62 and 64. */
  var MIN_EDGE = 1000, DARK = 70;
  function brightness(src) {
    try {
      var c = document.createElement('canvas'); c.width = 48; c.height = 48;
      var g = c.getContext('2d'); g.drawImage(src, 0, 0, 48, 48);
      var d = g.getImageData(0, 0, 48, 48).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      return sum / (d.length / 4);
    } catch (e) { return 255; }
  }
  function screen(file) {
    return decode(file).then(function (src) {
      var edge = Math.max(src.width, src.height);
      var light = brightness(src);
      if (src.close) src.close();
      if (edge < MIN_EDGE) throw new Error(file.name + ' is ' + edge + ' pixels across. Photos need to be at least ' + MIN_EDGE + ' pixels, so use the original from your phone or camera rather than a screenshot or a saved copy.');
      if (light < DARK && !confirm(file.name + ' looks dark, so families may not see the puppy well. Upload it anyway?')) throw new Error('skip');
    }, function () { /* a file the browser cannot decode goes up as it is, and the server checks it */ });
  }
  function shrink(file) {
    return decode(file).then(function (src) {
      return draw(src, FULL_EDGE).then(function (full) {
        return draw(src, CARD_EDGE).then(function (card) {
          if (src.close) src.close();
          // Keep the original when redrawing would not make it smaller, such as a small PNG.
          return { full: full && full.size < file.size ? full : file, card: card };
        });
      });
    }).catch(function () { return { full: file, card: null }; });
  }
  function uploadOne(puppyId, file, checking) {
    return screen(file).then(function () { return shrink(file); }).then(function (s) {
      return api('POST', '/api/puppies/' + puppyId + '/photos', undefined, s.full).then(function (r) {
        // A missing card copy only means cards load the full photo, so its failure is not shown.
        return (s.card ? api('POST', '/api/photos/' + r.id + '/card', undefined, s.card).catch(function () {}) : Promise.resolve())
          // Workplan A9. The quality check. If it cannot run now, the photo is checked within 15 minutes.
          .then(function () { if (checking) checking(); return api('POST', '/api/photos/' + r.id + '/check', {}).catch(function () { return { quality: 'pending' }; }); })
          .then(function (c) { c.name = file.name; return c; });
      });
    });
  }
  /* What the check said about each photo in a batch, as one message. */
  function checkSummary(results) {
    var back = results.filter(function (c) { return c && c.quality === 'sent_back'; });
    var held = results.filter(function (c) { return c && c.quality === 'review'; });
    var out = [];
    back.forEach(function (c) { out.push(c.name + ' needs another photo. ' + (c.messages || []).join(' ') + ' Remove it and upload a clearer one.'); });
    if (held.length) out.push(plural(held.length, 'photo') + ' will show once Puppy Connection has looked at ' + (held.length === 1 ? 'it' : 'them') + '.');
    return out.join('\n');
  }

  function wirePhotos(d, x, canEdit) {
    if (!canEdit) return;
    var input = $('#ph-input', d);
    var errBox = $('#ph-error', d);
    function reopen() { return loadListings().then(function () { puppyDrawer(findPuppy(x.id)); litters(); }); }
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      errBox.hidden = true;
      var chain = Promise.resolve(), results = [], problems = [];
      var many = files.length > 1, fb = fileBusy(input, many ? 'Uploading photo 1 of ' + files.length + '…' : 'Uploading photo…');
      // New photos go to the top (Alex, 2026-10-31), so the batch goes up last file first and keeps the order chosen.
      files.slice().reverse().forEach(function (file, i) {
        chain = chain.then(function () {
          fb.set(many ? 'Uploading photo ' + (i + 1) + ' of ' + files.length + '…' : 'Uploading photo…');
          return uploadOne(x.id, file, function () { fb.set(many ? 'Checking photo ' + (i + 1) + ' of ' + files.length + '…' : 'Checking photo…'); })
            .then(function (c) { results.push(c); }, function (e) { if (e.message !== 'skip') problems.push(e.message); });
        });
      });
      chain = chain.then(function (v) { fb.done(); return v; }, function (e) { fb.done(); throw e; });
      chain.then(function () {
        var ok = results.filter(function (c) { return c.quality !== 'sent_back' && c.quality !== 'review'; }).length;
        if (ok) toast(ok === 1 ? 'Photo added' : ok + ' photos added');
        var msg = problems.concat(checkSummary(results) ? [checkSummary(results)] : []).join('\n');
        return reopen().then(function () { if (msg) { var box = $('#ph-error'); if (box) { box.hidden = false; box.style.whiteSpace = 'pre-line'; box.textContent = msg; } } });
      }).catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; reopen(); });
    });
    $$('[data-remove]', d).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('.photo').dataset.id;
        api('DELETE', '/api/photos/' + id).then(function () { toast('Photo removed'); reopen(); }).catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; });
      });
    });
    // Alex, 2026-11-01. Tick several photos and remove them in one go, one request each, then redraw once.
    var picks = $$('[data-pick]', d), pickBtn = $('[data-remove-picked]', d), pickAll = $('[data-pick-all]', d);
    function picked() { return picks.filter(function (c) { return c.checked; }); }
    function syncPicks() {
      if (!pickBtn) return;
      var n = picked().length;
      pickBtn.disabled = !n;
      pickBtn.textContent = n ? 'Remove ' + plural(n, 'photo', 'photos') : 'Remove selected';
      if (pickAll) pickAll.textContent = n === picks.length ? 'Clear selection' : 'Select all';
    }
    picks.forEach(function (c) { c.addEventListener('change', syncPicks); });
    if (pickAll) pickAll.addEventListener('click', function () { var all = picked().length !== picks.length; picks.forEach(function (c) { c.checked = all; }); syncPicks(); });
    if (pickBtn) pickBtn.addEventListener('click', function () {
      var ids = picked().map(function (c) { return c.closest('.photo').dataset.id; });
      if (!ids.length || !confirm('Remove ' + plural(ids.length, 'photo', 'photos') + ' from ' + x.name + '?')) return;
      pickBtn.disabled = true;
      var done = 0, chain = Promise.resolve();
      ids.forEach(function (id) { chain = chain.then(function () { return api('DELETE', '/api/photos/' + id).then(function () { done += 1; }); }); });
      chain.then(function () { toast(plural(done, 'photo', 'photos') + ' removed'); reopen(); })
        .catch(function (err) { errBox.hidden = false; errBox.textContent = (done ? plural(done, 'photo', 'photos') + ' removed, then: ' : '') + err.message; reopen(); });
    });
    // Alex, 2026-10-31. Move one step, straight to a position, or to the cover, in one save.
    function moveTo(id, j) {
      var ids = x.photos.map(function (p) { return p.id; });
      var i = ids.indexOf(id);
      if (i < 0 || j < 0 || j >= ids.length || i === j) return;
      ids.splice(j, 0, ids.splice(i, 1)[0]);
      api('PUT', '/api/puppies/' + x.id + '/photo-order', { ids: ids }).then(function () { if (j === 0) toast('Cover photo set'); return reopen(); })
        .catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; });
    }
    $$('[data-move]', d).forEach(function (b) {
      b.addEventListener('click', function () { var id = b.closest('.photo').dataset.id; moveTo(id, x.photos.map(function (p) { return p.id; }).indexOf(id) + Number(b.dataset.move)); });
    });
    $$('[data-cover]', d).forEach(function (b) {
      b.addEventListener('click', function () { moveTo(b.closest('.photo').dataset.id, 0); });
    });
    $$('[data-pos]', d).forEach(function (sel) {
      sel.addEventListener('change', function () { moveTo(sel.closest('.photo').dataset.id, Number(sel.value)); });
    });
    // Alex, 2026-10-31. Drag a photo onto another to take its place. On a phone the position menu does the same.
    var dragId = null;
    $$('#photos .photo[draggable]', d).forEach(function (tile) {
      tile.addEventListener('dragstart', function (e) { dragId = tile.dataset.id; tile.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
      tile.addEventListener('dragend', function () { tile.classList.remove('dragging'); $$('#photos .drag-over', d).forEach(function (t) { t.classList.remove('drag-over'); }); });
      tile.addEventListener('dragover', function (e) { if (!dragId || dragId === tile.dataset.id) return; e.preventDefault(); tile.classList.add('drag-over'); });
      tile.addEventListener('dragleave', function () { tile.classList.remove('drag-over'); });
      tile.addEventListener('drop', function (e) {
        e.preventDefault(); tile.classList.remove('drag-over');
        var from = dragId; dragId = null;
        if (from && from !== tile.dataset.id) moveTo(from, x.photos.map(function (p) { return p.id; }).indexOf(tile.dataset.id));
      });
    });
  }

  // ------------------------------------------------------------ moms and dads (workplan A19)
  /* Each mom and dad is saved once and picked on a litter. Health tests come from the breed's
     published list (lib/healthtests.js), with an Other box for anything else. */
  function loadParents() {
    return api('GET', '/api/parents').then(function (P) { state.parents = P; return P; });
  }
  function findParent(id) { return ((state.parents && state.parents.parents) || []).filter(function (p) { return p.id === id; })[0]; }
  function catalogFor(slug) { return ((state.parents && state.parents.breeds) || []).filter(function (b) { return b.slug === slug; })[0] || null; }

  function parentsView() {
    var canEdit = state.me.status === 'approved';
    loadParents().then(function (P) {
      var live = P.parents.filter(function (p) { return !p.archived_at; });
      var gone = P.parents.filter(function (p) { return p.archived_at; });
      var html = head('Moms and dads', 'Save each mom and dad once, with their health testing, then pick them on each litter. Families see both parents on every puppy page.',
        canEdit ? '<button class="btn btn-primary" data-new-parent="female">Add a mom</button><button class="btn btn-primary" data-new-parent="male">Add a dad</button>' : '');
      if (!canEdit) html += '<p class="notice">' + (state.me.status === 'suspended' ? 'Your account is paused, so this is read only.' : 'Moms and dads open once your account is approved.') + '</p>';
      function card(p) {
        var img = p.photo_url ? '<img class="thumb" src="' + esc(p.photo_url.replace('?', '/card?')) + '" alt="">' : '<div class="thumb-empty">No photo</div>';
        var br = catalogFor(p.breed);
        return '<div class="puppy-card"><div class="pc-top">' + img + '<div class="meta"><b>' + esc(p.name) + '</b><span class="muted small">' +
          (p.sex === 'female' ? 'Mom' : 'Dad') + (br ? ', ' + esc(br.name) : '') + (p.registry ? ', ' + esc(p.registry) : '') + '. ' +
          plural(p.test_labels.length, 'health test') + (p.health_other ? ' and other testing' : '') + ', ' + plural(p.documents.length, 'document') + '. ' +
          (p.litters ? 'On ' + plural(p.litters, 'litter') + '.' : 'Not on a litter yet.') + '</span></div>' +
          '<button class="btn btn-sm" data-edit-parent="' + esc(p.id) + '">' + (canEdit ? 'Edit' : 'View') + '</button></div></div>';
      }
      html += '<section class="card" aria-label="Your moms and dads">' + (live.length ? '<div class="puppy-grid">' + live.map(card).join('') + '</div>'
        : empty('No moms or dads yet', canEdit ? 'Add each mom and dad once, then choose them when you add or edit a litter.' : '', '')) + '</section>';
      if (gone.length) html += '<section class="card" aria-label="Removed moms and dads"><div class="card-head"><h2>Removed</h2></div><p class="muted small">These are off the litter picker. Litters that already name them still show them.</p><div class="puppy-grid">' + gone.map(card).join('') + '</div></section>';
      shell(html);
      $$('[data-new-parent]').forEach(function (b) { b.addEventListener('click', function () { parentDrawer(null, b.dataset.newParent); }); });
      $$('[data-edit-parent]').forEach(function (b) { b.addEventListener('click', function () { parentDrawer(findParent(b.dataset.editParent)); }); });
    });
  }

  function testPicks(slug, picked, dis) {
    var br = catalogFor(slug);
    var list = br ? br.tests : [];
    var have = {}; (picked || []).forEach(function (k) { have[k] = true; });
    // A test ticked under another breed stays ticked and shown, so changing the breed loses nothing.
    var shown = {}; list.forEach(function (t) { shown[t.key] = true; });
    var extra = ((state.parents && state.parents.breeds) || []).reduce(function (out, b) {
      b.tests.forEach(function (t) { if (have[t.key] && !shown[t.key] && !out.some(function (o) { return o.key === t.key; })) out.push(t); });
      return out;
    }, []);
    var note = !br ? 'Choose the breed to see its health tests.' : br.general
      ? 'There is no published list of health tests for the ' + esc(br.name) + ', so these are the common screenings. Add anything else under Other.'
      : 'From the ' + br.sources.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }).join(' and ') + '. Tests the program requires are listed first.';
    return '<fieldset class="breed-picks test-picks" id="pa-tests"><legend>Health testing done</legend><p class="hint" style="grid-column:1/-1;margin:0 0 .3rem">' + note + '</p>' +
      list.concat(extra).map(function (t) {
        return '<label class="check"><input type="checkbox" name="test" value="' + esc(t.key) + '"' + (have[t.key] ? ' checked' : '') + dis + '><span>' + esc(t.label) + (t.required ? ' <span class="muted small">required</span>' : '') + '</span></label>';
      }).join('') + '</fieldset>';
  }

  function parentDrawer(p, sex) {
    var P = state.parents;
    var canEdit = state.me.status === 'approved';
    var dis = canEdit ? '' : ' disabled';
    sex = p ? p.sex : sex;
    var regs = (P.registries || []).slice();
    if (p && p.registry && regs.indexOf(p.registry) < 0) regs.push(p.registry);
    var word = sex === 'female' ? 'mom' : 'dad';
    openDrawer(p ? p.name : 'Add a ' + word,
      '<form id="parent" novalidate>' + (p ? '<input type="hidden" name="version" value="' + esc(p.version) + '">' : '') +
      '<input type="hidden" name="sex" value="' + esc(sex) + '">' + (canEdit ? prefillBox('parent', word) : '') +
      '<div class="field"><label for="pa-name">Name</label><input id="pa-name" name="name" type="text" value="' + esc(p ? p.name : '') + '" required' + dis + '><div class="hint">The ' + word + '\'s call name or registered name.</div></div>' +
      '<div class="field"><label for="pa-breed">Breed</label><select id="pa-breed" name="breed"' + dis + '><option value="">Choose a breed</option>' +
        P.breeds.map(function (b) { return '<option value="' + esc(b.slug) + '"' + (p && p.breed === b.slug ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid-2"><div class="field"><label for="pa-reg">Registration</label><select id="pa-reg" name="registry"' + dis + '><option value="">Not registered or not set</option>' +
        regs.map(function (r) { return '<option' + (p && r === p.registry ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="pa-regno">Registration number</label><input id="pa-regno" name="registration" type="text" value="' + esc(p ? p.registration : '') + '"' + dis + '></div></div>' +
      '<div id="pa-tests-slot">' + testPicks(p ? p.breed : '', p ? p.health_tests : [], dis) + '</div>' +
      '<div class="field"><label for="pa-other">Other health testing</label><textarea id="pa-other" name="health_other" style="min-height:70px"' + dis + '>' + esc(p ? p.health_other : '') + '</textarea><div class="hint">Any test not on the list, and results if you want families to see them.</div></div>' +
      '<div class="field"><label for="pa-ped">Pedigree</label><textarea id="pa-ped" name="pedigree" style="min-height:70px"' + dis + '>' + esc(p ? p.pedigree : '') + '</textarea><div class="hint">The ' + word + '\'s parents and lines, as you would tell a family. You can also upload it under Documents.</div></div>' +
      (canEdit ? '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (p ? 'Save ' + word : 'Add ' + word) + '</button>' +
        (p ? '<button class="btn btn-quiet" type="button" id="archive-parent">' + (p.archived_at ? 'Put back on the litter picker' : 'Remove from the litter picker') + '</button>' : '') + '</div>' : '') +
      '</form>' + (p ? SPLIT + parentPhotoSection(p, canEdit) + docSection(p.documents, canEdit, 'parent')
        : canEdit ? SPLIT + NEW_UPLOAD_NOTE + parentPhotoSection({ name: '', photo_url: null }, true) + docSection([], true, 'parent') : ''),
      function (d) {
        var form = $('#parent', d);
        $('#pa-breed', d).addEventListener('change', function () {
          var picked = $$('[name=test]:checked', form).map(function (c) { return c.value; });
          $('#pa-tests-slot', d).innerHTML = testPicks(this.value, picked, dis);
        });
        breedSearch($('#pa-breed', d));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          delete body.test;
          body.health_tests = $$('[name=test]:checked', form).map(function (c) { return c.value; });
          (p ? api('PUT', '/api/parents/' + p.id, body) : api('POST', '/api/parents', body))
            .then(function (r) {
              return attachHeld(form, '/api/parents/' + (p ? p.id : r.id) + '/documents').then(function (n) {
                toast((p ? 'Saved' : pendingUpload || n ? 'Added' : 'Added. Add a photo next.') + (n ? ', with the document kept as private' : ''));
                return loadParents().then(function () { parentsView(); parentDrawer(findParent(p ? p.id : r.id)); });
              });
            })
            .catch(function (err) { pendingUpload = null; showError(form, err); });
        });
        if (!p && canEdit) saveFirstUploads(d, form);
        if (canEdit) wirePrefill(d, form, 'parent', { sex: sex });
        var ar = $('#archive-parent', d);
        if (ar) ar.addEventListener('click', function () {
          api('POST', '/api/parents/' + p.id + '/archive', { archived: !p.archived_at }).then(function () { closeDrawer(); toast(p.archived_at ? 'Back on the litter picker' : 'Removed from the litter picker'); parentsView(); })
            .catch(function (err) { showError(form, err); });
        });
        if (p) { wireParentPhoto(d, p, canEdit); wireDocs(d, canEdit, '/api/parents/' + p.id + '/documents', function () { return loadParents().then(function () { parentsView(); parentDrawer(findParent(p.id)); }); }); carryUpload(d); }
      });
  }

  function parentPhotoSection(p, canEdit) {
    return '<section style="margin-top:1.4rem"><h3>Photo</h3>' +
      (p.photo_url ? '<img src="' + esc(p.photo_url) + '" alt="' + esc(p.name) + '" style="max-width:100%;max-height:16rem;border-radius:8px;display:block">' : '<p class="muted small">No photo yet. Families like to see the parents.</p>') +
      (canEdit ? '<div class="upload btn-row"><label for="pa-photo" class="btn btn-sm">' + (p.photo_url ? 'Replace photo' : 'Add a photo') + '</label><input id="pa-photo" type="file" accept="image/*" hidden>' +
        (p.photo_url ? '<button type="button" class="btn btn-sm btn-quiet" id="pa-photo-remove">Remove photo</button>' : '') + '</div><p class="error" id="pa-photo-error" hidden></p>' : '') + '</section>';
  }
  function wireParentPhoto(d, p, canEdit) {
    if (!canEdit) return;
    function reopen() { return loadParents().then(function () { parentsView(); parentDrawer(findParent(p.id)); }); }
    var input = $('#pa-photo', d), errBox = $('#pa-photo-error', d);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      errBox.hidden = true;
      var fb = fileBusy(input, 'Uploading photo…');
      shrink(file).then(function (s) {
        return api('POST', '/api/parents/' + p.id + '/photo', undefined, s.full)
          .then(function () { return s.card ? api('POST', '/api/parents/' + p.id + '/photo/card', undefined, s.card).catch(function () {}) : null; });
      }).then(function () { fb.done(); toast('Photo added'); reopen(); }).catch(function (err) { fb.done(); errBox.hidden = false; errBox.textContent = err.message; });
    });
    var rm = $('#pa-photo-remove', d);
    if (rm) rm.addEventListener('click', function () {
      api('DELETE', '/api/parents/' + p.id + '/photo').then(function () { toast('Photo removed'); reopen(); }).catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; });
    });
  }

  // ------------------------------------------------------------ fill from a document
  /* Alex, 2026-11-01. A breeder uploads a health record, pedigree or registration paper and the form
     is filled from it (lib/docextract.js on the server). Only empty fields are filled unless the
     breeder ticks Replace, health tests and Comes with ticks are only ever added, and every filled
     field says "From your document, please check" until the breeder changes it or saves. Nothing
     is saved here. The file is held in the page and added as a private document when the form is
     saved, so closing the drawer without saving keeps nothing. */
  var PREFILL_NOTE = 'From your document, please check';
  function prefillBox(owner, word) {
    if (!(state.config && state.config.prefill)) return '';
    return '<div class="prefill" data-prefill><p class="prefill-title">Fill from a document</p>' +
      '<p class="hint">Upload a health record, pedigree or registration paper, as a PDF or a photo of the page, and the empty fields below are filled from it. Check each one before you save. When you save, the document is kept with this ' + esc(word) + ' as a private document.</p>' +
      '<div class="prefill-row"><label for="pf-file-' + owner + '" class="btn btn-sm">Choose a document</label><input id="pf-file-' + owner + '" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden>' +
      '<label class="check"><input type="checkbox" data-pf-replace><span>Replace what is already filled in</span></label></div>' +
      '<p class="prefill-status" data-pf-status role="status" hidden></p></div>';
  }
  function markFilled(el, box) {
    // A ticked box marks its own line and the list it sits in, which carries the one note.
    var host = box || el.closest('.field') || el.closest('label');
    if (!host) return;
    host.classList.add('prefilled');
    if (box && el.closest('label')) el.closest('label').classList.add('prefilled-check');
    if (!$('.prefill-note', host)) {
      var n = document.createElement('span'); n.className = 'prefill-note'; n.textContent = PREFILL_NOTE;
      var label = box ? $('legend', box) : $('label', host);
      if (label && label !== el.closest('label')) label.appendChild(n); else host.appendChild(n);
    }
    function clear() {
      host.classList.remove('prefilled');
      $$('.prefilled-check', host).forEach(function (l) { l.classList.remove('prefilled-check'); });
      var n2 = $('.prefill-note', host); if (n2) n2.remove();
    }
    el.addEventListener('input', clear, { once: true });
    el.addEventListener('change', clear, { once: true });
  }
  /* Put the fields in the form. Returns { filled, kept }: how many were filled and how many were
     left alone because the breeder had already filled them. */
  function applyPrefill(d, form, r, replace) {
    var filled = 0, kept = 0, f = r.fields || {};
    // The breed first: choosing it redraws the health test list the tests are then ticked in.
    var order = Object.keys(f).sort(function (a, b) { return (a === 'breed' ? -1 : 0) - (b === 'breed' ? -1 : 0); });
    order.forEach(function (k) {
      var v = f[k];
      if (k === 'health_tests') {
        var have = $$('[name=test]:checked', form).map(function (c) { return c.value; });
        var add = v.filter(function (t) { return have.indexOf(t) < 0; });
        if (!add.length) return;
        var slot = $('#pa-tests-slot', d), breedSel = $('#pa-breed', d);
        if (slot) slot.innerHTML = testPicks(breedSel ? breedSel.value : '', have.concat(add), '');
        var set = $('#pa-tests', d);
        add.forEach(function (t) { var c = $('[name=test][value="' + t + '"]', form); if (c) markFilled(c, set); });
        filled++;
        return;
      }
      var el = $('[name="' + k + '"]', form);
      if (!el || el.disabled) return;
      if (String(el.value || '').trim() && !replace) { if (String(el.value).trim() !== String(v)) kept++; return; }
      if (el.tagName === 'SELECT') {
        var ok = Array.prototype.some.call(el.options, function (o) { return (o.value || o.text) === v; });
        if (!ok || el.value === v) return;
        el.value = v;
        el.dispatchEvent(new Event('change'));
      } else {
        if (el.value === v) return;
        el.value = v;
      }
      var more = el.closest('details'); if (more) more.open = true;
      markFilled(el);
      filled++;
    });
    (r.includes || []).forEach(function (name) {
      var c = $('[name=inc][value="' + name + '"]', form);
      if (!c || c.checked || c.disabled) return;
      c.checked = true;
      markFilled(c, c.closest('.includes-field'));
      filled++;
    });
    // The quality prompts follow the form (workplan A21).
    form.dispatchEvent(new Event('input'));
    return { filled: filled, kept: kept };
  }
  function wirePrefill(d, form, owner, opts) {
    var box = $('[data-prefill]', d);
    if (!box) return;
    form.heldDocs = [];
    var input = $('input[type=file]', box), status = $('[data-pf-status]', box);
    function say(text, bad) { status.hidden = false; status.textContent = text; status.classList.toggle('error', !!bad); }
    var max = (state.listings && state.listings.max_doc_bytes) || (state.parents && state.parents.max_doc_bytes) || 10485760;
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      input.value = '';
      if (file.size > max) { say(file.name + ' is larger than 10 MB. A scan at a lower resolution, or one page per file, will fit.', true); return; }
      var q = '?form=' + owner + (opts.sex ? '&sex=' + encodeURIComponent(opts.sex) : '') + (opts.litter ? '&litter=' + encodeURIComponent(opts.litter) : '');
      var fb = fileBusy(input, 'Reading the document…');
      say('Reading ' + file.name + '. A photo of a page can take up to half a minute.');
      api('POST', '/api/extract' + q, undefined, file).then(function (r) {
        fb.done();
        if (r.empty) { say(r.message || 'We could not find anything in this document that fits this form. Nothing was changed.', true); return; }
        var res = applyPrefill(d, form, r, $('[data-pf-replace]', box).checked);
        form.heldDocs.push({ file: file, kind: r.kind || 'other' });
        var kept = res.kept ? ' ' + (res.kept === 1 ? 'One field you had filled in was left as it was.' : res.kept + ' fields you had filled in were left as they were.') +
          ' To use what the document says instead, tick Replace and choose the document again.' : '';
        // A saved parent's sex comes from Add a mom or Add a dad, so a document for the other is only pointed out.
        var other = opts.sex && r.sex && r.sex !== opts.sex ? ' This document seems to be about a ' + (r.sex === 'male' ? 'male' : 'female') + ' dog, and this is a ' + (opts.sex === 'female' ? 'mom' : 'dad') + '.' : '';
        say((res.filled ? 'Filled ' + plural(res.filled, 'field') + ' from ' + file.name + '. Each one is marked below, so please check it before you save.'
          : 'Everything this document says is already in the form, so nothing changed.') + kept + other, !!other);
      }).catch(function (err) { fb.done(); say(err.message, true); });
    });
  }
  /* After a save: the held documents go up as private documents of the saved record. A failure
     here does not undo the save, and says what happened. */
  function attachHeld(form, uploadPath) {
    var list = (form.heldDocs || []).slice();
    form.heldDocs = [];
    return list.reduce(function (p, h) {
      return p.then(function () {
        var q = '?kind=' + encodeURIComponent(h.kind) + '&visibility=private&title=&name=' + encodeURIComponent(h.file.name.replace(/\.[^.]+$/, ''));
        return api('POST', uploadPath + q, undefined, h.file).catch(function (err) { toast('Saved, but ' + h.file.name + ' was not added to the documents: ' + err.message); });
      });
    }, Promise.resolve()).then(function () { return list.length; });
  }

  // ------------------------------------------------------------ documents (workplan A20)
  /* Health records, guarantees and pedigrees, as a PDF or an image, for a puppy or a parent. Each is
     shown to families or kept for Puppy Connection staff only, and starts private until chosen. */
  function docKinds() { return (state.listings && state.listings.doc_kinds) || (state.parents && state.parents.doc_kinds) || {}; }
  function docSection(docs, canEdit, owner) {
    var K = docKinds();
    var max = (state.listings && state.listings.max_docs) || (state.parents && state.parents.max_docs) || 10;
    return '<section class="docs" style="margin-top:1.4rem"><h3>Documents</h3><p class="hint">Health records, health guarantees and pedigrees, as a PDF or a photo of the page, up to 10 MB each. Choose for each one whether families can see it on the ' + (owner === 'parent' ? 'puppy pages of this parent\'s litters' : 'puppy page') + ', or keep it for Puppy Connection staff only.</p>' +
      (docs.length ? '<ul class="doc-list">' + docs.map(function (doc) {
        var pub = doc.visibility === 'public', pdf = doc.content_type === 'application/pdf';
        /* Alex, 2026-11-01. Each document shows as a preview, an image as itself and a PDF as its
           first page, so a sideways or upside-down scan is seen before families see it. */
        return '<li class="doc" data-id="' + esc(doc.id) + '">' +
          '<a class="doc-preview" href="' + esc(doc.file) + '" target="_blank" rel="noopener" aria-label="Open ' + esc(doc.title) + '" data-doc-preview="' + (pdf ? 'pdf' : 'image') + '" data-type="' + esc(doc.content_type) + '">' +
            (pdf ? '<span class="doc-pdf-label">PDF</span>' : '<img src="' + esc(doc.file) + '" alt="" loading="lazy">') + '</a>' +
          '<div class="doc-body"><div class="doc-main"><a href="' + esc(doc.file) + '" target="_blank" rel="noopener">' + esc(doc.title) + '</a>' +
          '<span class="muted small">' + esc(doc.kind_label) + ', ' + (pdf ? 'PDF' : 'image') + '</span>' +
          '<span class="pill ' + (pub ? 'pill-ok' : '') + '">' + (pub ? 'Families can see it' : 'Puppy Connection only') + '</span></div>' +
          (canEdit ? '<div class="btn-row doc-actions"><button type="button" class="btn btn-sm btn-quiet" data-doc-rot="270" aria-label="Rotate ' + esc(doc.title) + ' left">Rotate left</button>' +
            '<button type="button" class="btn btn-sm btn-quiet" data-doc-rot="90" aria-label="Rotate ' + esc(doc.title) + ' right">Rotate right</button>' +
            '<button type="button" class="btn btn-sm" data-doc-vis="' + (pub ? 'private' : 'public') + '">' + (pub ? 'Make private' : 'Show to families') + '</button>' +
            '<button type="button" class="btn btn-sm btn-quiet" data-doc-remove>Remove</button></div>' : '') + '</div></li>';
      }).join('') + '</ul>' : '<p class="muted small">No documents yet.</p>') +
      (canEdit && docs.length < max ? '<form class="doc-form" novalidate><div class="grid-2"><div class="field"><label for="doc-kind-' + owner + '">What it is</label><select id="doc-kind-' + owner + '" name="kind">' +
          Object.keys(K).map(function (k) { return '<option value="' + esc(k) + '">' + esc(K[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="doc-title-' + owner + '">Name</label><input id="doc-title-' + owner + '" name="title" type="text" maxlength="120"><div class="hint">Optional. The file name is used otherwise.</div></div></div>' +
        '<fieldset class="field doc-vis"><legend>Who can see it</legend><label class="check"><input type="radio" name="visibility" value="public"><span>Families, on the site</span></label>' +
        '<label class="check"><input type="radio" name="visibility" value="private" checked><span>Puppy Connection staff only</span></label></fieldset>' +
        '<label for="doc-file-' + owner + '" class="btn btn-sm">Choose a file and upload</label><input id="doc-file-' + owner + '" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden>' +
        '<p class="error" data-doc-error hidden></p></form>' : '') + '</section>';
  }
  /* pdf.js (Mozilla, Apache 2.0, the legacy build of 6.2.108 under /vendor/pdfjs) draws the first
     page of each PDF as its preview. It loads only when a drawer shows a PDF. If it cannot load or
     cannot read a file, the preview stays a plain PDF link the breeder can open. */
  var PDFJS_V = '6.2.108', pdfLib = null;
  function loadPdfJs() {
    if (!pdfLib) pdfLib = import('/vendor/pdfjs/pdf.min.mjs?v=' + PDFJS_V).then(function (m) {
      m.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=' + PDFJS_V;
      return m;
    });
    return pdfLib;
  }
  function pdfPreviews(sec) {
    var boxes = $$('[data-doc-preview="pdf"]', sec);
    if (!boxes.length) return;
    loadPdfJs().then(function (lib) {
      boxes.forEach(function (box) {
        var task = lib.getDocument({ url: box.getAttribute('href'), isEvalSupported: false, withCredentials: true });
        task.promise.then(function (pdf) {
          return pdf.getPage(1).then(function (page) {
            // The viewport carries the page's own rotation, so a turned PDF shows turned.
            var one = page.getViewport({ scale: 1 });
            var ratio = window.devicePixelRatio || 1;
            var scale = Math.min((box.clientWidth || 96) / one.width, (box.clientHeight || 124) / one.height) * ratio;
            var vp = page.getViewport({ scale: scale });
            var c = document.createElement('canvas');
            c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
            c.style.width = (vp.width / ratio) + 'px'; c.style.height = (vp.height / ratio) + 'px';
            return page.render({ canvas: c, canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
              box.innerHTML = ''; box.appendChild(c); box.classList.add('has-page');
              task.destroy();
            });
          });
        }).catch(function () { task.destroy(); });
      });
    }).catch(function () { /* the PDF label stays as the link */ });
  }
  /* An image is turned in the browser: drawn on a canvas a quarter or half turn round and sent back
     as the same kind of file. A Worker has no image library to do it. The image comes from the
     breeder's own same-origin copy, so the canvas can be read. */
  function turnImage(src, type, turn) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, side = turn % 180 !== 0;
        var c = document.createElement('canvas');
        c.width = side ? h : w; c.height = side ? w : h;
        var g = c.getContext('2d');
        g.translate(c.width / 2, c.height / 2);
        g.rotate(turn * Math.PI / 180);
        g.drawImage(img, -w / 2, -h / 2);
        c.toBlob(function (out) { if (out) resolve(out); else reject(new Error('This image could not be turned in this browser.')); }, type, 0.92);
      };
      img.onerror = function () { reject(new Error('The image could not be opened to turn it.')); };
      img.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
    });
  }
  function wireDocs(d, canEdit, uploadPath, reopen) {
    var sec = $('.docs', d);
    if (!sec) return;
    pdfPreviews(sec);
    if (!canEdit) return;
    $$('[data-doc-rot]', sec).forEach(function (b) {
      b.addEventListener('click', function () {
        var li = b.closest('.doc'), prev = $('[data-doc-preview]', li), turn = Number(b.dataset.docRot);
        var path = '/api/documents/' + li.dataset.id + '/rotate?turn=' + turn;
        $$('[data-doc-rot]', li).forEach(function (o) { o.disabled = true; });
        li.classList.add('is-turning');
        var go = prev.dataset.docPreview === 'pdf' ? api('POST', path, {})
          : turnImage(prev.getAttribute('href'), prev.dataset.type, turn).then(function (blob) { return api('POST', path, undefined, blob); });
        go.then(function () { toast(turn === 90 ? 'Turned right' : 'Turned left'); reopen(); })
          .catch(function (err) { li.classList.remove('is-turning'); $$('[data-doc-rot]', li).forEach(function (o) { o.disabled = false; }); toast(err.message); });
      });
    });
    var form = $('.doc-form', sec), errBox = form && $('[data-doc-error]', form);
    var max = (state.listings && state.listings.max_doc_bytes) || (state.parents && state.parents.max_doc_bytes) || 10485760;
    if (form) $('input[type=file]', form).addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      errBox.hidden = true;
      if (file.size > max) { errBox.hidden = false; errBox.textContent = file.name + ' is larger than 10 MB. A scan at a lower resolution, or one page per file, will fit.'; return; }
      var f = formData(form);
      var vis = ($('[name=visibility]:checked', form) || {}).value || 'private';
      var q = '?kind=' + encodeURIComponent(f.kind) + '&visibility=' + encodeURIComponent(vis) + '&title=' + encodeURIComponent(f.title || '') + '&name=' + encodeURIComponent(file.name.replace(/\.[^.]+$/, ''));
      var fb = fileBusy(this, 'Uploading…');
      api('POST', uploadPath + q, undefined, file).then(function () { fb.done(); toast(vis === 'public' ? 'Document added for families to see' : 'Document added, for Puppy Connection only'); reopen(); })
        .catch(function (err) { fb.done(); errBox.hidden = false; errBox.textContent = err.message; });
    });
    $$('[data-doc-vis]', sec).forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        api('PUT', '/api/documents/' + b.closest('.doc').dataset.id, { visibility: b.dataset.docVis })
          .then(function () { toast(b.dataset.docVis === 'public' ? 'Families can see it now' : 'Kept for Puppy Connection only'); reopen(); })
          .catch(function (err) { b.disabled = false; toast(err.message); });
      });
    });
    $$('[data-doc-remove]', sec).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Remove this document?')) return;
        api('DELETE', '/api/documents/' + b.closest('.doc').dataset.id).then(function () { toast('Document removed'); reopen(); }).catch(function (err) { toast(err.message); });
      });
    });
  }

  // ------------------------------------------------------------ listing quality prompts (workplan A21)
  /* What would make a listing stronger, worked out from the form as the breeder types. It never
     blocks a save or a payment. Each line says what is missing and what to add. */
  // A description under SHORT_DESC characters, or with only one sentence, counts as one line.
  var GOOD_PHOTOS = 3, SHORT_DESC = 60;
  function qualityGaps(x, litter, form) {
    var v = function (name) { var el = form && $('[name=' + name + ']', form); return el ? String(el.value || '').trim() : String((x && x[name]) || '').trim(); };
    var gaps = [];
    var desc = v('description');
    if (!desc) gaps.push(['desc', 'Add a description. A few sentences about the puppy\'s personality, size and what it is used to help families decide.']);
    else if (desc.length < SHORT_DESC || !/[.!?]\s+\S/.test(desc)) gaps.push(['desc', 'The description is one line. A few more sentences about the puppy\'s personality, size and what it is used to help families decide.']);
    var healthDoc = x && (x.documents || []).some(function (d) { return d.kind === 'health'; });
    if (!v('health_notes') && !v('vaccinations') && !v('deworming') && !healthDoc) gaps.push(['health', 'No health details yet. Add vaccinations, deworming or health notes, or upload a health record.']);
    if (!litter || (!litter.mom_id && !litter.dad_id)) gaps.push(['parents', 'No mom or dad is picked on the litter. Families like to see both parents, so pick them when you edit the litter.']);
    else if (!litter.mom_id || !litter.dad_id) gaps.push(['parents', 'Only the ' + (litter.mom_id ? 'mom' : 'dad') + ' is picked on the litter. Pick the ' + (litter.mom_id ? 'dad' : 'mom') + ' too, so families see both parents.']);
    var photos = x ? x.photos.filter(function (ph) { return ph.quality !== 'sent_back' && ph.quality !== 'review'; }).length : 0;
    if (photos < GOOD_PHOTOS) gaps.push(['photos', (x ? (photos ? 'Only ' + plural(photos, 'photo') + '.' : 'No photos yet.') : 'Add photos once the puppy is saved.') + ' At least ' + GOOD_PHOTOS + ' clear photos from different angles show families the puppy well.']);
    if (litter && !litter.born_on) gaps.push(['born', 'The litter has no birth date, so families cannot see the puppy\'s age.']);
    return gaps;
  }
  function qualityBox(x, litter, form) {
    var gaps = qualityGaps(x, litter, form);
    if (!gaps.length) return '<div class="quality quality-ok"><b>This listing has what families look for.</b></div>';
    return '<div class="quality"><b>Make this listing stronger</b><ul>' + gaps.map(function (g) { return '<li data-gap="' + g[0] + '">' + esc(g[1]) + '</li>'; }).join('') + '</ul>' +
      '<p class="hint" style="margin:.3rem 0 0">You can still save and list it as it is.</p></div>';
  }

  // ------------------------------------------------------------ pay
  function pay() {
    var me = state.me;
    var q = state.route.split('?')[1] || '';
    loadListings().then(function (L) {
      var rows = [];
      L.litters.forEach(function (l) {
        l.puppies.forEach(function (x) { if (x.publication_state !== 'archived') rows.push({ x: x, breed: l.breed_name, l: l }); });
      });
      var ready = rows.filter(function (r) { return !r.x.pay_block; });
      var blocked = rows.filter(function (r) { return r.x.pay_block && !r.x.is_public; });
      var html = head('Pay to list', 'Each puppy costs ' + esc(money(L.fee_cents)) + ' to list ' + term(L) + '. Pay for a whole litter at once.') +
        (q.indexOf('canceled=1') >= 0 ? '<p class="notice">Payment canceled. Nothing was charged, and the puppies are free to pay for again.</p>' : '') +
        '';
      if (me.status !== 'approved') html += '<p class="notice">Payments open once your account is approved and active.</p>';
      html += '<form id="payform" class="card"><h2>Ready to list</h2>' +
        (ready.length ? '<label class="check" for="all" style="margin-bottom:.4rem"><input type="checkbox" id="all" aria-label="Select all"> Select all</label>' + ready.map(function (r) {
          var img = r.x.photos[0] ? '<img class="thumb" src="' + esc(cardUrl(r.x.photos[0].url)) + '" alt="">' : '<div class="thumb-empty">No photo</div>';
          return '<label class="pay-row check"><input type="checkbox" name="p" value="' + esc(r.x.id) + '" aria-label="' + esc('Pay for ' + r.x.name) + '">' + img +
            '<span><b>' + esc(r.x.name) + '</b> <span class="muted">' + esc(r.breed) + '</span><br><span class="why">' +
            (r.x.publication_state === 'published' ? 'Renew, listed until ' + esc(day(r.x.expires_at)) : r.x.publication_state === 'expired' ? 'Listing ended, renew it' : 'Draft') + '</span>' +
            // Workplan A21. What would make it stronger, before the breeder pays. It never blocks.
            (function (g) { return g.length ? '<br><span class="why quality-note">Could be stronger: ' + esc(g.map(function (x) { return { desc: 'a fuller description', health: 'health details', parents: 'both parents', photos: 'more photos', born: 'a birth date' }[x[0]]; }).join(', ')) + '. <a href="#/litters?photos=' + esc(r.x.id) + '">Open it</a></span>' : ''; })(qualityGaps(r.x, r.l, null)) + '</span></label>';
        }).join('') : '<p class="muted">Nothing is ready to pay for right now. A puppy shows here once it has a price and enough photos, which you add in <a href="#/litters">Litters and puppies</a>.</p>') +
        '<div class="total" style="margin-top:1rem"><span>Total</span><b id="total">$0</b></div>' +
        '<div class="btn-row"><button class="btn btn-gold" type="submit" id="paybtn" disabled>Continue to payment</button></div></form>';
      if (blocked.length) {
        html += '<div class="card"><h2>Not ready yet</h2>' + blocked.map(function (r) {
          return '<div class="pay-row"><span><b>' + esc(r.x.name) + '</b> <span class="muted">' + esc(r.breed) + '</span><br><span class="why">' + esc(standing(r.x).text) + '</span></span></div>';
        }).join('') + '</div>';
      }
      shell(html, true);
      var form = $('#payform');
      function update() {
        var n = $$('input[name=p]:checked', form).length;
        $('#total').textContent = money(n * L.fee_cents) || '$0';
        $('#paybtn').disabled = !n;
        $('#paybtn').textContent = n ? 'Pay ' + money(n * L.fee_cents) + ' for ' + n + ' listing' + (n === 1 ? '' : 's') : 'Continue to payment';
      }
      $$('input[name=p]', form).forEach(function (c) { c.addEventListener('change', update); });
      var all = $('#all'); if (all) all.addEventListener('change', function () { $$('input[name=p]', form).forEach(function (c) { c.checked = all.checked; }); update(); });
      var pre = (q.match(/(?:^|&)p=([^&]+)/) || [])[1];
      if (pre) { var pc = $$('input[name=p]', form).filter(function (c) { return c.value === decodeURIComponent(pre); })[0]; if (pc) { pc.checked = true; update(); pc.closest('.pay-row').scrollIntoView({ block: 'center' }); } }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ids = $$('input[name=p]:checked', form).map(function (c) { return c.value; });
        $('#paybtn').disabled = true;
        api('POST', '/api/checkouts', { puppy_ids: ids }).then(function (r) { location.href = r.url; })
          .catch(function (err) { $('#paybtn').disabled = false; showError(form, err); });
      });
    });
  }

  // ------------------------------------------------------------ payments
  function payments() {
    api('GET', '/api/checkouts').then(function (rows) {
      var label = { paid: '<span class="pill pill-ok">Paid</span>', open: '<span class="pill pill-gold">Open</span>', expired: '<span class="pill">Canceled or expired</span>',
        failed: '<span class="pill pill-alert">Failed</span>', needs_review: '<span class="pill pill-warn">Under review</span>', creating: '<span class="pill">Starting</span>' };
      shell(head('Payments', 'Every payment you have started. Receipts for paid listings come from Stripe by email.') + '<section class="panel">' +
        (rows.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Date</th><th>Puppies</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' +
          rows.map(function (c) {
            return '<tr><td>' + esc(day(c.created_at)) + '</td><td>' + esc(c.puppies) + '</td><td class="num">' + esc(money(c.amount_total_cents)) + '</td><td>' + (label[c.status] || esc(c.status)) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : empty('No payments yet', 'Payments appear here once you pay to list a puppy.', '<a class="btn" href="#/pay">Pay to list</a>')) + '</section>');
    });
  }

  // ------------------------------------------------------------ views and clicks (plan P2.5)
  function stats() {
    api('GET', '/api/stats').then(function (S) {
      var t = S.total;
      shell(head('Views and clicks', 'How often buyers opened each puppy\'s page on the site, and how often they went on to your website, phone or email. Nothing about the buyers themselves is kept.') +
        '<div class="stats">' +
        '<div class="stat"><b>' + t.views + '</b><span>Views in the last 30 days</span></div>' +
        '<div class="stat"><b>' + t.clicks + '</b><span>Clicks through to you in 30 days</span></div>' +
        '<div class="stat"><b>' + t.views_all + '</b><span>Views, all time</span></div>' +
        '<div class="stat"><b>' + t.clicks_all + '</b><span>Clicks, all time</span></div></div>' +
        '<section class="panel">' + (S.puppies.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Puppy</th><th class="num">Views</th><th class="num">Clicks</th>' +
          '<th class="num hide-sm">All-time views</th><th class="num hide-sm">All-time clicks</th></tr></thead><tbody>' +
          S.puppies.map(function (p) {
            return '<tr><td><b>' + esc(p.name) + '</b><span class="sub">' + esc(p.breed) + '</span></td><td class="num">' + p.views + '</td><td class="num">' + p.clicks + '</td>' +
              '<td class="num hide-sm">' + p.views_all + '</td><td class="num hide-sm">' + p.clicks_all + '</td></tr>';
          }).join('') + '<tr class="total-row"><td><b>Total</b></td><td class="num"><b>' + t.views + '</b></td><td class="num"><b>' + t.clicks + '</b></td>' +
          '<td class="num hide-sm"><b>' + t.views_all + '</b></td><td class="num hide-sm"><b>' + t.clicks_all + '</b></td></tr></tbody></table></div>'
          : empty('No views yet', 'Counts appear here once your puppies are listed and buyers start opening their pages.', '<a class="btn" href="#/litters">Litters and puppies</a>')) + '</section>' +
        '<p class="hint">A view is counted when a puppy\'s page opens, and a click when someone follows your website, phone or email link from it.</p>');
    });
  }

  // ------------------------------------------------------------ account (plan P2.7, launch workplan A24 to A26)
  function personLine(m) {
    if (m.joined_at) return 'Signed in first on ' + esc(day(m.joined_at));
    if (m.invite_open_until) return 'Invited, link open until ' + esc(day(m.invite_open_until));
    return 'Added on ' + esc(day(m.added_at)) + ', not signed in yet';
  }

  /* The QR code is drawn by the vendored MIT generator (/qrcode.js), loaded only when it is needed. */
  function withQr(fn) {
    if (window.qrcode) return fn();
    var s = document.createElement('script'); s.src = '/qrcode.js?v=1'; s.onload = fn; s.onerror = fn; document.head.appendChild(s);
  }
  function qrSvg(text) {
    if (!window.qrcode) return '';
    var q = window.qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true, alt: 'QR code to scan with your authenticator app' });
  }

  function authenticatorDrawer() {
    api('POST', '/api/account/authenticator', {}).then(function (t) {
      withQr(function () {
        openDrawer('Set up an authenticator app',
          '<ol class="setup-steps"><li>Open an authenticator app on your phone, such as Google Authenticator, Microsoft Authenticator or 1Password.</li>' +
          '<li>Add an account and scan this code.</li></ol>' +
          '<div class="qr-box">' + qrSvg(t.uri) + '</div>' +
          '<p class="small">Cannot scan it? Type this key into the app instead, as a time-based key:</p><p class="secret-key"><code>' + esc(t.secret) + '</code></p>' +
          '<form id="totp-confirm" novalidate><div class="field"><label for="totp-code">The six numbers the app shows now</label>' +
          '<input id="totp-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="7" required class="code-input"></div>' +
          '<div class="btn-row"><button class="btn btn-primary" type="submit">Turn on</button></div></form>',
        function (d) {
          var f = $('#totp-confirm', d);
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            api('POST', '/api/account/authenticator/confirm', { code: $('#totp-code', d).value }).then(function (r) {
              $('.drawer-body', d).innerHTML = '<p><b>Your authenticator is on.</b> From now on, signing in asks for the six numbers from the app after your password.</p>' +
                '<p>Keep these recovery codes somewhere safe, away from your phone, such as printed in a drawer. If you lose your phone, each one signs you in once. This is the only time they are shown.</p>' +
                '<ul class="recovery-codes">' + r.recovery_codes.map(function (x) { return '<li><code>' + esc(x) + '</code></li>'; }).join('') + '</ul>' +
                '<div class="btn-row"><button class="btn btn-primary" type="button" id="codes-saved">I have saved these</button></div>';
              $('#codes-saved', d).addEventListener('click', function () { closeDrawer(); refreshMe().then(accountScreen); });
            }).catch(function (err) { showError(f, err); });
          });
        });
      });
    }).catch(function (err) { toast(err.message); });
  }

  function makeMainDrawer(m, A) {
    openDrawer('Make main contact',
      '<p><b>' + esc(m.name || m.email) + '</b> becomes the main contact for your kennel. Puppy Connection emails account notices to the main contact.</p>' +
      '<form id="main-form"><fieldset class="field"><legend>What happens to ' + esc(A.email) + '</legend>' +
      '<label class="check"><input type="radio" name="old" value="keep" checked> Keep it as a person who can sign in</label>' +
      '<label class="check"><input type="radio" name="old" value="remove"> Remove it, and sign it out everywhere</label></fieldset>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Make main contact</button></div></form>',
    function (d) {
      var f = $('#main-form', d);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var keep = $('input[name=old]:checked', d).value === 'keep';
        api('POST', '/api/account/members/' + m.id + '/main', { keep_old: keep }).then(function (r) {
          closeDrawer();
          if (r && r.signed_out) { state.me = null; location.hash = '#/'; render(); toast('The main contact changed and you are signed out'); return; }
          toast('Main contact changed'); refreshMe().then(accountScreen);
        }).catch(function (err) { showError(f, err); });
      });
    });
  }

  function refreshMe() { return api('GET', '/api/me').then(function (me) { state.me = me; }); }

  function accountScreen() {
    api('GET', '/api/account').then(function (A) {
      var req = A.close_request, op = A.operator, S = A.security || {}, acc = A.access || {};
      var howAccess = acc.how === 'existing_arrangement' ? 'recorded by Puppy Connection from the arrangement you already had' : acc.how === 'breeder' ? 'by ' + esc(acc.by) : 'by Puppy Connection';
      shell(head('Account', 'How you sign in, and the choices you have about your account.') +
        (op ? '<p class="notice">You are managing this kennel as Puppy Connection. Passwords, the authenticator, people, access and closing the account stay with the breeder.</p>' : '') +
        '<section class="card"><h2>Signing in</h2><table class="kv"><tbody><tr><td>Main contact email</td><td><b>' + esc(A.email) + '</b></td></tr>' +
        '<tr><td>Signed in on</td><td>' + plural(A.sessions, 'device or browser', 'devices or browsers') + '</td></tr>' +
        (!op && A.signed_in_as && A.signed_in_as.toLowerCase() !== A.email.toLowerCase() ? '<tr><td>You signed in as</td><td><b>' + esc(A.signed_in_as) + '</b></td></tr>' : '') + '</tbody></table>' +
        '<p class="small muted">This address is private. To change it, the main contact can make another person on the kennel the main contact, or Puppy Connection can change it for you.</p></section>' +
        (op ? '' :
          '<section class="card" id="password-card"><h2>Password</h2>' +
          (S.password_set ? '<p>You set your password on ' + esc(day(S.password_set_at)) + '. Changing it signs you out on your other devices.</p>' : '<p>You have not set a password. Set one here to sign in with your email and password as well as with Google.</p>') +
          '<form id="pw-form" class="pw-form" novalidate><input type="email" name="username" value="' + esc(A.signed_in_as || A.email) + '" autocomplete="username" hidden readonly>' +
          (S.password_set ? '<div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" name="current" type="password" autocomplete="current-password" required></div>' : '') +
          '<div class="field"><label for="pw-new">New password</label><input id="pw-new" name="password" type="password" autocomplete="new-password" minlength="10" required></div>' +
          '<div class="field"><label for="pw-again">Confirm password</label><input id="pw-again" name="confirm" type="password" autocomplete="new-password" minlength="10" required></div>' +
          '<p class="hint">At least 10 characters.</p>' +
          '<button class="btn btn-primary" type="submit">' + (S.password_set ? 'Change password' : 'Set password') + '</button></form></section>' +
          '<section class="card" id="totp-card"><h2>Authenticator app <span class="muted small">(recommended)</span></h2>' +
          (S.authenticator
            ? '<p><span class="pill pill-ok">On</span> since ' + esc(day(S.authenticator_since)) + '. Signing in with your password also asks for the six numbers from the app. You have ' + plural(S.recovery_left, 'recovery code') + ' left.</p>' +
              (S.recovery_left <= 3 ? '<p class="notice small">You are running low on recovery codes. Turn the authenticator off and on again to get ten new ones.</p>' : '') +
              '<form id="totp-off" class="btn-row" novalidate><label class="sr" for="off-code">Code from the app or a recovery code</label><input id="off-code" name="code" type="text" autocomplete="one-time-code" placeholder="Code from the app" style="flex:1 1 160px">' +
              '<button class="btn btn-danger" type="submit">Turn off</button></form>'
            : '<p>An authenticator app on your phone adds a six-digit code to your password, so a stolen or guessed password alone cannot open your kennel. It takes about a minute to set up, and you get recovery codes in case you lose your phone.</p>' +
              '<div class="btn-row"><button class="btn btn-gold" id="totp-start" type="button">Set up an authenticator app</button></div>') + '</section>' +
          '<section class="card" id="access-card"><h2>Puppy Connection access</h2>' +
          '<p>Turn this on to let the Puppy Connection team open your portal and manage your profile, litters, puppies and photos for you. Every change they make is recorded under their own name, and they cannot see or change your password or authenticator. Turn it off at any time and any Puppy Connection session on your account ends straight away.</p>' +
          '<label class="check access-toggle"><input type="checkbox" id="access-on"' + (acc.on ? ' checked' : '') + '> Let Puppy Connection manage my account</label>' +
          (acc.at ? '<p class="small muted">' + (acc.on ? 'On' : 'Off') + ' since ' + esc(day(acc.at)) + ', ' + howAccess + '.</p>' : '') + '</section>') +
        '<section class="card" id="members-card"><h2>People who can sign in</h2>' +
        '<p>Add the people who help run your kennel. Each one signs in with their own email address and password, and can do everything you can here.</p>' +
        '<ul class="member-list"><li><div><b>' + esc(A.email) + '</b><div class="small muted">Main contact</div></div></li>' +
        (A.members || []).map(function (m) {
          return '<li><div><b>' + esc(m.name || m.email) + '</b>' + (m.name ? ' <span class="muted">' + esc(m.email) + '</span>' : '') +
            '<div class="small muted">' + personLine(m) + '</div></div>' +
            (op ? '' : '<div class="btn-row">' + (A.is_main ? '<button class="btn btn-sm" type="button" data-make-main="' + esc(m.id) + '">Make main contact</button>' : '') +
              '<button class="btn btn-sm btn-danger" type="button" data-remove-member="' + esc(m.id) + '" data-email="' + esc(m.email) + '">Remove</button></div>') + '</li>';
        }).join('') + '</ul>' +
        (op ? '' : (A.members || []).length < (A.max_members || 5)
          ? '<form id="member-form" class="member-form" novalidate><div class="field"><label for="member-name">Name</label><input id="member-name" name="name" type="text" autocomplete="off" maxlength="120"></div>' +
            '<div class="field"><label for="member-email">Email address</label><input id="member-email" name="email" type="email" autocomplete="off" maxlength="200" required></div>' +
            '<button class="btn btn-primary" type="submit">Add person</button></form><p class="small muted">We email them a link to choose their password. It works once and lasts 7 days.</p>'
          : '<p class="small muted">A kennel can have up to ' + (A.max_members || 5) + ' extra people. Remove someone to add another.</p>') + '</section>' +
        (op ? '' :
          '<section class="card"><h2>Sign out of every device</h2><p>If a phone or computer was shared or lost, this signs everyone in your kennel out everywhere at once, including here and any Puppy Connection session. Each person can sign straight back in with their password.</p>' +
          '<div class="btn-row"><button class="btn" id="signout-all">Sign out of every device</button></div></section>' +
          '<section class="card" id="close-card"><h2>Close your account</h2>' + (req
            ? '<p class="notice">You asked Puppy Connection to close your account on ' + esc(day(req.created_at)) + '. They will be in touch before anything is removed.</p>' +
              '<div class="btn-row"><button class="btn" id="withdraw-close">I changed my mind</button></div>'
            : '<p>If you no longer want to list with Puppy Connection, ask here. Nothing is removed straight away. Puppy Connection will contact you to confirm and to sort out any listings you still have.</p>' +
              '<p class="small muted">Once your account is closed, your profile, photos, videos, documents, listings, saved moms and dads, the people on your account and your sign-ins are removed within 30 days. Records of your payments and of changes to your account are kept for the times the <a href="/privacy" target="_blank" rel="noopener">privacy policy</a> gives.</p>' +
              '<form id="close-form" novalidate><div class="field"><label for="close-reason">Anything you would like to tell us <span class="muted">(optional)</span></label><textarea id="close-reason" name="reason" style="min-height:80px"></textarea></div>' +
              '<button class="btn btn-danger" type="submit">Ask to close my account</button></form>') + '</section>') +
        '<section class="card"><h2>Your information</h2><p>Read how Puppy Connection uses and protects what you give us.</p><div class="btn-row"><a class="btn" href="/privacy" target="_blank" rel="noopener">Privacy policy</a><a class="btn" href="/terms" target="_blank" rel="noopener">Listing terms</a></div></section>', true);
      var soa = $('#signout-all');
      if (soa) soa.addEventListener('click', function () {
        if (!confirm('Sign out of every device, including this one?')) return;
        api('POST', '/auth/signout-all', {}).then(function () { state.me = null; location.hash = '#/'; render(); toast('Signed out everywhere'); });
      });
      var pf = $('#pw-form');
      if (pf) pf.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = formData(pf);
        if (d.password !== d.confirm) return showError(pf, new Error('The two passwords are not the same. Type the same password in both boxes.'));
        api('PUT', '/api/account/password', { current: d.current, password: d.password }).then(function () { toast('Password saved'); accountScreen(); })
          .catch(function (err) { showError(pf, err); });
      });
      var ts = $('#totp-start');
      if (ts) ts.addEventListener('click', authenticatorDrawer);
      var toff = $('#totp-off');
      if (toff) toff.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!confirm('Turn off the authenticator? Your recovery codes stop working too.')) return;
        api('POST', '/api/account/authenticator/off', { code: $('#off-code').value }).then(function () { toast('Authenticator turned off'); accountScreen(); })
          .catch(function (err) { showError(toff, err); });
      });
      var ao = $('#access-on');
      if (ao) ao.addEventListener('change', function () {
        var on = ao.checked;
        if (!on && !confirm('Turn off Puppy Connection access? Any Puppy Connection session on your account ends straight away.')) { ao.checked = true; return; }
        api('PUT', '/api/account/access', { on: on }).then(function () { toast(on ? 'Puppy Connection access is on' : 'Puppy Connection access is off'); accountScreen(); })
          .catch(function (err) { ao.checked = !on; showError($('#access-card'), err); });
      });
      var mf = $('#member-form');
      if (mf) mf.addEventListener('submit', function (e) {
        e.preventDefault();
        api('POST', '/api/account/members', { name: $('#member-name').value, email: $('#member-email').value })
          .then(function () { toast('Person added and invited'); accountScreen(); })
          .catch(function (err) { showError(mf, err); });
      });
      $$('[data-make-main]').forEach(function (b) {
        b.addEventListener('click', function () { makeMainDrawer((A.members || []).filter(function (m) { return m.id === b.dataset.makeMain; })[0], A); });
      });
      $$('[data-remove-member]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Remove ' + b.getAttribute('data-email') + '? They will be signed out and can no longer sign in to your kennel.')) return;
          api('DELETE', '/api/account/members/' + b.getAttribute('data-remove-member')).then(function (r) {
            if (r && r.signed_out) { state.me = null; location.hash = '#/'; render(); toast('You removed yourself and are signed out'); return; }
            toast('Person removed'); accountScreen();
          }).catch(function (err) { showError($('#members-card'), err); });
        });
      });
      var cf = $('#close-form');
      if (cf) cf.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!confirm('Ask Puppy Connection to close your account?')) return;
        api('POST', '/api/account/close', { reason: $('#close-reason').value }).then(function () { toast('Request sent'); accountScreen(); })
          .catch(function (err) { showError(cf, err); });
      });
      var w = $('#withdraw-close');
      if (w) w.addEventListener('click', function () {
        api('POST', '/api/account/close/withdraw', {}).then(function () { toast('Request withdrawn'); accountScreen(); })
          .catch(function (err) { showError($('#close-card'), err); });
      });
    });
  }

  // ------------------------------------------------------------ help (plan P2.8)
  function help() {
    var me = state.me, c = state.config || {};
    var fee = money(me.fee_cents);
    var photos = me.min_photos === 1 ? 'at least one photo' : 'at least ' + me.min_photos + ' photos';
    var lasts = me.listing_days > 0 ? 'Each payment lists a puppy for ' + me.listing_days + ' days, and you can renew it near the end date.'
      : 'You pay once, and the listing stays up with no end date while you add a new photo of the puppy at least every four weeks. There is nothing to renew.';
    function q(title, body) { return '<section class="card help"><h2>' + esc(title) + '</h2>' + body + '</section>'; }
    shell(head('Help', 'Short answers to the questions breeders ask most.') +
      q('How do I get approved?', '<p>Fill in your profile with your business name, a phone or email buyers can use, and your town and state. Then name one reference who can confirm you are a real breeder, such as your veterinarian, another respected breeder, an AKC representative or a board member of your local animal welfare council. Accept the listing terms and submit. Puppy Connection looks over every new breeder once before they can list, and emails you when your account is approved. After that your listings go live without waiting.</p><p>Until then you can still edit your profile, and the menu shows only what you can use.</p>') +
      q('How does listing work?', '<p>Add a litter first, with the breed and the dates. Then add each puppy to it with a price and ' + photos + '. If a litter has several puppies, use Add several to put them all in at once, then rename each one and add its photos.</p><p>A puppy stays a draft, which only you can see, until you pay to list it. The Litters and puppies screen says what each draft still needs.</p>') +
      q('What does it cost?', '<p>Listing costs ' + esc(fee) + ' per puppy. ' + esc(lasts) + '</p><p>You can pay for a whole litter in one go on the Pay to list screen. Payment is by card through Stripe, and Stripe emails your receipt. Puppy Connection never sees your card number.</p>') +
      q('How do I keep a listing on the site?', '<p>Add a new photo of the puppy at least every four weeks. A listing kept current this way stays up with no end date, until the puppy goes home or you remove it. Puppies change fast, and families get in touch far more often when the photos show the puppy as it looks today. Only a new photo counts, so changing the price or saying the puppy is still available does not.</p>' +
        '<p>After four weeks with no new photo we email you that the listing goes offline in two weeks, and after five weeks that it goes offline the next week. Each email links straight to the puppy\'s photos, and the top of the portal lists every listing that needs one and by when.</p>' +
        '<p>At six weeks the listing comes off the site. Add a new photo within the next six weeks and it goes straight back, free. After twelve weeks it is removed, but everything is kept in Litters and puppies, and you can relist it for ' + esc(fee) + ' without entering it again.</p>') +
      q('What happens when a puppy goes home?', '<p>Mark it placed, either from the list or in the puppy\'s own page in the portal. It stays on the site marked as placed, so buyers can still see the litter and know that puppy is spoken for. You can mark it available again if plans change.</p><p>If you would rather take a puppy off the site entirely, open it and choose Remove puppy.</p>') +
      q('What makes a good photo?', '<p>' + esc(PHOTO_STANDARD) + '</p><p>Clear daylight photos of one puppy at a time work best, and the first photo is the one buyers see first. A puppy can have up to ' + me.max_photos + ' photos.</p><p>The portal makes each photo smaller before it uploads, so large phone photos are fine, and it removes the hidden location and camera details phones add.</p>' +
        '<p>Photos need to be at least 1,000 pixels across. Each one is checked that the puppy can be seen clearly, and if it cannot, for example because the puppy is far away, turned around or blurred, the portal says what is wrong so you can upload a better one.</p>') +
      q('How do I sign in?', '<p>Sign in with your email address and password' + (c.google ? ', or choose Continue with Google' : '') + '. If you have never set a password, or have forgotten it, press Forgot password on the sign-in screen and we email you a link to set one. The link works once and lasts an hour.</p>' +
        '<p>We recommend adding an authenticator app on the Account screen. Signing in then also asks for a six-digit code from your phone, and you get recovery codes in case you lose the phone. If you lose the phone and the codes, Puppy Connection can reset it for you.</p>' +
        '<p>You stay signed in on that device for 60 days, and each time you use the portal the 60 days start again. If you lose a phone or used a shared computer, use Sign out of every device on the Account screen.</p>') +
      q('Who can see what?', '<p>Buyers see your business name, the phone and email you give for them, your website, your town and state, and the words about your kennel. Your sign-in email and contact name stay private. The <a href="/privacy" target="_blank" rel="noopener">privacy policy</a> has the details.</p>'), true);
  }

  // ------------------------------------------------------------ router
  function render() {
    closeDrawer();
    state.route = (location.hash || '#/').replace(/^#\/?/, '');
    if (!state.me) {
      // Workplan A12. An emailed Add a photo link opens the puppy after sign-in, in this browser.
      if (/^litters\?photos=/.test(state.route)) { try { localStorage.setItem('pc-next', state.route); } catch (e) { /* storage off */ } }
      return renderSignIn();
    }
    var next = null;
    try { next = localStorage.getItem('pc-next'); if (next) localStorage.removeItem('pc-next'); } catch (e) { next = null; }
    if (next && !state.route) { location.replace('#/' + next); return; }
    var r = state.route.split('?')[0];
    var q = state.route.split('?')[1] || '';
    if (r === 'listings') {
      if (q.indexOf('paid=') >= 0) toast(q.indexOf('result=paid') >= 0 ? 'Payment received. Your puppies appear on the site within a few minutes.' : 'Payment received. Your listings will go live shortly.');
      location.replace('#/litters');
      return;
    }
    var allowed = OPEN_TO[state.me.status];
    if (allowed && allowed.indexOf(r) < 0) { if (r) { location.replace('#/'); return; } }
    window.scrollTo(0, 0);
    ({ '': overview, profile: profile, litters: litters, parents: parentsView, pay: pay, payments: payments, stats: stats, account: accountScreen, help: help }[r] || overview)();
  }

  window.addEventListener('hashchange', function () {
    api('GET', '/api/me').then(function (me) { state.me = me; render(); }).catch(function () { state.me = null; render(); });
  });

  api('GET', '/api/config').then(function (c) { state.config = c; })
    .then(function () { return fetch('/api/me', { credentials: 'same-origin' }); })
    // Workplan A27. A person on several kennels who has not picked one goes to Choose a kennel.
    .then(function (res) { if (res.status === 409) { location.replace('/choose'); return new Promise(function () {}); } return res.ok ? res.json() : null; })
    .then(function (me) { state.me = me; render(); })
    .catch(function () { state.me = null; render(); });
})();
