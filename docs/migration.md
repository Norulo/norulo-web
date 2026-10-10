# Norulo Web migration

The Web application was imported from source main commit
`393a8357e11aed0bc519666a29ca7b56e3b28872`. The merge retains both the existing
Norulo repository history and the source main history. The Norulo origin and
existing target LICENSE are preserved. Git history is not rewritten.

Current source text, paths, package identifiers, SEO, six-language copy,
environment prefixes, Worker bindings and REST extension/header names use
Norulo. Browser preferences/events use `nr-`; cookie names use `nr_`, API keys
use `nrk_`, and invitation links use `nri_`, matching the Server migration.
The inline theme bootstrap's CSP hash is regenerated from its exact bytes.

Intended production hosts are `norulo.com`, `www.norulo.com` and
`api.norulo.com`; preview uses `preview.norulo.com` and
`preview-api.norulo.com`. Worker names and bindings target only Norulo names.
These settings are not proof of created Cloudflare resources or domain routing.
The public GitHub App slug is deliberately empty until a real Norulo App is
configured. No provider IDs, credentials or payment facts are invented.

Cloudflare deployment, database activation, cron changes and remote provider
acceptance were not performed by the migration. Existing Cloudflare credentials
are retained in environment settings and never printed or saved in source.
The imported validation directory describes source history, not Norulo release
results. Historical source approvals are not authority for current operations.

The original favicon, inline brand mark, apple-touch icon and raster social card
are preserved pending replacement assets from the user. The SVG social card and
its text generator are updated, but `public/social-card.png` still contains the
source product's name and is not referenced by current SEO. Current metadata
uses the rebranded SVG card; social platform SVG support differs, so a new PNG
card is still needed before publication.

## Local setup

Use the existing cloud checkout; do not create a Git worktree unless explicitly
requested. Node ^20.19.0 or >=22.12.0 is required; Node 24.19.0 is available here.

```sh
npm_config_cache=/workspace/.cache/npm npm ci
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx playwright install chromium firefox webkit
npm run check
npm run check:workers
```

For local development with the Server on port 8080, use the same-origin Vite
proxy so session cookies and trusted Origin handling match:

```sh
VITE_APP_URL=http://localhost:5173 VITE_API_BASE_URL=/api npm run dev -- --strictPort
```

Do not put provider or Cloudflare secrets in VITE variables. Provider-backed
GitHub, email, payment and model workflows require their corresponding configured
Server credentials and a matching current callback/Origin configuration.

## Current local verification

On 2026-10-10, installation with the committed lockfile succeeded using Node
24.19.0 and npm 11.9.0. ESLint passed, and the complete Vitest suite passed with
`npm run test -- --maxWorkers=2`: 83 files and 1,654 tests. The initial default
`npm run check` had one popup test exceed its 1,000ms UI wait; the same test
passed in isolation and the entire suite passed at bounded concurrency without
changing its implementation or assertions.

The production build passed with `VITE_APP_URL=http://127.0.0.1:4248` and
`VITE_API_BASE_URL=/api` for local fixtures. `npm run check:workers`, both Worker
syntax checks, and `python3 scripts/sync-api-contract.py --check` passed.
`npm audit --omit=dev` reported zero production dependency vulnerabilities.

The Projects layout check passed separately in Chromium and WebKit, each with
nine contexts and 69 states, including desktop, touch tablet, 390px phone and
320px layouts in all six languages. The shared date/layout check also passed
in Chromium with four contexts and 258 states across project/shared expenses,
recurring editors, categories and API keys, including live phone-width resizing.
All browser checks used bounded loopback GET fixtures, with no remote API,
business writes or real provider/device acceptance.

Chromium, Firefox and WebKit binaries were downloaded into
`/workspace/.cache/ms-playwright`. After official browser runtime dependencies
were installed into a writable local prefix and verified, the additional checks
ran through the managed environment's `browser-libs/run-with-browser-libs.sh`
wrapper. The wrapper supplies the verified runtime libraries instead of relying
on the host's system-wide library cache. Linux WebKit's native touch-point count
is recorded; these checks do not claim physical iOS acceptance.
