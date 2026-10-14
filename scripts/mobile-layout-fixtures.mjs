import assert from "node:assert/strict";
import { createDateLayoutFixture, WORKSPACE_ID } from "./date-layout-fixtures.mjs";

// Synthetic, bounded GET responses. This guard never forwards a business read
// or any write to a Server. Reuse the contract-backed ledger/date DTOs.
export const MOBILE_VERIFIED_EMAIL =
  "verified.account.for.project.and.shared.expense.records@development.and.infrastructure.operations.example.com";
export const MOBILE_ACCOUNT_NAME =
  "LongReadableAccountNameForProjectAndSharedExpenseOwnership".repeat(2);
export const MOBILE_NORMAL_EMAIL = "taylor@example.com";
export const MOBILE_NORMAL_NAME = "Taylor";

export function createMobileLayoutFixture({
  baseURL,
  accountOnboarding = false,
  accountIdentity = "long",
}) {
  const base = new URL(baseURL);
  // Include self-hosted fonts and each visited screen's lazy CSS in the same
  // finite request allowance used by the multi-screen date checker.
  const core = createDateLayoutFixture({ baseURL, cap: 120 });
  const requests = [];
  const violations = [];
  let longInbox = false;
  const normalize = (path) =>
    path
      .replace(/^\/api\/api\/v1(?=\/|$)/, "/api/v1")
      .replace(/^\/api\/auth(?=\/|$)/, "/auth")
      .replace(/^\/api\/billing(?=\/|$)/, "/billing");
  const inbox = Array.from({ length: 16 }, (_, index) => ({
    id: `req_mobile_${index}`,
    status: "pending",
    revision: 1,
    invitationId: `inv_mobile_${index}`,
    invitation: { id: `inv_mobile_${index}`, role: "viewer" },
    workspaceId: WORKSPACE_ID,
    workspace: { id: WORKSPACE_ID, name: "Local mobile compatibility ledger" },
    applicant: {
      userId: `usr_mobile_applicant_${index}`,
      name: `Local applicant ${index + 1} · long readable account name`,
      githubLogin: `mobile-layout-applicant-${index + 1}`,
    },
    createdAt: "2026-10-01T00:00:00Z",
  }));
  // Match the ten frozen occurrences on rec_date_shared in the ledger fixture.
  // Both inbox sections need real rows when the reduced viewport is scrolled
  // to the bottom; an empty trailing section has no row to hit-test.
  const pendingExpenses = Array.from({ length: 10 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const periodKey = `M2026-${month}`;
    return {
      id: `rec_date_shared:${periodKey}`,
      ruleId: "rec_date_shared",
      periodKey,
      scheduledOn: `2026-${month}-01`,
      workspaceId: WORKSPACE_ID,
      workspaceName: "Norulo preview team ledger",
      target: { kind: "shared" },
      amount: "24.50",
      currency: "USD",
      purpose: "Saved historical hosting",
      failedCode: "RECORD_LIMIT",
      createdAt: "2026-09-01T00:00:00Z",
    };
  });
  function extraPayload(path) {
    if (accountOnboarding && path === "/auth/session")
      return {
        authenticated: true,
        user: {
          id: WORKSPACE_ID,
          name: accountIdentity === "normal" ? MOBILE_NORMAL_NAME : MOBILE_ACCOUNT_NAME,
          email: accountIdentity === "normal" ? MOBILE_NORMAL_EMAIL : MOBILE_VERIFIED_EMAIL,
          emailVerified: true,
          providers: ["email"],
        },
      };
    if (accountOnboarding && path === "/api/v1/projects") return { items: [], nextCursor: null };
    if (path === "/api/v1/workspace-invitation-requests")
      return { items: longInbox ? inbox : [], hasMore: false };
    if (path === "/api/v1/recurring-expense-notifications")
      return { items: longInbox ? pendingExpenses : [], hasMore: false };
    if (path === `/api/v1/workspaces/${WORKSPACE_ID}/members`)
      return {
        items: [
          {
            userId: WORKSPACE_ID,
            name: "Local fixture owner",
            githubLogin: "date-layout-fixture",
            role: "owner",
            revision: 1,
            joinedAt: "2026-09-01T00:00:00Z",
          },
          {
            userId: "usr_mobile_viewer",
            name: "A local member with a long name for wrapping",
            githubLogin: "mobile-layout-viewer",
            role: "viewer",
            revision: 1,
            joinedAt: "2026-09-01T00:00:00Z",
          },
        ],
      };
    if (
      path === `/api/v1/workspaces/${WORKSPACE_ID}/invites` ||
      path === `/api/v1/workspaces/${WORKSPACE_ID}/join-requests`
    )
      return { items: [], hasMore: false };
    if (path === "/api/integrations")
      return { github: { connected: !accountOnboarding, repositories: [], installations: [] } };
    if (path === "/api/v1/account/jev")
      return {
        enabled: false,
        eligible: false,
        available: false,
        monthlyBudgetUsd: "0.00",
        monthlyCalls: 0,
        trialCalls: 20,
        period: "lifetime",
        revision: 1,
      };
    if (path === "/api/v1/account/expense-retention")
      return { autoRemoveOldestExpense: false, revision: 1 };
    if (path === "/billing/plan")
      return {
        enabled: true,
        provider: "creem",
        currency: "USD",
        plans: [
          {
            id: "free",
            name: "Free",
            entitlements: null,
            prices: {
              month: { amount: "0", currency: "USD", interval: "month", configured: true },
            },
          },
        ],
        account: { status: "free", plan: "free", interval: "month" },
        ledgerUsage: {
          workspaceId: WORKSPACE_ID,
          projects: { used: 1, limit: 3 },
          expenseRecords: { used: 2, limit: 300 },
        },
      };
    return undefined;
  }
  return {
    setLongInbox() {
      longInbox = true;
    },
    async handle(route) {
      const request = route.request();
      const url = new URL(request.url());
      const record = {
        path: normalize(url.pathname),
        url: url.href,
        method: request.method(),
        resourceType: request.resourceType(),
        workspace: request.headers()["x-norulo-workspace"] || null,
      };
      requests.push(record);
      try {
        assert(requests.length <= 160, "Mobile context request cap exceeded (160)");
        assert.equal(record.method, "GET", "Mobile fixtures allow only GET requests");
        const api =
          record.resourceType !== "document" && /^\/(?:api|auth|billing)(?:\/|$)/.test(record.path);
        record.api = api;
        assert(requests.filter((item) => item.api).length <= 80, "API GET cap exceeded (80)");
        if (url.origin !== base.origin) {
          // Core blocks known font requests and rejects every other destination.
          await core.handle(route);
          return;
        }
        if (!api)
          assert(
            record.resourceType === "document" ||
              /^\/(?:assets\/[^/]+\.(?:js|css|woff2?)|fonts\/geist(?:-mono)?-latin\.woff2|brand-mark\.png|favicon\.ico|apple-touch-icon\.png)$/.test(
                url.pathname
              ),
            `Unexpected local resource: ${url.pathname}`
          );
        const payload = api ? extraPayload(record.path) : undefined;
        if (payload === undefined) {
          await core.handle(route);
          return;
        }
        if (accountOnboarding && record.path === "/api/v1/projects") {
          for (const key of url.searchParams.keys()) {
            assert.equal(key, "limit", "Unexpected empty Projects query");
            assert.equal(url.searchParams.getAll(key).length, 1, "Duplicate Projects query");
            assert(
              /^(?:[1-9][0-9]?|100)$/.test(url.searchParams.get(key)),
              "Invalid Projects limit"
            );
          }
        } else assert.equal(url.search, "", `Unexpected extra-fixture query: ${record.path}`);
        if (
          record.path === "/billing/plan" ||
          record.path.startsWith("/api/v1/account/") ||
          record.path === "/api/v1/recurring-expense-notifications"
        )
          assert.equal(record.workspace, null, "Personal account read inherited workspace header");
        else if (record.workspace)
          assert.equal(record.workspace, WORKSPACE_ID, "Unexpected fixture workspace");
        record.extraFixture = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          headers: { "Cache-Control": "no-store" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        violations.push({ ...record, reason: error.message });
        await route.abort("blockedbyclient");
      }
    },
    recordResponse: core.recordResponse,
    snapshot() {
      return { requests, violations, core: core.getRequests() };
    },
    assertClean() {
      assert.deepEqual(violations, [], "Mobile fixture request violations");
      core.assertClean();
      return {
        total: requests.length,
        api: requests.filter((item) => item.api).length,
        blockedFonts: core.getRequests().counts.blockedFonts,
        writes: requests.filter((item) => item.method !== "GET").length,
        externalDelivered: core.getRequests().counts.externalDelivered,
      };
    },
  };
}
