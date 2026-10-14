# Norulo Web

The Project capacity fix is published in production as of 2026-10-12. Deleting
a project releases its project place; Billing, creation limits and all six
languages share the current undeleted-project definition. Final integrated main
passed 1,706 tests. See [deployment verification](docs/deployment.md) for the
exact source commits, Worker versions and read-only production checks.

The user has now confirmed ordinary expense recording works. The current release
also fixes mobile profile spacing and narrow-screen project setup steps. Empty
payment configuration supports Free use; paid checkout remains unavailable until
real payments are configured. See [production operations](https://github.com/Norulo/norulo-server/blob/main/docs/operations.md)
and the dated free-launch verification in the deployment notes for acceptance
limits, safe logging and daily scheduling.

> Current deployment: the Norulo frontend application has been published to
> Cloudflare for `norulo.com` and `www.norulo.com`. The full Python Server is
> published at `api.norulo.com`, with production D1/schema 12 verified. Direct
> and proxied health checks return 200; unauthenticated account reads return 401.
> The user reports successful GitHub login. Production email authentication is
> enabled with sender `login@auth.norulo.com`; the user confirmed receiving the
> code and successfully signing in. Repository installation, account linking
> and ledger journeys remain unverified. AI quality verification passed with 36
> valid direct-provider responses; local monthly Owner-quota checks also passed.
> Its Server-only key is bound in the cloud network configuration. Verified
> release B on 2026-10-11 at 06:38:08.477224 UTC enables AI and production
> recurring with all five activation flags `1` and one daily `10 16 * * *` cron
> (Beijing 00:10 the next day). Checked-in flags retain safe `0`
> defaults. Recurring passed local native Worker/Durable Object verification
> and independent review. Exact source commits and versions are recorded as
> a dated release snapshot in the deployment notes.
> The published daily scheduler uses up to eight logical Owner lanes. LOCAL
> capacity profiles and the final 3,009-test Server regression run passed;
> official configuration GETs verified 300,000ms CPU and 9,000 subrequests.
> Release A's hourly configuration remains dated history. Release B is a
> verified snapshot, not a guarantee about subsequent HEADs or deployments.
> Real Worker/provider HTTPS and paid business journeys remain unverified.
> Preview publication is excluded. See
> [deployment status](docs/deployment.md) for the
> exact version, CI result and public HTTP verification status.
> Records in `docs/validation` describe inherited source history and do not
> establish a Norulo release. See [migration notes](docs/migration.md).

The verified public GitHub App slug is `norulo` ([App](https://github.com/apps/norulo)).
The supplied Norulo logo is installed in all icons and social cards. See
[brand assets](docs/branding.md) for its original file, checksum and reproducible
asset commands. Keep configured Cloudflare credentials in environment settings.

Norulo is a project expense ledger for developers and teams at [norulo.com](https://norulo.com). Norulo Web is its browser client; the current [product design](../norulo-server/docs/design/github-project-ledger/README.md) describes the shared Web/Server contract. Members sign in with GitHub, create named projects, record project or shared expenses, manage categories, and review per-currency reports in the selected ledger. GitHub repository links are optional. API keys and platform subscription billing are separate from user-entered expenses.

**Track project and shared expenses. Keep every cost in view.**

The shared pool records costs used across projects once in the selected ledger; it does not allocate or copy them into individual projects. Each currency is totaled separately, without currency conversion. Expenses are entered by users, authenticated API clients or configured recurring rules; linking a repository does not import bills or move money.

The workspace/team and multi-repository implementation is included in the
imported application. Current Norulo verification and publication are recorded
in the migration and deployment notes; dated source acceptance records remain
separate historical evidence.

## Workspaces and projects

An existing owner's ledger becomes a workspace identified by that owner's ID; personal ownership remains an implicit Owner. The header picker switches between the personal ledger and ledgers joined by invitation. Protected views clear their data, drafts and one-time credentials when the workspace or access scope changes, abort obsolete reads and ignore late results.

Members supports invitation links, applications, original-inviter approval, role changes, removal and invitation revocation. Applicants sign in with their own account; access starts after approval. Owner manages Admins; Admin manages Editors and Viewers. Editors record expenses; Viewers can read reports and export CSV. Invitation creation and acceptance warn that membership shares all current and future ledger data. Membership does not grant GitHub access. Team usage pools the owner's ledger quotas, plan and model allowance; billing stays with the owner, and each member's personal ledger remains separate.

Create a standalone project with a name and optional description; no GitHub App installation or repository authorization is needed for its expense entries. Optionally link 1–30 distinct stable GitHub repository IDs and a GitHub Organization. The chooser uses the acting member's current GitHub authorization, filters by the selected organization and revalidates selections after access changes. Project settings can add, change or remove these associations while preserving the project ID and expense history. A new expense in a linked project requires at least one linked repository authorized for the acting member; unavailable protected repository metadata stays hidden while permitted financial history remains accessible. Removing all repository links requires a nonempty project name and clears the Organization association.

Projects search and its Active/Archived filter apply to loaded projects. Load
more explicitly to include another page; no-match results retain that action.
Repository search also covers currently loaded authorized repositories and
preserves selected IDs. Project rows grow independently with their complete
descriptions and per-currency amounts.

When an expiring GitHub authorization has a saved refresh token, repository and
project reads renew it automatically and retry the read once. Concurrent reads
share one renewal for the signed-in account, and account changes cancel obsolete
results. Financial history remains visible during temporary provider failures.
Legacy accounts need one explicit **Reconnect GitHub** to store the previously
missing refresh token; revoked or expired refresh credentials still require
reconnection. This does not extend the separate Norulo login session.

The Cloudflare static-asset Worker in `worker-entry.js` proxies `/api/*` to the Server Worker and streams its response body. The browser API helper uses `/api/v1/*` behind the configurable base URL; on the production domain the base URL is `/api`, so the proxy receives `/api/api/v1/*` and strips the first `/api`.

## Shared REST API and capacity

Browser sessions and external Bearer keys use the same ledger REST resources,
DTOs, permissions, revision checks and business validation. This covers project
management, project/shared-pool expenses and recurring rules, categories,
reports/export, activity and member governance. Keys add explicit scopes and
optional project restrictions. Member governance requires whole-ledger keys;
invitation applications use the applicant's independent account session.

The [API guide](https://norulo.com/developers/api) includes a runnable
first-expense example, full update/concurrency examples and the complete endpoint
reference. `scripts/sync-api-contract.py` generates the reference and downloadable
OpenAPI JSON from Server's `openapi/ledger-v1.yaml`; run it with `--check` after
contract changes to detect stale copies.

The API page defaults to **Copy for Agent**. Its split-button menu also offers
**Copy Page**, preserving the full documentation export. The agent version in
`src/screens/api-agent.js` combines concise integration rules with every
Bearer-accessible operation and deduplicated request/response schemas from the
same generated contract. Both exports retain selectable Markdown when clipboard
access is unavailable; controls and recovery copy support all six UI languages.

Docs opens with the five-step Coding Agent journey, also linked in the homepage
hero and shown at the top of API docs: copy the guide, create a scoped API key,
configure secure runtime variables, provide costs or supported receipt images/PDFs,
then verify saved records. Agent copy explains ledger/project/shared-pool/category
relationships and how to reuse or create resources before recording expenses.
Receipt extraction happens in the external agent; REST accepts structured JSON.

Default limits are Free **3 projects / 300 expense records**, Pro **20 / 20,000**,
and Max **100 / 200,000**. Billing renders the Server's configured limits and
personal-ledger Used / Total allowance as exact figures with accessible native
meters for every plan.
Project/shared-pool expenses and generated recurring occurrences use the owner's
record allowance. Expense capacity counts current undeleted entries in shared
pool and projects that have not been removed, including archived projects.
Removing an expense or its project frees expense slots. Project capacity counts
current undeleted projects, including archived projects. Removing a project also
frees its project slot.
Billing does not switch to a joined team's allowance with the ledger picker.

Spending overview displays each currency's total beside its project / Shared
Pool composition for a selected month or inclusive date range. Money stays
exact, currencies stay separate, and the chart's readable legend shows both
amounts and shares. Billing uses the same flat visual hierarchy for Projects,
Expense records and Jev calls, with larger Used values and quieter allowances.
The presentation references Vercel Usage, Linear Insights and shadcn / Tremor
chart patterns while retaining Norulo's theme and existing data contracts.
Run `npm run test:overview-layout -- --browser=chromium` after building for
bounded multi-currency, long-value, zero/error and six-language layout checks.

Project and Shared Pool expense forms, including recurring plans, use a
currency dropdown. Its common options show a code and the currency's name in
the current UI language; the selected field and API payload keep only the
code. The last option accepts a custom three-letter code, such as SEK, with
explicit confirmation. Existing Server currency validation remains in place.
The interaction follows Radix Select/Popover and WAI combobox/listbox patterns.
Run `npm run test:currency-layout` after building for bounded Chromium currency
interaction and layout checks with local GET-only fixtures.

Global Settings has an **automatically remove oldest expense at capacity** switch
for every plan, default Off, without additional charges. Off blocks full-capacity
creates; On atomically removes the oldest retained entry and adds the new one.
Oldest means expense date, then creation time and ID. The Owner's setting applies
to that ledger's members, API keys and recurring rules. Switching it removes
nothing immediately. An already-over-limit ledger needs manual cleanup first;
automatic replacement removes at most one entry per successful create. A key
that cannot remove the actual oldest entry cannot replace another one instead.
Failed creates and idempotent replays remove no additional records. Removed
expenses leave lists/reports/export and cannot be restored; authorized recent
activity and internal immutable audit/replay records remain.

## Project links and recurring expenses

The imported application includes these features. Their dated source release
records do not establish a Norulo preview or production backend release.

Project settings and creation accept optional product links and, for standalone
projects, development links. The Projects list provides product shortcuts;
development links and each acting member's authorized GitHub repository/Organization
destinations remain in project detail. The list uses aligned project information,
expense totals and product entry points without an account-wide overview or
expandable repository groups. Domains and store links use validated
HTTP(S) URLs; a bare domain is normalized to HTTPS. Financial data and link text
remain selectable, while ordinary controls keep their shared interaction style.

Project expenses and the shared pool use one compact view toolbar for date/category
filters and CSV export. Expenses focuses on records; Reports starts with trend
and category charts, without a separate currency-total block. Filter fields expand
when requested and retain their values across the two views, with a clear/reset
action.

The project/shared-pool expense form can create a one-time expense or a weekly,
monthly, calendar-quarterly or yearly rule for that page's fixed target. Rules
store an IANA timezone, start date, optional end date and original day anchor.
Short months clamp to their last day without changing later months' anchors.
Recorded expenses and recurring plans have separate sections and entry controls.
A start date on or before today records that first expense once; a future start
waits until due. Each following date creates a separate expense at the original
amount. Eligible Jev assistance can select a category for both entry types.
The recurring list shows a future next date and supports editing,
pause/resume and permanent cancellation according to ledger permissions.
Resume skips paused periods. Planned costs remain outside reports until the
Server atomically generates an actual expense. Sessions and authorized Bearer
keys can manage rules. A key-created rule retains an internal credential hash;
each occurrence rechecks the key, membership, scopes and target permission.
Revocation or expiry blocks execution until an authorized edit or resume grants
current authority. Tokens and internal grants never appear in public rule DTOs.

Server scheduled checks revalidate current membership, GitHub
target access, category and owner quota checks, bounded catch-up and permanent
period identity to prevent duplicate charges. At full expense capacity, owners
who leave automatic oldest-expense replacement off receive an English email,
or an inbox item when email is unavailable. The plan preserves the first ten
unresolved dates with individual Add to expenses actions; further failed dates
are discarded while the ten remain unresolved. The
[feature contract](../norulo-server/docs/planning/recurring-expenses-project-links.md)
and [source validation history](docs/validation/README.md) distinguish source
tests from current publication. Norulo production D1 has been initialized and
its schema verified. Recurring execution has not completed production acceptance
and is not established by the successful full Server health checks. Manual rule
management uses the ordinary production API and ledger write permissions;
it does not depend on the scheduler execution flag. Manual-category rules use
the Owner's record/write allowance for Free and paid plans; automatic category
selection additionally requires eligible, available Jev. Production scheduling
passed canonical local native Worker/Durable Object verification, including
one actual Free Owner occurrence, duplicate/idle handling and cold-restart
fail-closed behavior. Verified release B enables its live execution flag and
one daily `10 16 * * *` cron, using a separate production SQLite Durable Object.
Live scheduled financial acceptance remains unverified.

The user's daily execution schedule is enabled as `10 16 * * *` UTC, which is
00:10 the next day in Beijing. Each rule keeps its own timezone and Server-owned
`next_run_at`; rule frequencies remain weekly, monthly, quarterly or yearly.
One global run covers all timezones, with up to roughly 24 hours of timing delay
plus backlog delay while preserving the original period date. Exact midnight in
each timezone is not promised. The published implementation processes up to eight
Owners concurrently in logical lanes; each chunk is bounded to 20 handled
occurrences and 800 native SQL statements. It bounds the day to 10,000 handled
outcomes, 5,000 selected Owners and 8,192 child RPCs, with page/carry/deferred
collections limited to 64 entries each. These are scheduler bounds, not a daily
D1 write budget or a guarantee of thousands of records for one Owner.

Actual Owner commercial allowances still apply, including Free 10 writes/minute
and 300 records, and Pro 60 writes/minute. A known minute-quota denial releases
its lane and continues next minute without SQL heartbeats. Financial uncertainty
stops the affected Owner; an unresolved transport/completion outcome stops new
Root work after already-started siblings finish. Owner calls have a 120-second
hard deadline; Root uses a 600-second soft deadline, awaits started calls and
stays within the platform's 900-second wall limit. Release B's official
configuration readback verified limits of 300,000ms CPU and 9,000 subrequests;
standard usage metadata does not prove a paid Cloudflare subscription.

Independent code review, 230 focused checks and three new fault checks passed.
The smoke and both larger native profiles passed against the same final source:
1,000 local expenses across 200 Free Owners, five each, in 33.985 seconds;
3,000 across 600 Free Owners, five each, in 107.635 seconds (rounded durations).
Observed concurrency peaked at eight and Owner native SQL at 178 statements.
See the [LOCAL load record](../norulo-server/docs/validation/production-recurring-load-native-local-2026-10-11.json).
These measurements do not establish an online SLA or thousands of expenses for
a single Owner; actual commercial quotas were retained. The final Server suite
passed 3,009 tests in 115.01 seconds. The earlier minimal daily native pass is
a historical checkpoint. A prior genuine production capacity query found
zero total/active/due rules (`rows_read: 1`, `rows_written: 0`); no production
fixture was added. The [daily release record](../norulo-server/docs/validation/production-daily-release-2026-10-11.json)
records release B's actual versions and readback; email/AI activation, all four
Server secret binding names, the original D1 and both Durable Object namespaces
were retained. Live scheduled financial and paid-provider journeys remain
unverified.

## Local development

Use Node 22.12 or newer. Wrangler is pinned in the npm lockfile; deployment
scripts use the installed CLI without downloading another version.

```bash
npm ci
npm run dev
```

The development server runs at `http://127.0.0.1:5173`. Development and preview
listen on loopback by default. For deliberate LAN access, use
`npm run dev -- --host 0.0.0.0` or `npm run preview -- --host 0.0.0.0`.
Set `VITE_API_BASE_URL=/api` when proxying to a local Server Worker configured
in `vite.config.js`. Set `VITE_GITHUB_APP_SLUG` only for the public GitHub
installation link. Browser environment variables must never contain GitHub,
Creem, or Jev secrets.

Local Creem sandbox workflows must explicitly set `VITE_CREEM_MODE=test` to
accept `test-checkout.creem.io`. Production-mode builds reject that host even
when this flag is set. Live checkout permits the exact `checkout.creem.io`
host and `/checkout/` paths on `creem.io` and `www.creem.io`.

The supplied Cloudflare deployment uses the same-origin `/api` proxy and a
`connect-src 'self'` content security policy. Absolute API bases are accepted for
development or separately hosted clients. An alternative host must configure
its own CSP to permit the exact API origin, together with the Server's CORS and
cookie settings; setting `VITE_API_BASE_URL` alone does not enable cross-origin
access in this Worker deployment.

`npm run check` runs lint, Vitest, and the production build. `npm run check:workers` checks the Worker configuration without publishing. `npm run deploy:workers` publishes and requires the current deployment scope and reviewed production bindings. The current task excludes preview publication.

`npm run test:layout` checks the built app in Chromium, WebKit and Firefox with
local read-only fixtures at desktop, tablet, iPhone-sized and Android-sized
widths. It verifies input boundaries and gaps across filter dates, expense
entry/editing and recurring start/end dates, including resized split panes.
It also checks the shared ledger picker with long option names and the API key
name/scopes form, including narrow mobile widths.
CI installs all three engines and runs this check after the build. For local
setup, run `PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/ms-playwright npx playwright install --with-deps chromium firefox webkit`; use
`npm run test:layout -- --browser=webkit` to inspect one engine. Layout changes
must pass these checks as well as the unit suite. Emulation is separate from
real iOS/Android device verification.
Firefox touch emulation emits compatibility mouse events without pointer events
for automated mouse drags. Those profiles verify actual separator sizes through
native keyboard controls; desktop Firefox retains native pointer dragging.
The layout report records the input method for each resize.

`npm run test:mobile-layout` checks the phone bottom navigation, native More
selector, form sizing, footer hit targets, display options and scroll/focus-locked
modals in Chromium and WebKit. It covers phone, tablet, desktop and short-screen
profiles with bounded local GET fixtures. Add `-- --screenshots` for optional
captures in the sibling `work/mobile-redesign-validation/captures` directory.
Linux WebKit touch-point limitations are reported without modifying navigator;
smaller viewport checks do not emulate a native keyboard. CI keeps unit-test
environment defaults separate from the API-prefixed browser build.

`npm run test:projects-layout` checks the Projects skeleton, loaded-page search,
status filter, result announcements, natural record heights, selectable links,
long exact monetary values, creation-rail resizing and browser font preferences
in Chromium, WebKit and Firefox, including all six locales at 320px. Run it after
building. CI uploads generated layout JSON and progress/error logs as 30-day artifacts under
`browser-validation`; local scratch output stays in ignored `work/` directories.

The production build explicitly targets Chrome/Edge 111+, Firefox 114+ and
Safari/iOS/iPadOS 16.4+. Android browsers must provide a compatible current
browser engine; old WebViews and embedded browsers are not automatically covered.
These build targets define syntax compatibility, not physical-device acceptance.
Keep them explicit when updating Vite, and validate Safari and Android keyboard,
download, authorization and background-return flows on actual devices.

The default display theme follows the operating system until a user selects a
theme. An early bootstrap applies it before rendering; the CSP authorizes that
script by its exact hash. Geist/Geist Mono are bundled locally with their OFL
license, and font sizes follow browser preferences through rem units.

## Cloudflare configuration

`wrangler.jsonc` maps `norulo.com` and `www.norulo.com` to `norulo-web` and binds API traffic to `norulo-server-production`, with `https://api.norulo.com` as the configured API origin. The production frontend has been published with these custom domains and bindings. Coordinate OAuth callbacks, cookies and allowed origins before provider acceptance. Do not put secrets in `wrangler.jsonc`.

Both configurations bind `ASSETS` and run the Worker first for HTML/API paths while serving `/assets/*` directly. This lets production apply route-specific SEO, private-page noindex and the `www` canonical redirect; production mode keeps public pages indexable. Preview mode adds a site-wide noindex header. The offline config guard checks both modes and routing shapes. This production-ready configuration does not activate or migrate the Server database.

`security-headers.js` owns the browser security policy. Vite generates
`dist/_headers` from it during every build for direct static responses; the
Worker uses the same values and adds the exact hash for route JSON-LD.

See [deployment status](docs/deployment.md) for current published versions and
remaining production gates, and [migration notes](docs/migration.md) for current
checks. The [imported validation directory](docs/validation/README.md) is source
history, including historical approvals; it is not current deployment authority.
Preview configuration is retained for offline reference and remains undeployed.
The production D1 database is initialized with schema version 12 and the full
Python Server is published. Health and unauthenticated access checks pass;
the user reports successful GitHub sign-in. Email authentication is enabled;
the user confirmed code delivery and successful email login. Repository
installation, account linking and authenticated ledger acceptance remain
pending. See the deployment notes for the remaining work order.

The release A Server suite passed 2,942 tests in 106.73 seconds, including 19
packaging regressions. Fresh AI quality verification passed with 36 valid
direct-provider responses, no retries and no
D1 use. Local monthly Owner-quota checks and production recurring local native
verification also passed. The 2026-10-11 release B readback shows D1/email
`1`/`1`, AI `1`/`1`, recurring `1` and one daily cron. `TYPESAFE_API_KEY` is a
Server Worker secret and must never be added to Web/Vite settings. Real
Worker/provider HTTPS and paid end-to-end
behavior remain unverified limitations, rather than extra pre-release quality
calls. Creem billing remains optional and unconfigured. The release notes record
the exact verified commits and versions; later documentation publication or
redeployment must be recorded from its own actual readback.
The published daily scheduler's LOCAL capacity proof and final 3,009-test Server
suite passed. Release B verified the actual CPU/subrequest limits and deployment
configuration; account subscription/billing eligibility remains unverified.
The Web API guide's direct/proxy examples, default URL and six-locale
availability copy were corrected for production, along with its README link.
All 15 existing related API-guide/docs tests passed in 3.84 seconds, and lint
passed after that change. The earlier 1,654-test pass predates this correction;
release B's fresh production build and offline Worker check passed with the
corrected guide. All 55 dist artifacts were checked for old branding; all 13
public assets matched dist byte-for-byte and the original logo hash was unchanged.
