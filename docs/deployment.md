# Norulo production deployment

Status updated on 2026-10-11. This record describes the current Norulo
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

Fresh local checks of the current Web checkout passed on 2026-10-11: lint;
all 1,654 unit tests in 83 files with `--maxWorkers=2`; production build; offline
Worker configuration; and both generated API artifacts checked against Server
OpenAPI checksum `c4046838b398`. The build explicitly used
`VITE_APP_URL=https://norulo.com`, `VITE_API_BASE_URL=/api` and
`VITE_GITHUB_APP_SLUG=norulo`. No dependency or API-artifact update was required.
The existing public-screen dynamic-import warning was nonfatal. The three-engine
layout result above belongs to the linked CI run, rather than this local pass.
Read-only checks of 215 current source/configuration files and all 55 build
artifacts found zero old-brand references. All 13 public assets, including the
six brand assets, matched dist byte-for-byte; the original logo hash is unchanged.
The built HTML uses `https://norulo.com/`, contains no loopback host, and retains
the correct icon/social cache revisions and CSP hash. The emitted public
environment values match the explicit production build settings above.

## Published backend and remaining acceptance

The full Python `norulo-server-production` Worker has been published at
`api.norulo.com`. The email-enabled application release was version
`815a1216-4468-4591-be58-e339d4d2c154`, from Server commit `96d6bee`; it preserved
the existing 19 public variables, three secret bindings and `EMAIL` binding,
and added the independent `EMAIL_ADMISSION` binding. The 2026-10-11 read-only
preflight now reports version `ec33db03-2fd4-49a4-8430-9e1cb13fc340`, a later
secret revision with the fourth Server-only Typesafe secret. This is not the
planned final AI/recurring code release. workers.dev and preview URLs remain
disabled. Secret values are not stored in these documents or browser builds.
The frontend remains
version `fb3dbf7c-8530-405a-bf01-a9d208136a83`; no Web application code changed
for email enablement.

The user authorized the production D1 database, necessary schema migrations
and full Server publication, superseding the earlier deferral. The production
database `c41a1ab7-dffa-4c5d-a213-25f1bb6c78c5` has been created and initialized
once with all 12 canonical migrations. Verification passed for schema version
12 and its complete 77-object fingerprint. The published runtime enables both
D1 and email authentication with flags `1` through explicit activation overlays;
both checked-in Server defaults remain paused with flags `0`.

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
been verified. The user's earlier "Email sign-in is temporarily unavailable"
report preceded production email enablement and is historical. The user then
confirmed receiving the verification code and successfully signing in with it.
This confirms the user-operated email delivery/code/login flow; it is not an
independent agent-triggered remote send or acceptance of account-linking cases.
Recurring execution and other real-provider acceptance remain uncompleted.

## Production email enablement

Email authentication is enabled with sender `login@auth.norulo.com`. The
`EMAIL_ADMISSION` binding uses the SQLite Durable Object class `EmailAdmission`
and a new namespace `6588312f00f74840a37463e72a2d75eb`. It does not reuse the
preview `ValidationBudget` object or write D1 for admission/rate limiting.
Normal authentication persistence is separate from the admission limiter.

The full local suite passed 2,629 tests. Focused final-overlay verification
passed 118 checks; 26 real local RPC, `transactionSync`, expiry and
SQL-fault/rollback checks also passed. No new production D1 migration,
remote fixture writes or agent-initiated
real email sends were performed for this enablement. Direct and Web-proxied
health remain 200, and unauthenticated account reads remain 401 with no
Set-Cookie. These results verify configuration and access boundaries; they do
not independently establish delivery or login. The separate user-confirmed
code receipt and successful email sign-in are recorded above.

## AI quality verification and release preparation

The final Server full local suite passed 2,923 tests in 106.75 seconds. Local
monthly Owner-quota and new guard checks passed. Native-gateway revision 5
passed all five cases using fake responses, including oversized valid JSON rejected as
`ValueError`/`JEV_RESPONSE_TOO_LARGE` and a 3,009ms deadline check. These checks
made zero real model requests and did not use D1. They are local verification
results, not real-model quality evidence.

`TYPESAFE_API_KEY` is present as the fourth Server Worker secret, separate from
the existing three secrets. It is never a Web/Vite setting. Cloud network
configuration revision 11 now has the Typesafe key bound/present, and the
Cloudflare token was preserved.

Fresh direct-provider quality verification passed independent review: all 36
actual model responses were valid, with zero retries and no D1 use. The
usage-derived estimated cost was USD 0.0010017; this is not a provider invoice.
The full USD 0.099108 reservation remains held rather than refunded using the
estimate. Local monthly Owner-quota enforcement checks passed.

Both live and checked-in AI flags remain `0`/`0`. Real native Worker-to-provider
HTTPS and real paid end-to-end behavior remain unverified limitations. These
are not requirements for another pre-release quality call; direct-provider
quality, monthly Owner-quota enforcement and local native guard checks passed.
The final production activation release remains planned, not completed.

## Production recurring local native verification

Canonical local production scheduling passed independent review of 83
source/dependency/migration hashes and the raw metrics. The native Python
Worker and SQLite Durable Object completed 16 requests across three runtime
incarnations. Local D1 metadata reported 234 statements, 805 rows read and 57
rows written, including setup, application and integrity probes. The scheduler
portion was 26 statements, 367 rows read and 24 rows written. These are local
observations, exclude separately applied local CLI migrations, and are not
production usage or a complete Cloudflare bill. Missing attempt metadata
remains unspecified.

The fixture generated one actual expense, audit entry and occurrence for a
synthetic local Free Owner, and verified duplicate-hour/idle handling,
cold-restart deduplication and fail-closed handling of an unknown durable marker.
No remote fixture, D1 operation, provider call or live cron was used. See the
[native verification record](../../norulo-server/docs/validation/production-recurring-native-local-2026-10-11.json)
for its scope and limitations. Production recurring financial acceptance and
live hourly scheduling remain unverified; the published flag is still `0` and
no cron is installed.

Manual recurring-rule management uses the ordinary production ledger API,
independently of the scheduler execution flag. The Web UI uses Server-provided
workspace write permissions and selected Owner entitlements. Manual-category
rules are available to Free and paid plans within the Owner's record/write
allowance and the Server's rule cap; automatic category selection additionally
requires eligible, available Jev. No client preview-only assumption was found.

## Final release plan and current preflight

Email delivery/code/login acceptance has been confirmed by the user. Fresh
direct-provider AI quality, monthly Owner-quota local checks, production
recurring native checks and final Web/Server local verification have passed.
Read-only production preflight on 2026-10-11 confirmed the existing state:

| Runtime setting | Observed value |
| --- | --- |
| `NORULO_D1_ACCESS_ENABLED` | `1` |
| `NORULO_EMAIL_AUTH_ENABLED` | `1` |
| `NORULO_JEV_SUGGESTIONS_ENABLED` | `0` |
| `NORULO_JEV_SUGGESTIONS_EVALUATED` | `0` |
| `NORULO_RECURRING_EXPENSES_ENABLED` | `0` |
| Cron schedules | None |

Commit and push the final versions of both repositories to main together, then
deploy those final versions with the reviewed activation configuration and
hourly `0 * * * *` cron. That final deployment has not occurred. Update this
record only after actual version/configuration readback. Do not make interim
commits, pushes or deployments. Real paid end-to-end and Worker/provider HTTPS
remain explicitly unverified after the completed local/direct-provider checks;
they are not additional pre-release quality-call requirements.

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
GitHub and email sign-ins are recorded separately above; repository installation
and ledger acceptance are not established by these HTTP checks.
