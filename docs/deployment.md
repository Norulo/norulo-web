# Norulo production deployment

Verified release A was checked on 2026-10-11 at 05:38:43 UTC. This is a dated
snapshot of the exact source commits and Worker versions below, not a guarantee
about subsequent HEADs or deployments. Imported records in `validation/` remain
source history. See the cross-repository
[production release record](../../norulo-server/docs/validation/production-release-2026-10-11.json).

## Published frontend

Cloudflare publication of the frontend application completed successfully using
Web main commit `3531f8ab23ac976f6e17caf1c2246dcbf5ea125c`:

| Setting | Published value |
| --- | --- |
| Worker | `norulo-web` |
| Version | `26697b80-76dc-405b-a0c0-c2ea7c0735f7` |
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
for migrated application source `646999650246e7990bb34ed3d0108162fa2bec16`
passed every step, including unit tests, the original
date/layout checks across Chromium, WebKit and Firefox, the remaining browser
layout checks, dependency audit and Worker syntax. Provider-side publication
and isolated CI checks do not establish end-to-end application acceptance.

Before the API-guide correction below, local Web checks passed on 2026-10-11: lint;
all 1,654 unit tests in 83 files with `--maxWorkers=2`; production build; offline
Worker configuration; and both generated API artifacts checked against Server
OpenAPI checksum `c4046838b398`. The build explicitly used
`VITE_APP_URL=https://norulo.com`, `VITE_API_BASE_URL=/api` and
`VITE_GITHUB_APP_SLUG=norulo`. No dependency or API-artifact update was required.
The existing public-screen dynamic-import warning was nonfatal. The three-engine
layout result above belongs to the linked CI run, rather than this local pass.
Read-only checks at that stage covered 215 source/configuration files and all 55 build
artifacts found zero old-brand references. All 13 public assets, including the
six brand assets, matched dist byte-for-byte; the original logo hash is unchanged.
The built HTML uses `https://norulo.com/`, contains no loopback host, and retains
the correct icon/social cache revisions and CSP hash. The emitted public
environment values match the explicit production build settings above.

The subsequent Web API-guide correction changes production direct/proxy URL
examples, the unset-config default URL, availability copy in all six locales
and the README guide link. Explicit local/preview configuration and security
guards remain supported. All 15 existing API-guide/docs checks in four test
files passed, along with lint. The earlier full 1,654-test/build result predates
this correction; the final production build will include the corrected guide.

## Published backend and remaining acceptance

The full Python `norulo-server-production` Worker has been published at
`api.norulo.com` from Server main commit
`ebd11baf0da9d6aa83f8718b55e0c630e04108bd`, version
`b5642a63-1643-418a-b494-bb7bcf427050`. Release A readback verified all 19 public
variables and four secret binding names, the existing `DB`, `EMAIL` and
`EMAIL_ADMISSION` bindings, and the new independent `RECURRING_SCHEDULER`
binding. Both Workers have workers.dev and preview URLs disabled. Secret
values are not stored in these documents or browser builds. The frontend has
the matching production Server service binding. The API-guide correction is
prepared for the subsequent daily release and is not part of release A.

The earlier email-enabled release `815a1216-4468-4591-be58-e339d4d2c154` and
secret revision `ec33db03-2fd4-49a4-8430-9e1cb13fc340` are historical; release A
supersedes their disabled AI/recurring state.

The user authorized the production D1 database, necessary schema migrations
and full Server publication, superseding the earlier deferral. The production
database `c41a1ab7-dffa-4c5d-a213-25f1bb6c78c5` has been created and initialized
once with all 12 canonical migrations. Verification passed for schema version
12 and its complete 77-object fingerprint. The published runtime enables D1,
email, AI and recurring through explicit activation overlays; all five flags
are `1`. Checked-in Server defaults remain paused with flags `0`.

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
Live scheduled financial acceptance and other real-provider business journeys
remain uncompleted despite their enabled runtime configuration.

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

## AI quality verification and enablement

The release A Server full local suite passed 2,942 tests in 106.73 seconds, including
19 packaging regression checks. The production bundle verified the real
64-module dependency closure and contains 729 modules (340.66 KiB compressed).
Local monthly Owner-quota and new guard checks passed. Native-gateway revision 5
passed all five cases using fake responses, including oversized valid JSON
rejected as
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

Both live AI flags are `1`/`1`; checked-in defaults remain `0`/`0`.
Real native Worker-to-provider HTTPS and real paid end-to-end behavior remain
unverified limitations. These
are not requirements for another pre-release quality call; direct-provider
quality, monthly Owner-quota enforcement and local native guard checks passed.
Production AI configuration is enabled in verified release A; real paid
end-to-end/provider acceptance is not established by its successful readback.

## Release A recurring local native verification

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
for its scope and limitations. Production recurring is now enabled with an
hourly cron; live scheduled financial acceptance remains unverified. Its
independent SQLite Durable Object namespace is
`b3f41def1906481e9c72662debf4b505`, separate from email admission and preview
accounting. The existing email namespace
`6588312f00f74840a37463e72a2d75eb` and production D1 were retained.

Manual recurring-rule management uses the ordinary production ledger API,
independently of the scheduler execution flag. The Web UI uses Server-provided
workspace write permissions and selected Owner entitlements. Manual-category
rules are available to Free and paid plans within the Owner's record/write
allowance and the Server's rule cap; automatic category selection additionally
requires eligible, available Jev. No client preview-only assumption was found.

## Verified release A configuration

Email delivery/code/login acceptance has been confirmed by the user. Fresh
direct-provider AI quality, monthly Owner-quota local checks, production
recurring native checks and final Web/Server local verification have passed.
Seven read-only Cloudflare GETs checked at 05:38:43 UTC on 2026-10-11 confirmed
release A's actual configuration:

| Runtime setting | Observed value |
| --- | --- |
| `NORULO_D1_ACCESS_ENABLED` | `1` |
| `NORULO_EMAIL_AUTH_ENABLED` | `1` |
| `NORULO_JEV_SUGGESTIONS_ENABLED` | `1` |
| `NORULO_JEV_SUGGESTIONS_EVALUATED` | `1` |
| `NORULO_RECURRING_EXPENSES_ENABLED` | `1` |
| Cron schedules | One: `0 * * * *` |

The cron was created at 05:37:56 UTC on 2026-10-11. Both main commits named above
were published before matching production deployment. This release check made
no remote D1 SQL operation, application mutation, provider request, manual cron
invocation, email send, migration replay or automatic retry. Checked-in flags
remain safe `0` defaults; activation overlays describe the deployed state.

Real paid end-to-end and Worker/provider HTTPS remain explicitly unverified
after the completed local/direct-provider checks; they are not additional
pre-release quality-call requirements. Creem billing remains optional and
unconfigured. Publication of this release record and any subsequent matching
deployment are separate from release A and must use their own actual readback.

## Prepared daily scheduler and capacity verification

The user requested daily execution and accepted the recommended production
schedule `10 16 * * *` UTC: 16:10 UTC, or 00:10 the next day in Beijing. This
daily configuration and expanded cross-Owner scheduler are prepared locally;
capacity native verification and the latest full Server suite passed. Provider
limit readback and final main publication/deployment are pending. Release A's actual
configuration above remains hourly until that deployment. Its release evidence
is preserved. Final publication is production only and will retain email/AI
activation, all four secret names, the existing D1 and admission bindings.

Each rule's timezone independently computes `next_run_at` and its original
occurrence date. Weekly, monthly, quarterly and yearly rule frequencies remain
available; no daily rule frequency was added. One global cron covers all
timezones. A due occurrence can wait up to roughly 24 hours for the next run,
plus backlog delay, and records its original period date. Exact midnight in each
timezone is not promised. The prepared scheduler dispatches up to eight logical
Owner lanes, with at most 20 handled occurrences and 800 native SQL statements
per chunk. Daily Root bounds are 10,000 handled outcomes, 5,000 selected Owners
and 8,192 child RPCs; page, carry and deferred collections each remain at most
64 entries. Handled outcomes include blocked/replayed work as well as created
expenses, so this is not a promise of 10,000 new expenses or a daily D1 write
budget.

Owner calls have a 120-second hard deadline. Root stops dispatching new calls
at its 600-second soft deadline, then awaits already-started calls within the
900-second platform wall limit. Prepared Worker limits are 300,000ms CPU and
9,000 subrequests and require official configuration GET readback. Account
subscription/billing eligibility is unknown; `standard` usage metadata is not
complete paid-plan proof.

Owner commercial limits remain authoritative: Free allows 10 writes/minute and
100 retained records; Pro allows 60 writes/minute. The scheduler does not bypass
record, write, authorization or retention rules. A known minute-quota denial
releases the lane and continues next minute without SQL heartbeats. Financially
uncertain results stop that Owner. RPC transport or completion outcomes that
cannot be proven stop new Root work after already-started siblings finish.
Durable financial guards and no-blind-retry behavior remain intact. No claim is
made that a single Owner can create thousands of expenses in one day.

A genuine production capacity assessment used one finite read-only query:
zero total rules, zero active rules and zero active due rules. Native metrics
were `rows_read: 1` and `rows_written: 0`; no fixture, retry or manual cron
invocation was used. These observed counts do not rule out future backlog.

The earlier minimal daily native checkpoint passed with 16 requests across
three runtime incarnations, 234 local D1 statements, 805 rows read and 57 rows
written, with no real provider request or remote D1 operation. See the
[daily native record](../../norulo-server/docs/validation/production-recurring-native-daily-local-2026-10-11.json).
That checkpoint does not prove the expanded scheduler's capacity. Independent
code review, 230 focused checks and three new fault checks passed. All three
final-source LOCAL native profiles passed, including the smoke profile and:

| Local workload | Free Owners | Expenses per Owner | Measured duration |
| --- | --- | --- | --- |
| 1,000 expenses | 200 | 5 | 33.985 seconds |
| 3,000 expenses | 600 | 5 | 107.635 seconds |

Durations are rounded local measurements. Observed Owner concurrency peaked at
eight and native SQL at 178 statements per Owner. The profiles retained actual
commercial quotas and share the same final source. See the
[LOCAL load verification record](../../norulo-server/docs/validation/production-recurring-load-native-local-2026-10-11.json)
for exact raw fields, source hashes, local row metrics and limitations. These
results do not establish an online SLA or thousands of expenses per day for a
single Owner.

The final current Server suite passed 3,009 tests in 115.01 seconds; the 729-module
bundle was verified. Release A's 2,942-test result above is historical and is
not this final run.

The production API-guide text/URL correction passed 15 existing related Web
tests and lint; a final production build remains planned. The final daily Server
verification and actual release B versions/readback will be recorded when
available, including actual CPU/subrequest limits and account-plan limitations.
Commit/push both final main branches before the daily production deployment.

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

Release A's TLS-verified read-only checks passed on 2026-10-11: direct and
Web-proxied health returned 200; both protected account endpoints returned 401;
and the homepage returned 200. All five responses had no Set-Cookie. The
original logo checksum was unchanged, and
`https://www.norulo.com/login?source=release-check` returned 308 to
`https://norulo.com/login?source=release-check`, preserving path and query.
These checks verify deployed configuration, health and access protection;
they do not establish a live scheduled financial or paid-provider journey.

The following earlier frontend verification is retained as dated evidence.
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
