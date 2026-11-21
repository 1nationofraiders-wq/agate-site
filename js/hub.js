/*
 * Shared app hub: winners, appreciation and partners.
 * All feeds are READ-ONLY. Content is seeded on the server with an admin key,
 * so this page cannot be used as an open posting form.
 */
(function () {
  'use strict';

  var cfg = window.AGATE_CONFIG || {};
  var base = String(cfg.API_BASE_URL || '').replace(/\/+$/, '');

  function fetchJson(path) {
    if (!base) return Promise.reject(new Error('No backend configured'));
    var controller = (typeof AbortController !== 'undefined')
      ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    var opts = { cache: 'no-store' };
    if (controller) opts.signal = controller.signal;
    return fetch(base + path, opts).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (timer) clearTimeout(timer);
      return data;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function card(item, badgeText) {
    var node = el('article', 'hub-card');
    var head = el('div', 'hub-card__head');
    head.appendChild(el('span', 'badge', badgeText || 'Posted'));
    if (item.app) head.appendChild(el('code', 'slug', item.app));
    node.appendChild(head);
    node.appendChild(el('h3', 'hub-card__title', item.title || 'Untitled'));
    if (item.note || item.message) {
      node.appendChild(el('p', 'hub-card__note', item.note || item.message));
    }
    if (item.url) {
      var link = el('a', 'hub-card__link', 'Learn more');
      link.href = item.url;
      link.rel = 'noopener noreferrer';
      node.appendChild(link);
    }
    return node;
  }

  function renderFeed(path, id, badge, emptyText) {
    var container = document.getElementById(id);
    if (!container) return Promise.resolve();
    return fetchJson(path).then(function (data) {
      var items = (data && data.items) || [];
      container.textContent = '';
      if (!items.length) {
        container.appendChild(el('p', 'catalog-status', emptyText));
        return;
      }
      items.forEach(function (item) { container.appendChild(card(item, badge)); });
    }).catch(function () {
      container.textContent = '';
      container.appendChild(el('p', 'catalog-status',
        'Feed unavailable right now. ' + emptyText));
    });
  }

  function renderBrag() {
    var container = document.getElementById('hub-brag');
    if (!container) return Promise.resolve();
    return fetchJson('/api/agate/brag').then(function (data) {
      var finds = (data && data.finds) || [];
      container.textContent = '';
      if (!finds.length) {
        container.appendChild(el('p', 'catalog-status',
          'No featured Agate Lens finds yet.'));
        return;
      }
      finds.slice(0, 3).forEach(function (f) {
        var node = el('article', 'hub-card');
        node.appendChild(el('h3', 'hub-card__title', f.title || 'Untitled find'));
        node.appendChild(el('p', 'hub-card__note',
          Math.round(Number(f.translucency_pct || 0)) + '% translucency · ' +
          (f.votes || 0) + ' votes'));
        if (f.photo_url) {
          var img = document.createElement('img');
          img.src = f.photo_url;
          img.alt = f.title || 'Featured find';
          img.className = 'hub-card__image';
          img.loading = 'lazy';
          node.appendChild(img);
        }
        container.appendChild(node);
      });
    }).catch(function () {
      container.textContent = '';
      container.appendChild(el('p', 'catalog-status',
        'Agate Lens board unavailable right now.'));
    });
  }

  function start() {
    renderFeed('/api/hub/winners', 'hub-winners', 'Winner', 'No winners posted yet.');
    renderFeed('/api/hub/appreciation', 'hub-appreciation', 'Appreciation',
      'No appreciation posts yet.');
    renderFeed('/api/hub/partners', 'hub-partners', 'Sponsored',
      'No partners listed yet.');
    renderBrag();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
