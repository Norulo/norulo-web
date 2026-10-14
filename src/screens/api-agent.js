import apiContract from "../data/api-contract.json";

const METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);
const OMIT = new Set(["description", "title", "example", "examples", "externalDocs", "xml"]);

function resolve(node, contract) {
  if (!node?.$ref) return node;
  return node.$ref
    .split("/")
    .slice(1)
    .reduce((value, key) => value?.[key], contract);
}

// Keep validation and shared references, without repeating long descriptions or
// expanding the same schema for every endpoint. Property names are never filtered.
function compactSchema(node, definitions, contract) {
  if (Array.isArray(node)) return node.map((value) => compactSchema(value, definitions, contract));
  if (!node || typeof node !== "object") return node;
  if (node.$ref?.startsWith("#/components/schemas/")) {
    const name = node.$ref.split("/").at(-1);
    if (!definitions.has(name)) {
      definitions.set(name, null);
      definitions.set(name, compactSchema(resolve(node, contract), definitions, contract));
    }
    return {
      ...compactSchema(
        Object.fromEntries(Object.entries(node).filter(([key]) => key !== "$ref")),
        definitions,
        contract
      ),
      $ref: `#/$defs/${name}`,
    };
  }
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !OMIT.has(key) && !key.startsWith("x-"))
      .map(([key, value]) => [
        key,
        key === "properties"
          ? Object.fromEntries(
              Object.entries(value).map(([field, schema]) => [
                field,
                compactSchema(schema, definitions, contract),
              ])
            )
          : compactSchema(value, definitions, contract),
      ])
  );
}

export function agentMarkdown(base, contract = apiContract) {
  const definitions = new Map();
  const querySchemas = new Map();
  const endpoints = [];
  for (const [path, rawItem] of Object.entries(contract.paths)) {
    const item = resolve(rawItem, contract);
    for (const [method, rawOperation] of Object.entries(item)) {
      if (!METHODS.has(method)) continue;
      const operation = resolve(rawOperation, contract);
      const security = operation.security ?? contract.security ?? [];
      if (!security.some((alternative) => Object.hasOwn(alternative, "bearerKey"))) continue;
      const parameters = new Map();
      for (const raw of [...(item.parameters || []), ...(operation.parameters || [])]) {
        const parameter = resolve(raw, contract);
        parameters.set(`${parameter.in}:${parameter.name}`, parameter);
      }
      const query = [...parameters.values()]
        .filter((parameter) => parameter.in === "query")
        .map((parameter) => {
          const schema = JSON.stringify(compactSchema(parameter.schema, definitions, contract));
          const variants = querySchemas.get(parameter.name) || new Set();
          variants.add(schema);
          querySchemas.set(parameter.name, variants);
          return `${parameter.name}${parameter.required ? "*" : ""}`;
        });
      const headers = [...parameters.values()]
        .filter((parameter) => parameter.in === "header" && parameter.required)
        .map((parameter) => parameter.name);
      const request = resolve(operation.requestBody, contract);
      const body = request?.content?.["application/json"]?.schema;
      const input = body ? JSON.stringify(compactSchema(body, definitions, contract)) : "—";
      const responses = Object.entries(operation.responses || {})
        .filter(([status]) => /^2/.test(status))
        .map(([status, raw]) => {
          const response = resolve(raw, contract);
          const content = Object.entries(response.content || {});
          return content.length
            ? content
                .map(
                  ([media, value]) =>
                    `${status} ${
                      media === "application/json"
                        ? JSON.stringify(compactSchema(value.schema, definitions, contract))
                        : media
                    }`
                )
                .join("; ")
            : `${status} no body`;
        })
        .join("; ");
      endpoints.push(
        `### ${method.toUpperCase()} ${path}${operation.deprecated ? " (deprecated)" : ""}\nScope: ${operation["x-norulo-scope"] || "See OpenAPI conditions"}${headers.length ? `; headers: ${headers.join(", ")}` : ""}${query.length ? `; query: ${query.join(", ")}` : ""}\nInput: ${input}\nSuccess: ${responses}`
      );
    }
  }
  return [
    "# Norulo API for coding agents",
    "",
    `Base URL: ${base.replace(/\/$/, "")}`,
    "Append paths exactly as listed. Production direct: https://api.norulo.com/api/v1/me; Web proxy: https://norulo.com/api/api/v1/me. Use credentials from the same environment.",
    "Full contract: https://norulo.com/openapi/ledger-v1.json (English field names and endpoint-specific errors).",
    "",
    "## What Norulo does and how its concepts relate",
    "Norulo is a project expense ledger for developers and teams. It records one-off costs, schedules recurring costs, filters expenses by date/category/target/currency, reports totals and exports CSV. Team roles and scoped API keys share authorized ledger access. Recording an expense does not pay an invoice, purchase a service or renew an external subscription.",
    "- Ledger / workspace: the financial boundary owned by one Owner. It contains projects, one shared pool, ledger-wide categories, expenses and recurring rules. A shared ledger is a ledger shared with members; the shared pool is a cost destination inside that ledger. They are different concepts.",
    "- Project: the product or initiative that incurred a cost, such as Website launch. A project can be standalone; GitHub repositories and an Organization are optional associations, not prerequisites or separate expense targets. A GitHub Organization does not grant ledger membership.",
    '- Shared pool: cross-project costs such as a team-wide software subscription. It already exists conceptually; do not create a pool resource or a fake project named Shared. Use target:{"kind":"shared"}, with no projectId. It counts once in the ledger total, without automatic allocation or duplication into project totals.',
    "- Category: what the expense was for, such as Hosting, Software or Domains. Categories belong to the ledger and are reused by both projects and the shared pool; they are not nested under a project. Select one active category for each new expense. Free ledgers require an explicit categoryId; your external agent can choose it without Norulo's paid Jev assistance.",
    '- Expense: one dated amount in one currency, with a purpose and optional note/quantity/unit. It belongs to exactly one project via target:{"kind":"project","projectId":"REAL_PROJECT_ID"}, or to the shared pool, and uses one categoryId. Reports aggregate saved expenses by currency without conversion.',
    "- Recurring rule: a template and calendar schedule that posts separate expenses to one immutable target. Future planned costs do not enter totals until posted; do not create recurrence unless the user asks for it.",
    "",
    "## User setup before agent API work",
    "1. User opens https://norulo.com/developers/api, clicks Copy for Agent and sends this guide to their Coding Agent. The walkthrough is https://norulo.com/developers/docs#agent-setup.",
    "2. User signs in at https://norulo.com/api-keys, chooses the intended ledger, and creates a key with profile:read, projects:read, categories:read, expenses:read, expenses:write and reports:read. To initialize missing projects/categories, an Owner/Admin additionally grants projects:write and categories:write; omit restrictions.projectIds to permit new projects. Explicitly enable restrictions.shared for shared costs. Read-only defaults cannot add expenses.",
    "3. User stores the one-time token in NORULO_API_KEY in the agent's secure environment or secret manager, and sets NORULO_API_BASE to the Base URL above. A local .env must be Git-ignored and explicitly loaded by the runtime; a file alone does not set process variables. Pass only variable names in chat. Never expose the key in source, prompts, client/Vite variables, command history, diagnostics or logs. Do not print the environment or Authorization header. If credentials are missing, ask for secure configuration, not the plaintext token.",
    "4. User asks the agent to read this guide and provides costs as text, or receipt images/PDFs if the model supports them. Extract date, exact amount, currency, purpose, target and category. The REST API takes structured JSON and has no image/PDF receipt-upload endpoint; do not claim receipts were uploaded or retained. Preserve useful source references in note. Ask about unclear fields before financial writes; do not invent amounts, currencies, dates or project assignments.",
    "",
    "## From an empty ledger to useful expense records",
    "1. Inspect GET /api/v1/me for the actual identity, workspace.id/role, scopes, entitlements and ledgerUsage. Also respect the key's configured project/shared restrictions and the Owner's retention policy; /me does not return key restrictions. Do not enable autoRemoveOldestExpense or delete old records to make room without the user's explicit request.",
    "2. Read GET /api/v1/projects (paged items/nextCursor) and GET /api/v1/categories (array); reuse matching active resources. Do not assume an empty/error response means setup is safe; check HTTP success and visible scope. Never invent resource IDs.",
    '3. Build the structure the user needs. With Owner/Admin and categories:write, POST /api/v1/categories {"name":"Hosting"} and keep its returned id; repeat only for missing requested categories. With projects:write and suitable project access, POST /api/v1/projects {"name":"Website launch","description":"Launch costs"} and keep its returned id. Shared-only costs need categories but no project. If role/scopes block setup, ask the user to create missing resources in https://norulo.com/categories or https://norulo.com/projects or issue a suitable key; never bypass permission checks.',
    "4. Map each confirmed source cost to one project or shared target and one active category. Example: the website's USD 12.00 hosting bill belongs to Website launch / Hosting; a team-wide software bill belongs to shared / Software. Keep independent currencies. Distinguish invoice totals from included line items so the same cost is not counted twice. Read existing expenses with matching target/date/currency and inspect possible duplicates before importing; idempotency prevents request replay, not repeated imports with new keys.",
    "5. Submit each authorized expense separately with POST /api/v1/expenses, a unique durable Idempotency-Key and exact JSON (example below). Use amount as a decimal string, not binary floating point. Keep a local import journal of source identity, request body, idempotency key and returned expense ID, without secrets; do not issue a fresh key blindly after a lost response.",
    "6. GET /api/v1/expenses/{returnedId} to verify target, category, date, amount and currency. Check GET /api/v1/reports/summary with the intended target/filter (reports:read). Report saved IDs, per-currency totals, skipped duplicates, unresolved inputs and failed/uncertain writes. User can review https://norulo.com/overview, project detail or https://norulo.com/shared. A request sent or receipt parsed is not proof of a saved expense.",
    "7. If requested, create recurring templates only after their target/category exist using POST /api/v1/expense-recurring-rules (see schedule rules below). startOn on/before local today records the initial expense immediately, so do not also import that same initial cost as a separate one-off. Future schedules are planned costs, not saved expenses.",
    "",
    "## Authentication and authority",
    "- Send Authorization: Bearer $NORULO_API_KEY (nrk_ prefix). Obtain the one-time key from API Keys; store it securely outside source code and logs.",
    "- Authority = key scopes ∩ issuer's current role ∩ ledger/project/shared restrictions. Revocation, expiry or a membership revision change invalidates access. A project allowlist does not grant shared-pool access.",
    "- Owner/Admin manage projects and categories; Owner/Admin/Editor write expenses and recurring rules; Viewer reads. Only the actual Owner can delete a project.",
    "- Keys bind to one ledger; X-Norulo-Workspace cannot switch it. Cookie clients select a ledger with that header; CSV links can use workspaceId. Conflicting selectors fail.",
    "- GET /api/v1/me returns workspace, scopes, entitlements and ledgerUsage. Use current Owner allowances; do not hardcode plan capacity or assume the actor's personal plan applies.",
    "- Governance requires members:write, a whole-ledger key without projectIds, and Owner/Admin authority. Owner manages Admins; Admin manages Editors/Viewers. Only the original inviter approves/rejects applicants with the request revision. Membership does not grant GitHub access.",
    "- Key creation/revocation (/api-keys), account preferences (/api/v1/account/*), invitation preview/accept and GitHub refresh require the user's cookie session; Bearer keys cannot perform them. Cookie writes require a trusted app Origin. Billing is separate from recorded expenses.",
    "",
    "## First expense",
    "1. GET /api/v1/me (profile:read); GET /api/v1/categories (categories:read) and choose an active category ID.",
    "2. For a project, GET /api/v1/projects (projects:read) and use its real ID. Shared writes need shared-pool permission.",
    "3. Persist a unique Idempotency-Key and the exact JSON body, then POST /api/v1/expenses (expenses:write).",
    "```sh",
    `curl --fail-with-body --silent --show-error '${base.replace(/\/$/, "")}/api/v1/expenses' \\`,
    '  -H "Authorization: Bearer $NORULO_API_KEY" \\',
    "  -H 'Content-Type: application/json' \\",
    '  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \\',
    '  --data \'{"target":{"kind":"shared"},"occurredOn":"2026-10-14","amount":"12.00","currency":"USD","categoryId":"REPLACE_WITH_ACTIVE_CATEGORY_ID","purpose":"Hosting"}\'',
    "```",
    'For a project, target = {"kind":"project","projectId":"REAL_PROJECT_ID"}. Success returns an Expense with id and revision.',
    "",
    "## Writes, errors and exact values",
    '- JSON bodies use Content-Type: application/json. Read before editing/removing; send the resource revision quoted as If-Match: "7". Expense PATCH replaces the complete editable input; Project PATCH is partial. Never send read-only response fields back as input.',
    "- Expense/rule creates require Idempotency-Key (1–128 characters). A lost response can be reconciled by resending the identical body and key. Changed input/new intent needs a new key. Never automatically retry project, invitation, approval, review, PATCH or DELETE writes after an uncertain outcome.",
    "- Check HTTP status before consuming success. 204 has no JSON body. Errors use error.code (and sometimes error.message/details); a failure is never an empty list or zero total.",
    "- 401: replace invalid credentials; 403: check scope, role and target; 404: unavailable/not visible; 409: state or idempotency conflict; 412: explicitly reload and reconcile; 428: add If-Match; 422: fix input/CATEGORY_REQUIRED; 429: inspect error.code and Retry-After, resolve capacity or wait for rate allowance. Do not loop writes automatically.",
    "- Send nonnegative decimal amount strings, uppercase three-letter currency codes and YYYY-MM-DD business dates. Respect currency precision (USD 12.00, JPY 1200). amountMinor is an integer in the currency's smallest unit; aggregate totals above 9007199254740991 are decimal integer strings. Use BigInt/decimal arithmetic; keep currencies separate.",
    "- Paged lists return {items,nextCursor}; limit 1–100 (default 50). Keep filters fixed, use the opaque cursor, stop at null or a repeated cursor. Categories return an array; member/invitation inboxes use their documented bounded items/hasMore shapes. from is inclusive; to is exclusive. target=project needs projectId; target=shared forbids it.",
    "",
    "## Resource rules",
    '- Standalone project: POST /api/v1/projects {"name":"Website launch"}; description optional. GitHub links use 1–30 distinct authorized githubRepoIds; use the plural field. A non-null githubOrganizationId requires repositories and current organization access. PATCH githubRepoIds:[] removes links and clears the organization; the final name must be nonblank. Linked project expense creation needs access to at least one linked repository.',
    "- Project status active/archived is reversible. DELETE project is actual-Owner-only and permanently removes its retained expenses and schedules through this API; moved-out expenses survive. Expense DELETE removes the record from visible ledger/report/export, with audit history retained and no restore endpoint.",
    "- Category DELETE archives. POST /categories/{id}/remove with {} permanently removes it from selection but preserves historical metadata (includeRemoved=true). An expense edit can retain its own original removed/archived category; new assignments must use an active category.",
    "- At expense capacity, RECORD_LIMIT blocks creation unless the Owner enabled autoRemoveOldestExpense. Replacement removes the actual globally oldest permitted record atomically; RETENTION_TARGET_FORBIDDEN changes nothing. RETENTION_CLEANUP_REQUIRED needs manual cleanup above capacity. Failed creates/idempotent replay never remove another record.",
    "- Recurring rules use expense scopes and target restrictions. Creation requires Idempotency-Key; changes/cancellation require If-Match. Complete edits replace template+schedule with immutable target; status-only PATCH uses active/paused. Cancellation preserves already recorded expenses.",
    "- schedule: IANA timezone + startOn; weekly weekday 1–7 (Monday=1); monthly day 1–31; quarterly day + quarterMonth 1–3; yearly day + month 1–12. Send only that frequency's selectors. endOn is inclusive; short months clamp to their last day.",
    "- startOn on/before local today immediately records one expense on startOn, without historical backfill. A future start waits. Planned costs stay outside reports until posted. Production checks daily at 16:10 UTC; timezone due dates can wait roughly 24 hours plus backlog. Read nextOccurrenceOn/nextRunAt/blockedCode/pendingOccurrences; GET never posts expenses. At most 100 noncanceled rules; first 10 capacity-failed occurrences are retained. Explicit PATCH {retryPeriodKey} retries one retained frozen occurrence after resolving capacity. Resume skips paused periods.",
    "- Free ledgers need explicit categoryId. Eligible Owner Pro/Max ledgers may omit it for automatic Jev categorization within enabled preference/runtime/monthly allowance; CATEGORY_REQUIRED leaves input unsaved. Explicit category/target/money remain unchanged. Ordinary writes need no suggestions:use scope. Background recurrence reuses the saved category.",
    "- Expense review: POST /expenses/{id}/review with {} and If-Match uses expenses:write and eligible Owner plan; shares Jev allowance, never edits or advances revision, and has no idempotency replay. checked/issue/uncertain/unavailable are distinct; explicitly GET and PATCH to apply any advice. Advanced expense-suggestions never save an expense.",
    "- Activity requires expenses:read, one project/shared target, and projects:read for project-setting events. Only the latest server-clock 24 hours are available; cursor does not extend that window.",
    "",
    "## Bearer endpoints",
    "Paths are relative to Base URL. Required query parameters have *. Input/Success schemas refer to the shared $defs below; — means no body. Scope alone does not grant role/target authority.",
    "",
    ...endpoints,
    "",
    "## Query parameter schemas",
    "Variants reflect endpoint-specific constraints; activity target accepts only project/shared. Omit optional parameters rather than sending null.",
    ...[...querySchemas].map(([name, variants]) => `- ${name}: ${[...variants].join("; ")}`),
    "",
    "## Shared request and response schemas",
    "Compact JSON Schema: required lists are mandatory; optional properties may be omitted. Preserve enums, patterns, bounds and conditional requirements. $ref resolves within this document's $defs. Descriptions/examples are omitted; resource rules above retain behavioral requirements.",
    "```json",
    JSON.stringify({ $defs: Object.fromEntries(definitions) }, null, 0),
    "```",
  ].join("\n");
}
