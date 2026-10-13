# Norulo production deployment

The recurring read-only and alignment correction was verified on 2026-10-13.
Web source `58ade571df758c465f30ec042e413c8ac227e749` is deployed as version
`0986be4a-4569-4a26-a62f-b3fc3dd97853` with 100% production traffic. Derived
inputs use muted colors, and all recurring controls share equal heights and
aligned edges. Clear retains its touch target without enlarging the label row.

All 1,870 tests, lint, build, offline configuration checks and dry-run passed.
Local Chromium passed 99 interaction states, 64 frequency styling checks,
24 supplementary tablet states and 258 existing layout states. In light/dark
480px tablet rails, creation and editing both show 44px timezone/end controls
with zero difference in their top, bottom and height. Twenty production GET
checks passed, including 14 byte-identical assets. Bindings/logging/exposure
were preserved; Server remains at `0cc26b2f-3a7d-4966-a07d-cd779ab8a236`.
No production business writes or SQL API calls were performed. Local Chromium
evidence does not establish physical-device acceptance. See the
[alignment release record](validation/recurring-readonly-alignment-production-2026-10-13.json).


The recurring schedule controls release was verified on 2026-10-13. Web source
`e3b26881688dcf4b14fd4f949fab5bf092641602` is deployed as version
`031a6cf6-d3d0-44ba-b0a2-c4db9f92388a`; Server source
`263a4c15cb6615eedb0de3128f29e998d5186857` is deployed as version
`0cc26b2f-3a7d-4966-a07d-cd779ab8a236`. Both have 100% production traffic.
Creation and editing derive read-only repeat dates from the start date, provide
a searchable timezone picker with Custom last, and allow clearing the optional
end date. Server edits/resumes save the first unconsumed future period.

All 1,870 Web tests, 3,239 Server tests and 107 subtests passed. Local Chromium
passed 50 new interaction states and 258 existing date-layout states. Lint,
builds, offline configuration/module checks and deployment dry-runs passed;
actual upload payloads matched the reviewed artifacts. Production readback
confirmed all resources, public variables, six Secret names, logging, limits and
the daily cron were preserved. Twenty final anonymous GET checks passed,
including 14 byte-identical assets, direct/proxied health and 401 protection.
Three earlier urllib probes met Browser Integrity Check code 1010; using the
browser User-Agent allowed the final checks. No production financial writes,
migrations, manual cron or journal reset occurred. Browser evidence is local
Chromium, not authenticated customer or physical-device acceptance.
See the [production release record](../../norulo-server/docs/validation/recurring-schedule-controls-production-2026-10-13.json).


The Web security review release was verified on 2026-10-12 at 15:25:47 UTC.
Web main source `e2c72018aa467e4db3f3c14461a162be1a38f2b8` is deployed as
version `263da268-8498-4874-be61-64ebc03eeb2a` with 100% production traffic.
The release pins Wrangler and CI actions, makes API-key pagination explicit,
restricts sandbox checkout redirects, removes unused GitHub refresh storage,
normalizes trusted URLs, generates static headers from the shared policy, and
adds host-only HSTS and Permissions-Policy. Local development defaults to
loopback, and discarded proxy fallback bodies are cancelled.

All 1,831 tests in 86 files, lint, production build, offline Worker checks and
Wrangler dry-run passed. Full dependency audit found zero advisories; 365
registry signatures and 67 attestations verified. Local Chromium passed 258
existing layout states and three API-key pagination/recovery/account-isolation
scenarios, including a 44px clickable Load more control at 320px. Firefox and
WebKit were unavailable locally; these fixtures are not physical-device or
authenticated customer acceptance.

Final production readback verified the matching source annotation, expected
security headers, current page builds, six byte-identical assets, the WWW
redirect and proxy health. Bindings, domains, observability and disabled preview
URLs were preserved; Server remains at version
`2a1a1086-a0ce-40c1-8e83-5b5e7d6b3a9d`. No production business write or SQL API
call was made. See the [review assessment](validation/web-security-review-assessment-2026-10-12.json)
and [security production release record](validation/web-security-production-release-2026-10-12.json).

The archived-project notice style release was verified on 2026-10-12. Web source
`6b95e2588be5b0e73469f07c16040c47aa1d7248` is deployed as version
`06408ecb-6430-4b22-8ac3-9eabe5bf5b1b` with 100% production traffic.
The archive notice no longer has a left accent border; its background and the
selected Tab underline are preserved. All 1,805 tests, lint, production build,
offline Worker checks and Wrangler dry-run passed. Local Chromium verified
eight archive-notice states across light/dark desktop/phone views and 74 existing
Projects layout states. Firefox and WebKit executables were unavailable locally.
Production readback matched 14 static assets byte-for-byte and confirmed that
the homepage references the current build. Production configuration was retained;
Server remains at version `2a1a1086-a0ce-40c1-8e83-5b5e7d6b3a9d`.
See the [archive-notice production release record](validation/archived-notice-border-production-release-2026-10-12.json).

The console record alignment release was verified on 2026-10-12. Web source
`ead7e33cea6d2fe0e2eaa8eafbeee4ba9638b885` is deployed as version
`7b89fa52-6e8c-4014-92bc-3322bc9df341` with 100% production traffic.
Operation log and other equal-height records now start at a fixed top inset.
The final source includes the latest API-key pagination and metadata changes.
All 1,805 tests, 48 focused alignment states and 258 existing date/inline-control
layout states passed; browser evidence is local Chromium only. Production
readback matched all 20 selected assets and verified homepage, health and
unauthenticated access protection. Bindings, domains, observability and disabled
preview URLs were preserved; Server remains at version
`2a1a1086-a0ce-40c1-8e83-5b5e7d6b3a9d`. See the
[alignment production release record](validation/console-record-top-alignment-production-release-2026-10-12.json).

The Web review fixes were published and independently verified on 2026-10-12.
Web main source `9cb56ff0e922740d0c6eee648244723d55279a3e` is deployed as
version `96423614-f893-4710-b8c9-ad76c03173ef` with 100% production traffic.
The integrated source retains the concurrent project-capacity correction.
The final 87-file suite passed all 1,800 tests, lint, an explicit production
build, the latest Server contract check, offline Worker checks and Wrangler
dry-run. Full dependency audit reports zero advisories. Chromium and WebKit
each passed 258 date-layout states; six final-build error-recovery cases and
the applicable mobile, Projects, billing, overview and currency checks passed.
Firefox could not run on this cloud host; local fixtures do not establish
physical-device or authenticated customer acceptance.

Independent production readback confirmed the matching source annotation,
100% traffic, byte-identical assets, page security headers, direct/proxied health,
anonymous 401 protection and the path/query-preserving WWW redirect. Production
bindings, domains, Issues, 1% logs, query redaction and disabled invocation logs,
traces, workers.dev and preview URLs were preserved. Server remained at
`075fb193-6440-4182-8470-5f40c43f7c70`; no remote SQL or business test write was
performed. See the [review assessment](validation/web-review-remediation-2026-10-12.json)
and [production release readback](validation/web-review-production-release-2026-10-12.json).

The preceding Project capacity deletion fix was verified on 2026-10-12.
Web main source `ce91b4468df1bf322deb5ed4fb9f5a8a46927f02` was deployed as version
`55cf559b-c1ae-46b8-99f3-1f64a6add3c1`; Server main source
`81cea4337e80b7d19c6f79ba94447bb9d95505cf` was deployed as version
`075fb193-6440-4182-8470-5f40c43f7c70`. Both had 100% traffic at that verification.
Billing and creation admission count current undeleted projects, including
archives, so deletion releases a project place even with a legacy cumulative
counter. Six-language capacity copy and the shared OpenAPI artifacts match.
The two newer frontend main changes were retained before publication.
See the [Project capacity production record](../../norulo-server/docs/validation/project-capacity-production-release-2026-10-12.json).

The final integrated Web passed 1,706 tests in 84 files, lint, an explicit
production build, offline Worker checks and Wrangler dry-run. Actual upload
bundles matched the reviewed dry-run artifacts. Twelve final TLS-verified
anonymous GETs checked page shells, direct/proxied health and authorization,
five byte-identical public assets and the path/query-preserving 308 WWW redirect.
The record also retains three earlier successful GETs from a corrected smoke
harness. All public variables, six Server Secret names, resource bindings,
monitoring, limits and the daily cron were preserved. The schema check read
334 rows and wrote zero; no migration or production test fixture was needed.
Authenticated customer deletion/recreation remains user-operated acceptance;
the fix's complete deletion/recreation regression was local.

The earlier frontend GitHub navigation and Settings/repository layout release
was verified on 2026-10-11. Web source
`678b49fbd4f7e2cb5ff93f259866b7166c6850c0` was deployed as version
`d2e48265-698c-4b4f-9824-170614a53a0c` with 100% production traffic at that time. See the
[GitHub/Settings production release record](validation/github-settings-production-release-2026-10-11.json).
The user explicitly authorized GitHub main publication and Cloudflare deployment.
The prior local record's pending-publication state is historical. This Web-only
release preserved production bindings, domains, logging and disabled preview
URLs; Server remained at version `15ebb291-af35-4600-87e9-0064d8fe33d0`.

The previous frontend Projects release was verified on 2026-10-11. Web source
`4f0da82e957d1a8aec490a01aeda19b37bf41aff` was deployed as version
`bce7995f-6c1c-4481-ab44-7b1718ba059e` with 100% production traffic. See the
[Projects production release record](validation/projects-production-release-2026-10-11.json).
This Web-only release retained the production Server binding and its active
version `15ebb291-af35-4600-87e9-0064d8fe33d0`. The dated release B history below
remains evidence of that earlier release.

Verified daily release B was checked on 2026-10-11 at 06:38:08.477224 UTC. This is a dated
snapshot of the exact source commits and Worker versions below, not a guarantee
about subsequent HEADs or deployments. Imported records in `validation/` remain
source history. See the cross-repository
[daily production release record](../../norulo-server/docs/validation/production-daily-release-2026-10-11.json).
Release A's hourly publication is retained below as historical evidence.

## Published frontend

Cloudflare publication of the frontend application completed successfully using
Web main source commit `e2c72018aa467e4db3f3c14461a162be1a38f2b8`:

| Setting | Published value |
| --- | --- |
| Worker | `norulo-web` |
| Version | `263da268-8498-4874-be61-64ebc03eeb2a` |
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

The earlier GitHub/Settings release passed all 1,694 tests in 84 files, lint, an explicit
production build, offline Worker checks and Wrangler dry-run. Eight finite local
Chromium/WebKit contexts checked 1280/1024/390/320px layouts. Repository selection
rows align their checkbox and full name and have at least 44px height. View plans
has 12px above/below; GitHub actions have 16px above and 12px between buttons.
Full-page GitHub redirects stop departing-page reads and keep operation ownership;
cached-page return restores account data through one fresh document load.
Sixteen finite TLS-verified anonymous GETs confirmed the three page shells,
eleven byte-identical assets, proxy health and unauthenticated account boundary.
Official readback confirmed 100% traffic and preserved runtime configuration.
These checks do not establish physical-device or actual GitHub authorization
acceptance.

The previous Projects release passed a fresh explicit production build and offline Worker
checks. Twelve TLS-verified anonymous GETs passed: homepage and Projects shell,
seven byte-identical production assets, the path/query-preserving WWW redirect,
API-proxy health and the unauthenticated account boundary. Web settings and
Server runtime version matched their pre-deployment readback; logs retain 1%
sampling, query redaction and disabled invocation logs/traces. These checks do
not establish authenticated Projects or real-device acceptance.

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
files passed in 3.84 seconds, along with lint. The earlier full 1,654-test/build
result predates this correction. Release B's fresh production build and offline
Worker check passed with the corrected guide. The final asset audit checked
all 55 dist artifacts for old branding and all 13 public assets against dist
byte-for-byte; the original logo hash was unchanged.

## Published backend and remaining acceptance

The daily release B of the full Python `norulo-server-production` Worker was published at
`api.norulo.com` from Server main commit
`ded49a46b06f5f79e2996f58d773d66acaddc0a0`, version
`e2e4e02d-ac9a-4c20-852f-f6cbfe5b5ae4`. Release B readback verified all 19 public
variables and four secret binding names, the existing `DB`, `EMAIL` and
`EMAIL_ADMISSION` bindings, and the new independent `RECURRING_SCHEDULER`
binding. Both Workers have workers.dev and preview URLs disabled. Secret
values are not stored in these documents or browser builds. The frontend has
the matching production Server service binding. The API-guide correction is
included in release B's published frontend.

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
Production AI configuration is enabled in verified release B; real paid
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
for its scope and limitations. Release A enabled production recurring with an
hourly cron; release B supersedes it with the daily cron described below.
Live scheduled financial acceptance remains unverified. Its
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

## Verified release B configuration

Email delivery/code/login acceptance has been confirmed by the user. Fresh
direct-provider AI quality, monthly Owner-quota local checks, production
recurring native checks and final Web/Server local verification have passed.
Seven read-only Cloudflare GETs checked at 06:38:08.477224 UTC on 2026-10-11
confirmed release B's actual configuration:

| Runtime setting | Observed value |
| --- | --- |
| `NORULO_D1_ACCESS_ENABLED` | `1` |
| `NORULO_EMAIL_AUTH_ENABLED` | `1` |
| `NORULO_JEV_SUGGESTIONS_ENABLED` | `1` |
| `NORULO_JEV_SUGGESTIONS_EVALUATED` | `1` |
| `NORULO_RECURRING_EXPENSES_ENABLED` | `1` |
| Cron schedules | One: `10 16 * * *` |
| Server CPU limit | `300000`ms |
| Server subrequest limit | `9000` |

The daily cron was created at 06:37:31.428958 UTC on 2026-10-11. Both main commits named above
were published before matching production deployment. This release check made
no remote D1 SQL operation, application mutation, provider request, manual cron
invocation, email send, migration replay or automatic retry. Checked-in flags
remain safe `0` defaults; activation overlays describe the deployed state.

Real paid end-to-end and Worker/provider HTTPS remain explicitly unverified
after the completed local/direct-provider checks; they are not additional
pre-release quality-call requirements. Creem billing remains optional and
unconfigured. The sanitized release B readback has SHA-256
`a75f9b828cf69e7f691d1770cc39830af77044b31d8864d777284b43bad7a162`;
its portable copy is linked above. Publication of these documentation updates
and any subsequent matching deployment are separate from release B and must
use their own actual readback.

## Historical release A

Release A was verified at 05:38:43 UTC on 2026-10-11 with all five activation
flags `1` and one hourly `0 * * * *` cron, created at 05:37:56 UTC. Its Server
main commit was `ebd11baf0da9d6aa83f8718b55e0c630e04108bd`, Worker version
`b5642a63-1643-418a-b494-bb7bcf427050`; its Web main commit was
`3531f8ab23ac976f6e17caf1c2246dcbf5ea125c`, Worker version
`26697b80-76dc-405b-a0c0-c2ea7c0735f7`. That dated hourly checkpoint is
superseded by release B, not rewritten. See the
[release A record](../../norulo-server/docs/validation/production-release-2026-10-11.json).

## Published daily scheduler and local capacity verification

The user requested daily execution and accepted the recommended production
schedule `10 16 * * *` UTC: 16:10 UTC, or 00:10 the next day in Beijing. This
daily configuration and expanded cross-Owner scheduler are published in verified
release B. Capacity native verification and the latest full Server suite passed;
official configuration GETs verified its limits. Production publication retained
email/AI activation, all four secret names, the existing D1 and both independent
Durable Object namespaces. Preview publication remains excluded.

Each rule's timezone independently computes `next_run_at` and its original
occurrence date. Weekly, monthly, quarterly and yearly rule frequencies remain
available; no daily rule frequency was added. One global cron covers all
timezones. A due occurrence can wait up to roughly 24 hours for the next run,
plus backlog delay, and records its original period date. Exact midnight in each
timezone is not promised. The published scheduler dispatches up to eight logical
Owner lanes, with at most 20 handled occurrences and 800 native SQL statements
per chunk. Daily Root bounds are 10,000 handled outcomes, 5,000 selected Owners
and 8,192 child RPCs; page, carry and deferred collections each remain at most
64 entries. Handled outcomes include blocked/replayed work as well as created
expenses, so this is not a promise of 10,000 new expenses or a daily D1 write
budget.

Owner calls have a 120-second hard deadline. Root stops dispatching new calls
at its 600-second soft deadline, then awaits already-started calls within the
900-second platform wall limit. Official configuration GETs verified Worker
limits of 300,000ms CPU and 9,000 subrequests in release B. Account
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
tests in 3.84 seconds and lint. Its fresh production build and offline Worker
check passed before release B's production publication. Exact source commits,
Worker versions, CPU/subrequest limits and finite read-only checks are recorded
above and in the daily release record. These verified configuration limits do
not establish account subscription/billing eligibility or an online capacity
SLA. Subsequent main publication and deployment require their own dated readback.

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

Release B's TLS-verified read-only checks passed at 06:38:08.477224 UTC on
2026-10-11: direct and
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

## Free public use and mobile correction, 2026-10-11

The user separately confirmed ordinary real expense recording succeeds. The
current revision spaces the mobile sign-in methods, lets long addresses wrap,
and stacks project setup steps on phones with smaller supporting type. Six
languages and light/dark layouts are checked with finite local browser fixtures;
they do not establish physical-device or financial/provider acceptance.

Explicitly empty Creem products now return the genuine Free catalog. Paid prices
are unavailable and month/year checkout stays disabled; real payments are
deferred. Privacy copy accurately describes self-hosted fonts. The two generated
REST artifacts reflect the canonical nullable catalog checkout action.

Production logs disable automatic request/tracing details and redact queries.
The Server retains emitted safe scheduler summaries; Web samples fixed transport
error codes at 1%, so it does not capture every error. See
[production operations](https://github.com/Norulo/norulo-server/blob/main/docs/operations.md) for partial
scheduler failures, read-only natural-run checks and coordinated D1/DO recovery.
No new email alert is enabled or test message sent. The dated
[free-launch record](https://github.com/Norulo/norulo-server/blob/main/docs/validation/production-free-launch-2026-10-11.json)
separates local validation from actual production readback.
