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

## Published backend and remaining acceptance

The full Python `norulo-server-production` Worker has been published at
`api.norulo.com`, version `3ad0cffc-ecc3-47a4-ab5d-a53999528b8c`. Its production
deployment preserves three secret bindings and the `EMAIL` binding, with 19
public variables. workers.dev and preview URLs remain disabled. Secret values
are not stored in these documents or browser builds.

The user authorized the production D1 database, necessary schema migrations
and full Server publication, superseding the earlier deferral. The production
database `c41a1ab7-dffa-4c5d-a213-25f1bb6c78c5` has been created and initialized
once with all 12 canonical migrations. Verification passed for schema version
12 and its complete 77-object fingerprint. The published runtime enables D1
with flag `1` through an explicit activation overlay; checked-in Server defaults
remain paused with flag `0`.

Initialization and successful SQL operations reported native D1
`rowsWritten: 367` and `rowsRead: 4097`. These are observed row metrics, not
application-record or query counts. No test users, projects or expenses were
created; the four empty `app_state` entries are required system state. Two
failed read-only compound queries returned no metrics, so the reported totals
cover successful SQL operations only and are not a complete billing total.

The earlier secret-setup bootstrap returned 503 `SERVICE_SETUP_PENDING`; that
result and the earlier D1 deferral are historical and have been superseded by
this full release. Preview publication remains excluded.

After publication, the user reported successful real GitHub sign-in. This is
user-reported acceptance of login only; GitHub repository installation and
permissions, account-linking cases and authenticated ledger journeys have not
been verified. The user also reported "Email sign-in is temporarily unavailable";
email authentication remains disabled pending production enablement and actual
delivery/session verification. Recurring execution and other real-provider
acceptance remain uncompleted.

## D1 development and operating cost rules

Development and test work uses local D1 or SQLite by default. Remote D1 may
receive only necessary production migrations and authorized real business
writes. Do not generate remote fixtures or seed data, clear/rebuild databases,
run stress writes, or issue polling/retry write loops.

Before a remote operation, verify its account, database and environment,
review the needed schema/state, and define the exact SQL or target records in
a finite batch. Record actual D1 `rows_read` and `rows_written` metadata for
each executed batch; mark unavailable metrics explicitly rather than reporting
zero or substituting query counts. Unknown outcomes require bounded read-only
state, migration or idempotency checks rather than blind retries. These are
ongoing development rules, also recorded in [AGENTS.md](../AGENTS.md).

## Public HTTP verification

Read-only public GET requests with an ordinary browser user agent and TLS
certificate verification enabled passed on 2026-10-10:

- `https://norulo.com/` returned 200 with the Norulo title, production canonical,
  index/follow robots, current PNG social card and expected CSP, nosniff and
  DENY response headers.
- `https://www.norulo.com/pricing?lang=zh` returned 308 to the primary domain,
  retaining the path and query.
- Both `https://api.norulo.com/health` and the Web `/api/health` proxy returned
  200 with `ok: true`, `service: norulo-server` and
  `database: {type: d1, configured: true}` after full Server publication.
- Direct `/api/v1/me` and the Web `/api/api/v1/me` proxy returned 401
  `UNAUTHENTICATED` without a logged-in session. The homepage returned 200
  without setting cookies. These checks establish health and access protection,
  not successful login or a business journey.
- All six public brand assets returned 200 and matched the local public/dist
  files byte-for-byte. The original logo SHA-256 remains
  `a9632acbd7a5ad48ad5ff25d6269f617c7655446365344c9db42d504213c710f`.

The same managed environment's default Python user agent returned HTTP 403;
the successful browser-user-agent requests establish the above public HTTP
results. No security setting was changed for these checks. The user's successful
GitHub sign-in is recorded separately above; email, repository installation and
ledger acceptance are not established by these HTTP checks.
