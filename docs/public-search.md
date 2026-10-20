# Public HTML and search access

Norulo pre-renders `/`, `/pricing`, `/developers/docs`, `/developers/api` and
`/plugins` during the existing production build. `src/entry-public.jsx` renders
the existing anonymous product, guide and MCP components to HTML, with their
native navigation links. The build adds each route's existing stylesheet assets.
It makes no network requests and runs no browser effects. Initial documents use
English, matching their `lang` and SEO metadata; the existing browser startup
restores the user's selected language and theme as before.

`dist/index.html` remains the original empty SPA shell. Only GET/HEAD requests
matching the explicit map in `public-pages.js` select the generated documents.
Protected routes, login, OAuth, API proxying, data operations and the browser
React entry are unchanged. React still mounts with `createRoot`; it does not
hydrate a separate application or trust pre-rendered HTML as account state.
The same public HTML is served to readers and crawlers, without user-agent tests.

## Current pricing

The pricing document reads the existing Server `/billing/plan` projection through
`NORULO_SERVER`. This is a fixed, anonymous GET: browser cookies, authorization,
workspace selection, query parameters and response cookies are never used in
the public price markup. Only known plan prices and allowances are rendered;
account and usage fields are ignored. Both monthly and annual prices are readable
without JavaScript. The existing browser pricing and checkout implementation
continues to load its own current, account-aware state.

This adds one anonymous catalog read per pricing document GET. It does not
create a ledger write, checkout, model call or authentication request. Server
retains ownership of catalog caching and any underlying accounting; Web has no
D1 binding and does not issue SQL. Remote row metrics are not exposed by this
endpoint, so no zero-row-cost claim is made.

The read has a 2.5-second deadline, 64 KiB body limit, no redirect following,
no public-origin fallback and no retries. Unverifiable prices produce an explicit
unavailable message; the normal browser UI still starts. Pricing HTML uses
`Cache-Control: no-store`. HEAD does not read the catalog. Source asset validators
and range headers are not reused for transformed public HTML.

## Cloudflare boundary

The 2026-10-20 change exempts only GET/HEAD on the five named public routes
(including their trailing-slash forms), `robots.txt` and `sitemap.xml`, on
`norulo.com` and `www.norulo.com`, from the document Managed Challenge and Browser
Integrity Check. The new skip rule skips only `bic`; it does not skip WAF phases,
rate limiting or application authorization. Browser Integrity Check remains on
at the zone level. The existing callback and MCP protocol rules are preserved.
Login, console routes, APIs and non-GET/HEAD requests are outside this exception.

`robots.txt` retains its separate search/training preferences. Neither a test
user-agent nor successful HTTP responses establish that a genuine crawler has
visited. The security-events GraphQL dataset was unavailable to this zone during
the investigation. Search Console/Bing property access is also not established;
actual indexing and inclusion in AI answers remain external observations.

## Verification and rollback

Run `npm ci`, `npm run check`, `npm run check:workers`, the Wrangler dry-run and
`npm run test:public-documents` after a completed build. The latter runs the actual
Worker against built assets and finite local API fixtures at 320px and 1440px,
with JavaScript disabled and enabled. It checks public content, native links,
both pricing intervals, private-route fallback and unchanged sign-in controls.
Existing Projects and account-onboarding browser scripts cover the console,
six languages and mobile layouts using local fixtures.

CI includes the public document browser check. Production verification now
requires readable public HTML and the current catalog, in addition to the
existing health, configuration and asset-byte checks; a public challenge no
longer counts as successful publication.

The previous Web version was `be5fb290-ecf3-48c1-8c0b-6e438a986fe3` at 100%.
Application rollback can restore that version without redeploying Server,
Connect or touching a database. Cloudflare policy rollback separately restores
the saved expression of `b49bd5c1f65b457aab2250a70330e572` and removes only the new
`e5e9fb1067bd4c278d3cceed16ad3483` BIC skip rule. Exact before/after policy and
publication evidence belong in the dated release record.
