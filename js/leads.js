/*
 * Shared lead-form handler for the app-build ad page and the win window.
 *
 * When the backend is configured (config.js API_BASE_URL), submissions go to
 * POST /api/store/leads and land in the admin-only inbox. With no backend
 * configured (public static hosting), the entry is saved in this browser and
 * — if CONTACT_EMAIL is set — opened as a pre-filled email so the lead still
 * reaches us instead of silently disappearing.
 */
(function () {
  'use strict';

  var cfg = window.AGATE_CONFIG || {};
  var base = String(cfg.API_BASE_URL || '').replace(/\/+$/, '');
  var path = cfg.LEADS_PATH || '/api/store/leads';
  var contactEmail = String(cfg.CONTACT_EMAIL || '').trim();
  var STORE_KEY = 'agate-pending-leads';

  function savePending(payload) {
    var pending = [];
    try { pending = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { pending = []; }
    if (!Array.isArray(pending)) pending = [];
    pending.push(Object.assign({ created_at: Date.now() }, payload));
    try { localStorage.setItem(STORE_KEY, JSON.stringify(pending.slice(-50))); } catch (e) { /* storage full */ }
  }

  function openMail(payload) {
    if (!contactEmail) return;
    var body = 'Source: ' + payload.source + '\nName: ' + payload.name +
      '\nEmail: ' + payload.email + '\nIdea: ' + (payload.idea || '(none)') +
      '\n\nI consented to being contacted about this enquiry.';
    window.location.href = 'mailto:' + contactEmail +
      '?subject=' + encodeURIComponent('App-build enquiry: ' + payload.source) +
      '&body=' + encodeURIComponent(body);
  }

  function send(payload) {
    if (!base) {
      savePending(payload);
      var emailed = !!contactEmail;
      openMail(payload);
      return Promise.resolve({ ok: false, offline: true, emailed: emailed });
    }
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    };
    if (controller) opts.signal = controller.signal;
    return fetch(base + path, opts).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  window.AgateLeads = { send: send };

  function bind(form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var field = function (name) {
        var node = form.elements[name];
        return node ? String(node.value || '').trim() : '';
      };
      var payload = {
        source: form.getAttribute('data-source') || 'build_quote',
        name: field('name'),
        email: field('email'),
        idea: field('idea'),
        consent: !!(form.elements.consent && form.elements.consent.checked)
      };
      if (status) status.textContent = 'Sending…';
      if (button) button.disabled = true;
      send(payload).then(function (result) {
        if (status) {
          if (result && result.offline) {
            status.textContent = result.emailed
              ? 'Saved on this device and opened in your email app — please send the pre-filled email to reach us.'
              : 'Saved on this device. Our live form is not connected yet — set CONTACT_EMAIL in config.js so entries can be emailed to us.';
          } else {
            status.textContent = 'Thanks — we received your entry and will be in touch.';
          }
        }
        form.reset();
        document.dispatchEvent(new CustomEvent('agate-lead-ok', {
          detail: Object.assign({}, payload, {
            offline: !!(result && result.offline),
            emailed: !!(result && result.emailed)
          })
        }));
      }).catch(function () {
        if (status) status.textContent = 'Could not send right now. Please try again in a moment.';
      }).then(function () {
        if (button) button.disabled = false;
      });
    });
  }

  function start() {
    var forms = document.querySelectorAll('form[data-lead-form]');
    Array.prototype.forEach.call(forms, bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
