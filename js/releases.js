/*
 * Latest APK release loader.
 *
 * Reads the backend release API first and falls back to the bundled JSON copy
 * so the download page still works when the backend is offline (or when the
 * site is served over HTTPS and the API is plain HTTP).
 */
(function () {
  'use strict';

  var config = window.AGATE_CONFIG || {};

  function text(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function show(release, source) {
    if (!release) {
      text('release-status', 'No APK has been published yet.');
      return;
    }
    text('release-version', release.version || 'unknown');
    text('release-code', String(release.version_code || 0));
    text('release-size', release.size_bytes
      ? (release.size_bytes / 1048576).toFixed(1) + ' MB'
      : 'unknown');
    text('release-sha256', release.sha256 || 'not recorded');
    text('release-notes', release.notes || 'No release notes.');
    text('release-date', release.published_at
      ? new Date(release.published_at).toISOString().slice(0, 10)
      : 'unknown');
    text('release-status', 'Latest release loaded from ' + source + '.');

    var link = document.getElementById('download-link');
    if (link && release.download_url) {
      link.href = release.download_url;
      link.removeAttribute('aria-disabled');
      link.classList.remove('disabled');
    }
  }

  function getJSON(url) {
    var controller = typeof AbortController === 'function'
      ? new AbortController() : null;
    var timer = controller ? setTimeout(function () {
      controller.abort();
    }, 5000) : null;
    var options = controller ? { signal: controller.signal } : {};
    return fetch(url, options).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function load() {
    var api = config.API_BASE_URL && config.RELEASE_PATH
      ? config.API_BASE_URL + config.RELEASE_PATH
      : null;
    var fallback = config.FALLBACK_RELEASE;

    var attempt = api
      ? getJSON(api).then(function (data) {
          show(data, 'the backend');
          return true;
        }).catch(function () { return false; })
      : Promise.resolve(false);

    attempt.then(function (ok) {
      if (ok || !fallback) return;
      return getJSON(fallback).then(function (data) {
        show(data, 'the bundled release file');
      }).catch(function () {
        text('release-status',
          'Release information is unavailable right now. No APK link is shown.');
      });
    });
  }

  if (document.getElementById('release-status')) load();
}());
