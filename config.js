/*
 * Agate Lens storefront — single configuration file.
 *
 * This is the ONLY place the backend base URL is defined.
 * Edit API_BASE_URL to point this storefront at your backend.
 *
 * Production note: use an HTTPS URL (for example a Cloudflare Tunnel in
 * front of the backend at api.yourdomain.com). An http:// address will be
 * blocked by browsers when this site is served over HTTPS (mixed content),
 * in which case the bundled catalog.json fallback is used automatically.
 */
window.AGATE_CONFIG = Object.freeze({
  // Public static hosting has no backend yet; an empty value makes the
  // bundled catalog/release files the source with no mixed-content requests.
  API_BASE_URL: '',
  CATALOG_PATH: '/api/store/catalog',
  FALLBACK_CATALOG: 'catalog.json',
  RELEASE_PATH: '/api/releases/agate-lens/latest',
  FALLBACK_RELEASE: 'releases/agate-lens.json',
  LEADS_PATH: '/api/store/leads',
  // Leave blank on free static hosting: entries are saved in the browser and
  // opened as a pre-filled email. Set this to the address that should receive
  // quote requests and giveaway entries.
  CONTACT_EMAIL: '',
  PRIVACY_POLICY_URL: 'https://1nationofraiders-wq.github.io/agate-lens-privacy/'
});
