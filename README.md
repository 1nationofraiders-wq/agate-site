# Agate Lens storefront

A plain HTML/CSS/JS static storefront for Agate Lens: a free field-journal app,
digital Pro features, and physical light kits. No build step, no npm, no
framework — upload the files as-is.

> ## ⚠️ IMPORTANT — READ BEFORE GOING LIVE
>
> **The legal page text (Terms of Service, Refund & Return, Shipping, and the
> surrounding Contact/Privacy page text) is a TEMPLATE, not legal advice.** It
> contains `[BRACKETED PLACEHOLDERS]` and incomplete clauses. A qualified
> lawyer **and** accountant must review and complete it before this site is
> published. Do not treat it as a functioning policy.
>
> The published privacy policy is a separate authoritative document and is
> **linked, not duplicated**, at
> https://1nationofraiders-wq.github.io/agate-lens-privacy/

## Placeholder safety

- All prices and store URLs in the catalog are **placeholders**. On-site every
  product is labelled **"Price and link to be confirmed"**. No price is shown
  as final and there are no working buy links.
- Product names and SKU slugs are reused exactly from
  `agate-server/catalog.json`: `agate-lens-free`, `agate-lens-pro`,
  `kit-starter`, `kit-journeyman`, `kit-pro`.
- Physical kit registration codes prove **kit ownership and support only**.
  They do **not** unlock digital Pro features.
- Digital Pro is sold through **Google Play Billing inside the app**.
- **No payment or card handling exists anywhere on this site.**

## Shared app hub

`hub.html` is the page all apps link to for winners, appreciation and
sponsors. It reads `GET /api/hub/winners`, `/api/hub/appreciation` and
`/api/hub/partners` from the backend; if the API is unreachable it shows an
empty-state message. There is deliberately no public posting form.

Seed an entry on the backend with an admin key:

```
curl -X PUT http://HOST/api/hub/docs/winners/<id> \
  -H 'X-API-Key: <your-key>' -H 'Content-Type: application/json' \
  -d '{"title":"...","app":"agate-lens","note":"..."}'
```

Sponsored entries must be labelled as sponsored. This page is a hub, not an ad
network: no click tracking, no third-party ad serving, and no sharing personal
data with sponsors. Advertising would need its own disclosure and privacy
review before launch.

## Files

| File | Purpose |
|---|---|
| `index.html` | Storefront: notices, catalog cards, product detail sections |
| `downloads.html` | Direct APK page: version, checksum, install warnings |
| `hub.html` | Shared app hub: winners, appreciation, partners |
| `js/releases.js` | Loads `/api/releases/{app}/latest`, falls back to bundled JSON |
| `releases/agate-lens.json` | Bundled latest-release copy written by the publisher |
| `js/hub.js` | Reads the public `/api/hub/...` feeds; no public write route |
| `privacy.html` | Links to the externally hosted privacy policy (no copy) |
| `terms.html` | Terms of Service — template |
| `refunds.html` | Refund & Return — template |
| `shipping.html` | Shipping — template |
| `contact.html` | About and contact — template |
| `config.js` | Single config: backend API base URL, catalog path, fallback file, privacy URL |
| `js/products.js` | Fetches catalog, renders cards, falls back to bundled JSON |
| `catalog.json` | Bundled fallback copy of the backend catalog |
| `css/styles.css` | Responsive styles |

## Configure

Edit **`config.js`** — it is the only place the backend base URL lives:

```js
window.AGATE_CONFIG = Object.freeze({
  API_BASE_URL: 'http://192.168.12.243:8765', // <-- edit to your backend
  CATALOG_PATH: '/api/store/catalog',
  FALLBACK_CATALOG: 'catalog.json',
  RELEASE_PATH: '/api/releases/agate-lens/latest',
  FALLBACK_RELEASE: 'releases/agate-lens.json',
  PRIVACY_POLICY_URL: 'https://1nationofraiders-wq.github.io/agate-lens-privacy/'
});
```

`js/products.js` calls `GET /api/store/catalog` first. On any failure
(non-OK status, timeout, bad JSON, unreachable host) it loads the bundled
`catalog.json` instead and shows which source was used in the page status line.
If both fail, it says so and keeps the static product detail sections visible.

**HTTPS/mixed content:** an `http://` API URL will be blocked by browsers when
this site is served over HTTPS. For production, put the backend behind HTTPS
(for example a Cloudflare Tunnel at `api.yourdomain.com`) and set
`API_BASE_URL` to that HTTPS URL. The bundled fallback still works if the API
is unreachable.

## Direct APK downloads

`downloads.html` is the download page. It calls `GET /api/releases/agate-lens/latest`
and falls back to `releases/agate-lens.json` when the API is unreachable, so the
page still shows the version, size and SHA-256. The actual APK lives on the
backend at `/downloads/agate-lens/<file>.apk`, not in this repository.

Publishing is done on the backend machine with `publish_release.py` (see
`~/agate-server/README.md`); pass `--site-release-file` to refresh the bundled
copy here. Keep the two in sync when you publish a new version.

The app's update checker is a separate opt-in build flag. It reads either the
backend endpoint or the static JSON at an HTTPS URL; the current pilot release
is built with the static URL
`https://1nationofraiders-wq.github.io/agate-site/releases/agate-lens.json`.
That URL only works once this site is deployed, and the bundled release file
currently points at the LAN backend for its download link. Replace both with
your real domain before public distribution.

## Deploy — GitHub Pages

1. Push this directory to a repository under the `1nationofraiders-wq`
   organisation (for example `agate-site`).
2. In the repo, go to **Settings → Pages**.
3. Source: **Deploy from a branch** → branch `main` → folder `/ (root)`.
4. Save. The site will be at `https://1nationofraiders-wq.github.io/agate-site/`.
5. Relative paths are used throughout, so the site also works from a
   project subdirectory. If you use a custom domain or a different repo name,
   no code change is needed for the static files — only `config.js` for the API.

## Deploy — Cloudflare Pages

1. Push this directory to a Git repository.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repo and branch.
4. Build settings:
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (the repository root, where `index.html` lives)
5. Deploy. No environment variables or dependencies are required.
6. Set `API_BASE_URL` in `config.js` to your HTTPS backend before the final deploy.

## Serve locally (no build)

```sh
cd ~/agate-site
python3 -m http.server 8000
# open http://localhost:8000/
```

Or: `node -e "require('http')"`-based servers, `php -S localhost:8000`, etc.
Opening `index.html` directly via `file://` also works for the static content,
though the catalog fetch may be blocked by the browser — the bundled fallback
covers that case.

## Before launch checklist

- [ ] Lawyer/accountant reviewed and completed every legal page.
- [ ] Bracketed placeholders (`[TO BE CONFIRMED]`, emails, entity name, jurisdiction) replaced.
- [ ] Final prices and real store URLs confirmed and catalog updated on the backend.
- [ ] On-site "Price and link to be confirmed" labels removed only once links are final.
- [ ] `API_BASE_URL` points to an HTTPS backend.
- [ ] Confirm Play Billing setup and kit-code flow in the app/backend (this site does neither).
- [ ] Deploy the site so the app's static update-check URL exists, and replace
      the LAN `download_url` in `releases/agate-lens.json` with the real domain.
- [ ] Lawyer review of sideload/install warnings and update/distribution terms.
