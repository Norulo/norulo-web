# Norulo production deployment

Status recorded on 2026-10-10. This record describes the current Norulo
deployment; imported records in `validation/` remain source history.

## Published frontend

Cloudflare publication of the frontend application completed successfully using
source commit `646999650246e7990bb34ed3d0108162fa2bec16`:

| Setting | Published value |
| --- | --- |
| Worker | `norulo-web` |
| Version | `fb3dbf7c-8530-405a-bf01-a9d208136a83` |
| Custom domains | `norulo.com`, `www.norulo.com` |
| Mode | `production` |
| API origin | `https://api.norulo.com` |
| Bindings | `ASSETS`, `NORULO_SERVER` → `norulo-server-production` |
| workers.dev | Disabled |
| Preview URLs | Disabled |

The production build uses `VITE_APP_URL=https://norulo.com`,
`VITE_API_BASE_URL=/api` and `VITE_GITHUB_APP_SLUG=norulo`. The public App is
[Norulo](https://github.com/apps/norulo). The exact user-supplied logo and its
derivatives are included; see [brand provenance](branding.md).

The [Ubuntu CI run](https://github.com/Norulo/norulo-web/actions/runs/38054474964)
for this source commit passed every step, including unit tests, the original
date/layout checks across Chromium, WebKit and Firefox, the remaining browser
layout checks, dependency audit and Worker syntax. Provider-side publication
and isolated CI checks do not establish end-to-end application acceptance.

## Backend setup and remaining acceptance

The service-bound `norulo-server-production` Worker is still the secret-setup
bootstrap. Its custom domain `api.norulo.com` has been configured, and its
18 public variables and two GitHub secrets were verified in the bootstrap
deployment. Secret values are not stored in these documents or browser builds.
The bootstrap is configured to return 503 rather than serve the ledger API.

The user has explicitly deferred D1 creation and activation. No D1 changes or
preview deployment are part of this step. Full backend publication, database
migration, recurring execution, OAuth callback/session flow, authenticated
ledger actions and real-provider acceptance have not been completed.

## Public HTTP verification

Read-only public GET requests with an ordinary browser user agent and TLS
certificate verification enabled passed on 2026-10-10:

- `https://norulo.com/` returned 200 with the Norulo title, production canonical,
  index/follow robots, current PNG social card and expected CSP, nosniff and
  DENY response headers.
- `https://www.norulo.com/pricing?lang=zh` returned 308 to the primary domain,
  retaining the path and query.
- The Web `/api/health` proxy returned 503 `SERVICE_SETUP_PENDING` from the
  backend bootstrap, with `Cache-Control: no-store` and no Set-Cookie.
- All six public brand assets returned 200 and matched the local public/dist
  files byte-for-byte. The original logo SHA-256 remains
  `a9632acbd7a5ad48ad5ff25d6269f617c7655446365344c9db42d504213c710f`.

The same managed environment's default Python user agent returned HTTP 403;
the successful browser-user-agent requests establish the above public HTTP
results. No security setting was changed for these checks. A real browser's
application-flow acceptance and OAuth/ledger acceptance remain separate.
