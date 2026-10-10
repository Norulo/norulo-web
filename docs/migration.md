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

Production hosts are `norulo.com`, `www.norulo.com` and `api.norulo.com`.
Retained preview configuration uses `preview.norulo.com` and
`preview-api.norulo.com`; preview has not been deployed. Worker names and
bindings target only Norulo names. The verified public GitHub App slug is
`norulo` ([App](https://github.com/apps/norulo)). Production publication is
recorded separately in [deployment status](deployment.md); source configuration
alone does not prove provider acceptance or successful public HTTP checks.
No provider IDs, credentials or payment facts are invented.

The user has authorized production Cloudflare publication at norulo.com and
api.norulo.com, with preview publication excluded. Deployment is handled
separately from these source/local checks; they do not establish published
versions, database activation or provider acceptance. Existing Cloudflare credentials
are retained in environment settings and never printed or saved in source.
The imported validation directory describes source history, not Norulo release
results. Historical source approvals are not authority for current operations.

The supplied Norulo logo is installed throughout the application, favicon,
Apple touch icon and both social cards. Its original 1254px PNG is preserved
byte-for-byte as `public/norulo-logo.png`, with SHA-256
`a9632acbd7a5ad48ad5ff25d6269f617c7655446365344c9db42d504213c710f`.
All inherited branded images were replaced, and SEO uses the regenerated PNG
social card. Original-source revision queries prevent cached older icons from
surviving the update. The obsolete monochrome dark-theme inversion is removed.
See [brand assets](branding.md) for source provenance and exact formats.

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

## Brand completion and CI repair

The supplied original logo now replaces every inherited branded image, with
light/dark browser checks confirming the same 96px source image and no color
filter. Current tracked text, paths, URLs, SVG metadata and built artifacts are
reviewed together with raster/ICO imagery. Browser captures and full generated
test logs remain in ignored environment work directories.

[The initial Norulo Web CI run](https://github.com/Norulo/norulo-web/actions/runs/38048695520)
and [the following run](https://github.com/Norulo/norulo-web/actions/runs/38050221905)
failed the same retained WebKit geometry assertion after narrowing the
recurring-create form from 412px to 360px. Its equal-height grid kept an 84px
button border box while the wrapped title, caption, spacing and padding required
98px. Changing the internal layout to flex was insufficient: this cloud
instance's default button-font metrics kept the original titles on one line,
so its passing local run did not exercise the CI failure.

The owning grid now uses `grid-auto-rows: minmax(max-content, 1fr)`, allowing the
row to grow to fit all content while retaining equal card heights. A temporary
actual-application probe forces a title to wrap during the same live resize;
the original geometry assertion rejects the previous 84px cards and accepts the
content-sized cards after rebuilding. Chromium and WebKit also pass repeated
320px/360px/412px resizing with multiple-line titles and captions. This changes
no fonts, fixtures, assertions, tolerances, minimum height, padding or spacing.
The complete WebKit date/layout check also passes all four profiles and 258
states after this content-sizing change. Lint, the production build, offline
Worker configuration and generated OpenAPI checksum checks pass.
The unchanged [Ubuntu CI run for this fix](https://github.com/Norulo/norulo-web/actions/runs/38054474964)
passed on commit `646999650246e7990bb34ed3d0108162fa2bec16`, including the
three-engine date/layout step, mobile, Billing, overview, currency and Projects
checks, production dependency audit and Worker syntax. This confirms the
original runner-specific case with its retained assertions. It does not
establish real-device, provider, OAuth or production-ledger acceptance.

The earlier complete date-check command passed all four profiles in Chromium and
WebKit (258 states per engine). This cloud instance's Firefox launch then timed
out before any Firefox test started; its sandbox could not write
`/proc/self/uid_map` and its software framebuffer could not initialize. That is
a local runtime limitation, not Firefox acceptance. The unchanged official CI
workflow retains all three engines for its Ubuntu runner.

The final production assets were rebuilt with `VITE_APP_URL=https://norulo.com`,
`VITE_API_BASE_URL=/api` and the verified public GitHub App slug `norulo`.
Production Worker configuration explicitly disables workers.dev and preview URLs. Offline Worker
and API-contract checks pass. This build uses the supplied Norulo graphics and
production canonical URLs; local fixture builds are not used for publication.
