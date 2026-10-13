# Norulo Web

## 2026-10-13 recurring schedule controls

Browser creation and editing derive weekday, day, month and quarter month from
the chosen start date, displaying those selectors read-only. Derive the submitted
selectors too; changing frequency must never revive a stale draft selector.
Calendar strings must not shift with the browser's local timezone. Existing
rules and expenses change only through explicit authorized saves.
TimezonePicker enumerates browser-supported IANA zones, includes UTC and the
saved value, and keeps Custom last. Preserve existing aliases/unknown-to-browser
saved names; normalize new custom names before Server validation. End-date Clear
sets endOn=null and never submits the form. Preserve six languages and keyboard,
viewport, disabled-state and mobile access.
Server edits/resumes now exclude posted and retained pending period identities
before saving the next pointer; keep that Server-selected date in the list.


Current public-launch scope defers real payments. Preserve the truthful Free-only
catalog and disabled paid checkout, Owner AI policy, user-confirmed real expense
recording and the mobile profile/setup layout corrections. Production logging
uses fixed code/status diagnostics with 1% sampling, no invocation logs/traces
and redacted queries; it is not complete error capture or automatic alerting.
See [the production runbook](../norulo-server/docs/operations.md) before incidents.

## Current repository and authority

This repository contains the imported Web application, rebranded to Norulo.
Work in the existing checkout; cloud tasks are already isolated. Do not create
Git worktrees unless the user explicitly asks. Use the selected branch and
preserve the Norulo origin and all existing user changes.

The current task authorizes importing source, updating the brand and protocol
names, local verification, GitHub main publication, and production Cloudflare
publication for norulo.com and api.norulo.com. Preview publication is excluded.
Use the current task's reviewed resource/binding configuration; historical
release records in `docs/validation` do not grant permission or establish that
Norulo has been deployed. Provider authorization, real payments and remote
user acceptance require their own current scope. Follow the user's instructions.
Never clear or print configured credentials, including the Cloudflare token.

Current production status is recorded in `docs/deployment.md`. The frontend
application and full Python Server are published. Direct and Web-proxied health
checks return 200 with D1 configured; protected account reads return 401 when
unauthenticated. The earlier setup bootstrap/503 and D1 deferral are historical.
The new production D1 has been initialized once with all 12 canonical migrations;
schema version 12 and its 77-object fingerprint were verified. Production uses
an explicit activation overlay; the checked-in Server defaults remain paused.
Do not repeat initialization. The user reports successful real GitHub sign-in;
repository installation/permissions, account linking and ledger journeys remain
unverified.
Production email authentication is now enabled through an explicit activation
overlay, with `login@auth.norulo.com` as sender and a separate SQLite Durable
Object admission limiter that does not use D1 for rate limiting. Checked-in D1
and email-auth defaults remain paused. The user confirmed receipt of the email
code and successful email sign-in; this is user-confirmed acceptance, not an
agent-initiated remote send. AI quality verification has now passed with 36
valid direct-provider responses, independently reviewed, without retries or D1
use. The Server-only `TYPESAFE_API_KEY` is the fourth Worker secret and is bound
in cloud network configuration revision 11. Local monthly Owner-quota checks
passed. Production recurring passed canonical local native Worker/Durable Object
verification and independent evidence review. Verified release B on 2026-10-11
at 06:38:08.477224 UTC has all five D1/email/AI/recurring activation flags `1`
and one daily `10 16 * * *` cron. Release A's 05:38:43 UTC hourly configuration
and 2,942-test Server result remain dated historical evidence.
AI and production recurring are enabled; checked-in flags remain `0` as safe
defaults. The original D1 and email admission namespace were preserved, and
production recurring uses its own SQLite Durable Object. Exact deployed source
commits and Worker versions are recorded in `docs/deployment.md`; this is a
dated release snapshot, not a guarantee about later HEADs or versions.
The daily production cron runs at 16:10 UTC (Beijing 00:10 the next day).
See the [daily release record](../norulo-server/docs/validation/production-daily-release-2026-10-11.json)
for release B's exact source commits, Worker versions and read-only verification.
The published scheduler scales through up to eight logical Owner lanes, with
20 handled occurrences and 800 native SQL statements per chunk. Root limits
remain 10,000 handled outcomes per day, 5,000 selected Owners, 8,192 child RPCs
and at most 64 entries in each page/carry/deferred collection. Owner calls have
a 120-second hard deadline; Root stops new dispatch at its 600-second soft
deadline and waits for already-started calls within the 900-second platform
wall limit. Official configuration GETs verified CPU/subrequest limits of
300,000ms/9,000 in release B. Account-plan eligibility remains unverified;
standard usage metadata does not establish a paid Cloudflare subscription.
Each rule's own timezone still
determines `next_run_at` and period date; weekly/monthly/quarterly/yearly rule
frequencies remain unchanged. Allow up to roughly 24 hours plus backlog delay,
not exact local-midnight execution. Commercial Owner allowances remain enforced,
including Free 10 writes/minute and 100 records, and Pro 60 writes/minute.
Known minute-quota denials release their lane and continue next minute without
SQL heartbeats. Financially uncertain outcomes stop that Owner; unresolved RPC
transport/completion stops new Root work after started siblings finish. Never
blindly retry. Do not promise thousands of daily records for one Owner or treat
scheduler limits as a D1 write budget. Independent review, 230 focused checks
and three new fault checks passed. All three final-source LOCAL native profiles
passed: the smoke profile, 1,000 expenses across 200 Free Owners (five each,
33.985 seconds), and 3,000 across 600 Free Owners (five each, 107.635 seconds).
Observed concurrency peaked at eight and Owner native SQL at 178 statements.
These are local measurements, not an online SLA or a single-Owner capacity
claim. See the [local load record](../norulo-server/docs/validation/production-recurring-load-native-local-2026-10-11.json).
The final Server full suite passed 3,009 tests in 115.01 seconds. Release B
retained AI/email activation, all four secret binding names, the original D1
and both independent Durable Object namespaces. Both main branches were
published before matching production deployment. Subsequent deployments must
use their own actual configuration/version readback. Preview deployment remains
excluded.
Real Worker-to-provider HTTPS and real paid business
journeys remain unverified limitations, rather than additional release gates or
requirements for another quality call. Never expose the key in Web/Vite
variables. Publish both final main branches together before matching production
deployments; update release records from actual readback, not planned versions.
Health checks do not establish scheduler or ledger acceptance.
Preview publication remains excluded.
The Web API guide now uses production direct/proxy examples and a production
default URL, with corrected availability copy in all six locales. Explicit
configured local/preview bases and security guards are retained. Fifteen
existing API-guide/docs tests passed in 3.84 seconds, and lint passed after this
copy/URL correction; the earlier 1,654-test pass predates it. Release B's fresh
production build and offline Worker check passed with the corrected guide.
All 55 dist artifacts were checked for old branding; all 13 public assets
matched dist byte-for-byte and the original logo checksum was unchanged.

## Product and shared contract

Norulo is a project expense ledger for developers and teams at norulo.com.
Server owns authorization, money, aggregates and provider/payment facts.
Projects may be standalone or optionally link up to 30 GitHub repositories and
an Organization. Shared-pool expenses count once in the selected ledger.
Keep currencies separate without conversion. Recorded expenses are distinct
from the owner's platform subscription and payment history.

Use `../norulo-server/openapi/ledger-v1.yaml` as the REST source of truth.
Use `src/api/ledger.js` for ledger resources and `src/api/norulo.js` for account
and payment operations. Regenerate both public API artifacts with
`python3 scripts/sync-api-contract.py` and verify them with `--check` whenever
the Server contract changes. Preserve source checksum verification.

## Runtime, security and data integrity

- `src/main.jsx` is the browser entry. `worker-entry.js` and `worker.js` serve
  assets/SEO and proxy API traffic. Preserve credential headers, OAuth redirects,
  Set-Cookie, request bytes and streaming response bodies at that boundary.
- Web's same-origin base `/api` wraps the Server resource `/api/v1/*` as
  `/api/api/v1/*`; strip exactly the outer prefix in both Worker and Vite.
- Matching environments bind `NORULO_SERVER` to `norulo-server-production` or
  `norulo-server-preview`. Never retry failed bindings via a public origin.
  Deployment domains and App slugs describe intended configuration; they do not
  prove that those external resources exist. Leave missing credentials unset.
  Never expose GitHub, Creem, Jev or Cloudflare secrets in browser variables.
- Keep abortable read lifecycles and synchronous in-flight mutation guards.
  Isolate protected data, drafts, cursors and one-time credentials by account,
  workspace, route and authorization revision. Discard stale responses and
  clear protected state after identity/access changes. Unknown/error data is
  not a successful zero or empty list. Do not add polling or automatic retries.
- Expense creation uses fresh Idempotency-Key; changes/removal use If-Match.
  Conflicts require explicit reload. Preserve exact integer money with BigInt
  before bounded chart ratios. Keep independent currency totals and scales.
- GitHub reads may follow a Server `githubRefreshRequired` signal with one
  account-scoped refresh and one repeated read. Never replay business writes,
  auto-start OAuth or treat a closed popup as verified provider completion.
- Preserve current workspace roles and permission/access fences. Invitation
  membership shares existing/future ledger data but does not grant GitHub access.
  Preserve role restrictions, invitation approval and revision checks.
- Writes hold their guards through required refreshes. Preserve drafts after
  errors, block conflicting controls, and release guards on scope loss/unmount
  without allowing old completion to release newer work.
- Preserve current capacity rules, explicit recurring-plan grants, finite
  failed-occurrence recovery, exact dates/timezones and server-owned next dates.
- Billing follows configured provider prices and webhook-confirmed entitlement.
  Never invent paid prices or optimistically grant a plan. Trust exact Creem
  hosts, including test-checkout.creem.io only in an appropriate test workflow.

## Shared UI rules

Preserve the existing flat square theme, indigo accent, six locales, rem font
sizes, self-hosted Geist fonts, native text selection and exact financial data.
Default theme follows system until explicit selection; keep the pre-paint
bootstrap and its exact CSP hash aligned. Do not introduce shadows or rounding.
`base.css` owns shared buttons, panels, messages, row insets, form gaps, charts,
typography and touch targets. Modify owning styles instead of overriding them
again downstream. Screen styles load with routes; cross-route styles stay shared.

Console views share `ConsoleLayout`; creation/edit rails share `LedgerSplit`
and `useResizablePane`. Preserve bounds, pointer/keyboard access, cleanup,
container-based reflow and scoped drafts. Projects use natural per-record height;
other console lists retain equal natural rows, with record content anchored to
the top inset and spare height below it. Keep whole names, descriptions,
exact amounts and separate internal/external links visible and selectable.
Loaded-page searches and filters must disclose their local scope and retain
pagination for no matches. Preserve authorized repository selections while
narrowing local search; do not enumerate all remote pages automatically.

Phone widths through 760px use the compact topbar and bottom navigation with
native More selector. Preserve safe areas, 44px touch targets, 48px phone form
controls and 16px text inputs. Native date/currency controls must fit narrow
rails. Modals trap focus, lock/inert the background, use VisualViewport geometry,
keep footer actions visible and restore their opener after cleanup. Preserve
language/theme/menu keyboard behavior and cancel coalesced ResizeObserver work.
Keep public/private route SEO, production canonical redirects, preview noindex,
fixed-host HTTP GET/HEAD upgrades, strict Origin handling and local HTTP support.

Use the exact supplied logo in `public/norulo-logo.png`; preserve its original
bytes and provenance in `docs/branding.md`. Do not draw substitute logos or
reinterpret the blue/cyan colors. The UI mark, Apple icon, ICO and both social
cards derive from that source. Keep source-revision asset query strings aligned
so browser caches cannot keep displaying an older icon. Do not invert the logo
for dark themes. Use `public/brand-mark.png` for inline images and ICO only for
browser favicon use. `npm run generate:social-card` rasterizes the local SVG.

## Local verification and external operations

Use Node >=22.12.0 (including the pinned Wrangler CLI) and the committed npm lockfile. Run `npm ci`,
`npm run check` (lint, all tests, build) and `npm run check:workers` (offline).
After a completed build use applicable bounded Playwright layout scripts from
package.json. Browser fixtures are local evidence, not actual provider/device
acceptance. CI uses Chromium, Firefox and WebKit; report engine/coarse-pointer
limitations accurately. Keep generated output, browser captures, caches and
local configuration in existing ignored locations.

For API-prefixed local browser validation build with `VITE_API_BASE_URL=/api`
and a loopback VITE_APP_URL. Vite proxies use route-boundary expressions so
`/api-keys` remains a document route. Disable upstream proxying for static
captures that supply their own local API fixtures. Finish builds before browser
captures, which rely on a stable dist tree.
Use strict free ports and bounded loopback fixtures; do not call remote APIs.

## D1 cost controls

- Develop and test against local D1 or SQLite by default. Browser fixtures must
  remain local; do not generate test data through the production API.
- Remote D1 writes are limited to necessary production migrations and real
  business operations within the current authorized scope. Do not create
  remote fixtures or seed data, clear/rebuild databases, run stress writes, or
  use polling, retry loops or repeated writes as tests.
- Before each remote operation, verify the account, database identity and
  environment, then establish the exact SQL or affected records and a finite
  batch. Review the schema and existing state before deciding a write is needed.
  Never reuse an imported database ID or assume a named database is the target.
- Record actual `rows_read` and `rows_written` from D1 result metadata for each
  executed batch. Query counts are not row counts. If metrics are unavailable,
  record that limitation instead of claiming zero or estimating actual usage.
- Do not blindly retry a write after a timeout, network failure or unknown
  outcome. Use bounded read-only checks of operation state, migration records
  or idempotency results before deciding whether any further write is needed.
  Preserve the existing in-flight guards and prohibition on automatic business
  mutation retries.

Cloudflare deployment requires current authorization and reviewed matching
Server/Web bindings, domains, allowed origins, cookie settings and provider
callbacks. Never reuse imported resource IDs or accept historical source
publication as Norulo readiness. Offline checks do not establish publication.
Keep package signature, checksum and TLS verification enabled. Do not overwrite
tracked files, manifests or lockfiles solely for onboarding fixes.
