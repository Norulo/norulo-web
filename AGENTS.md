# Norulo Web

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
application is published, while the bound Server remains a setup bootstrap with
503 responses. The user has explicitly deferred D1 creation and activation;
do not create or modify D1 resources within the current scope. Publication and
configured GitHub secrets do not establish OAuth or ledger acceptance.

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
other console lists retain equal natural rows. Keep whole names, descriptions,
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

Use Node ^20.19.0 or >=22.12.0 and the committed npm lockfile. Run `npm ci`,
`npm run check` (lint, all tests, build) and `npm run check:workers` (offline).
After a completed build use applicable bounded Playwright layout scripts from
package.json. Browser fixtures are local evidence, not actual provider/device
acceptance. CI uses Chromium, Firefox and WebKit; report engine/coarse-pointer
limitations accurately. Keep generated output, browser captures, caches and
local configuration in existing ignored locations.

For API-prefixed local browser validation build with `VITE_API_BASE_URL=/api`
and a loopback VITE_APP_URL. Disable the inherited Vite preview proxy for
static captures because its `/api` prefix also catches the `/api-keys` document
route. Finish builds before browser captures, which rely on a stable dist tree.
Use strict free ports and bounded loopback fixtures; do not call remote APIs.

Cloudflare deployment requires current authorization and reviewed matching
Server/Web bindings, domains, allowed origins, cookie settings and provider
callbacks. Never reuse imported resource IDs or accept historical source
publication as Norulo readiness. Offline checks do not establish publication.
Keep package signature, checksum and TLS verification enabled. Do not overwrite
tracked files, manifests or lockfiles solely for onboarding fixes.
