/*
 * Catalog-driven product cards.
 * Source order: live backend API first, bundled catalog.json on any failure.
 * Prices and store URLs are deliberately NEVER shown as final: every product
 * is labelled "Price and link to be confirmed".
 */
(function () {
  'use strict';

  var PLACEHOLDER = 'Price and link to be confirmed';
  var cfg = window.AGATE_CONFIG || {};
  var STATUS_ID = 'catalog-status';

  function setStatus(text, isError) {
    var node = document.getElementById(STATUS_ID);
    if (!node) return;
    node.textContent = text;
    node.style.color = isError ? '#8a4a12' : '';
  }

  function normalize(payload) {
    var list = Array.isArray(payload) ? payload : (payload && payload.products);
    if (!Array.isArray(list)) throw new Error('Unexpected catalog shape');
    return list.filter(function (p) {
      return p && p.slug && p.name && p.active !== false;
    }).slice().sort(function (a, b) {
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
  }

  function kindOf(p) {
    var k = String(p.kind || '').toLowerCase();
    if (k === 'free' || k === 'digital' || k === 'kit') return k;
    return 'other';
  }

  var LABELS = {
    free: 'Free',
    digital: 'Digital Pro — Play Billing',
    kit: 'Physical light kit',
    other: 'Product'
  };

  var NOTES = {
    free: 'The free Agate Lens app. No purchase needed.',
    digital: 'Digital Pro features are purchased inside the app through Google Play Billing, not on this site.',
    kit: 'A physical light kit. Registration codes prove kit ownership and support only — they do NOT unlock digital Pro features.',
    other: 'Details to be confirmed.'
  };

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildCard(p) {
    var kind = kindOf(p);
    var card = make('article', 'product-card product-card--' + kind);
    card.setAttribute('data-slug', p.slug);

    var head = make('div', 'product-card__head');
    head.appendChild(make('span', 'badge badge--' + kind, LABELS[kind]));
    var slug = make('code', 'slug', p.slug);
    slug.setAttribute('title', 'SKU / slug (from catalog)');
    head.appendChild(slug);

    card.appendChild(head);
    card.appendChild(make('h3', 'product-card__title', p.name));
    card.appendChild(make('p', 'placeholder', PLACEHOLDER));
    card.appendChild(make('p', 'product-card__note', NOTES[kind]));
    return card;
  }

  function render(products) {
    var groups = { free: [], digital: [], kit: [], other: [] };
    products.forEach(function (p) { groups[kindOf(p)].push(p); });

    Object.keys(groups).forEach(function (kind) {
      var container = document.getElementById('cards-' + kind);
      if (!container) return;
      container.textContent = '';
      if (!groups[kind].length) {
        container.appendChild(make('p', 'catalog-status', 'No products of this type in the catalog.'));
        return;
      }
      groups[kind].forEach(function (p) { container.appendChild(buildCard(p)); });
    });
  }

  function fetchJson(url, timeoutMs) {
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs || 8000) : null;
    var opts = { cache: 'no-store' };
    if (controller) opts.signal = controller.signal;
    return fetch(url, opts).then(function (res) {
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

  function load() {
    var base = String(cfg.API_BASE_URL || '').replace(/\/+$/, '');
    var path = cfg.CATALOG_PATH || '/api/store/catalog';
    var fallback = cfg.FALLBACK_CATALOG || 'catalog.json';

    if (!base) {
      return fetchJson(fallback, 8000).then(function (data) {
        render(normalize(data));
        setStatus('Source: bundled fallback ' + fallback +
          ' (public hosting, no API configured). ' + PLACEHOLDER + '.');
      }).catch(function () {
        setStatus('Catalog could not be loaded from the bundled copy. ' +
          PLACEHOLDER + '.', true);
      });
    }

    return fetchJson(base + path, 8000)
      .then(function (data) {
        render(normalize(data));
        setStatus('Source: live catalog API (' + base + path + '). ' + PLACEHOLDER + '.');
      })
      .catch(function () {
        return fetchJson(fallback, 8000).then(function (data) {
          render(normalize(data));
          setStatus('Source: bundled fallback ' + fallback + ' (API unreachable). ' + PLACEHOLDER + '.');
        }).catch(function () {
          setStatus('Catalog could not be loaded from the API or the bundled copy. ' + PLACEHOLDER + '.', true);
        });
      });
  }

  function start() {
    if (!document.getElementById('cards-free')) return;
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
