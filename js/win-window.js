/*
 * The "Win Window": an honest giveaway popup for a free app build.
 *
 * No purchase is needed, we never claim the visitor has already won, and the
 * full rules are one click away. The entry form is handled by js/leads.js.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'agate-win-window-seen';
  var modal = null;
  var lastFocus = null;

  var MARKUP = '' +
    '<div class="win-backdrop" id="win-window" hidden>' +
    '  <div class="win-dialog" role="dialog" aria-modal="true" aria-labelledby="win-title">' +
    '    <button class="win-close" type="button" aria-label="Close">&times;</button>' +
    '    <p class="eyebrow">Free build giveaway</p>' +
    '    <h2 id="win-title">Win a free app build</h2>' +
    '    <p>One winner per draw gets a Starter app build ($149 value) — designed and built by us. Enter your idea for a chance to win.</p>' +
    '    <div class="win-body">' +
    '      <form data-lead-form data-source="win_entry" class="lead-form">' +
    '        <label>Your name <input name="name" type="text" required maxlength="80" autocomplete="name" placeholder="Your name"></label>' +
    '        <label>Email <input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com"></label>' +
    '        <label>Your app idea <span class="hint">(optional)</span><textarea name="idea" rows="3" maxlength="500" placeholder="What would you like an app to do?"></textarea></label>' +
    '        <label class="check"><input name="consent" type="checkbox" required> I agree to be contacted about this giveaway and about app-building services.</label>' +
    '        <button class="button" type="submit">Enter the draw</button>' +
    '        <p class="form-status" data-form-status role="status"></p>' +
    '      </form>' +
    '      <p class="win-fine">No purchase necessary. One entry per email. Odds depend on the number of entries. ' +
    '        <a href="win-rules.html">Read the full rules</a>. We never sell or share your details.</p>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  function create() {
    if (document.getElementById('win-window')) return;
    var holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    document.body.appendChild(holder.firstChild);
    modal = document.getElementById('win-window');

    modal.querySelector('.win-close').addEventListener('click', close);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
    document.addEventListener('agate-lead-ok', function (event) {
      if (!event.detail || event.detail.source !== 'win_entry') return;
      var body = modal.querySelector('.win-body');
      body.innerHTML = '<p class="win-thanks"><strong>You are in.</strong> Thanks for entering — we will email the winner after the draw. ' +
        'Want to skip the wait? <a href="build-for-you.html">See our app-build service.</a></p>' +
        '<p class="win-fine"><a href="win-rules.html">Full rules</a></p>';
    });
  }

  function open() {
    create();
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var input = modal.querySelector('input[name="name"]');
    if (input) input.focus();
  }

  function close() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function start() {
    create();
    Array.prototype.forEach.call(document.querySelectorAll('.win-trigger'), function (button) {
      button.addEventListener('click', open);
    });
    var delay = parseInt(document.body.getAttribute('data-win-auto') || '', 10);
    if (delay > 0 && !sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(function () {
        if (!modal || !modal.hidden) return;
        sessionStorage.setItem(SESSION_KEY, '1');
        open();
      }, delay);
    }
  }

  window.WinWindow = { open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
