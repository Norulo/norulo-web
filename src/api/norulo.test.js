import { beforeEach, describe, expect, it, vi } from "vitest";
import { noruloApi } from "./norulo.js";
import { request } from "./http.js";

vi.mock("./http.js", () => ({ request: vi.fn() }));

describe("noruloApi current product endpoints", () => {
  beforeEach(() => request.mockReset());

  it("does not expose the retired scan and issue clients", () => {
    expect(noruloApi.scans).toBeUndefined();
    expect(noruloApi.issues).toBeUndefined();
    expect(noruloApi.apiKeys.createAuditBundleKey).toBeUndefined();
  });

  it("encodes dynamic path segments for current account operations", async () => {
    request.mockResolvedValue({});

    await noruloApi.integrations.disconnect("github/custom");
    await noruloApi.integrations.createGitHubInstallationManageSession("install/999", {
      githubIdentityId: "ghi_1",
    });
    await noruloApi.apiKeys.revoke("key/with spaces#1");

    expect(request).toHaveBeenNthCalledWith(1, "/integrations/github%2Fcustom", {
      method: "DELETE",
    });
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/integrations/github/installations/install%2F999/manage-sessions",
      { method: "POST", body: { githubIdentityId: "ghi_1" } }
    );
    expect(request).toHaveBeenNthCalledWith(3, "/api-keys/key%2Fwith%20spaces%231", {
      method: "DELETE",
    });
  });

  it("calls current API key endpoints", async () => {
    request.mockResolvedValue({});

    await noruloApi.apiKeys.list();
    await noruloApi.apiKeys.create({ name: "Automation" });

    expect(request).toHaveBeenNthCalledWith(1, "/api-keys");
    expect(request).toHaveBeenNthCalledWith(2, "/api-keys", {
      method: "POST",
      body: { name: "Automation" },
    });
  });

  it("passes abort signals to health and billing requests", async () => {
    request.mockResolvedValue({});
    const controller = new AbortController();

    await noruloApi.system.health({ signal: controller.signal });
    await noruloApi.billing.createCheckoutSession({ plan: "pro" }, { signal: controller.signal });

    expect(request).toHaveBeenNthCalledWith(1, "/health", { signal: controller.signal });
    expect(request).toHaveBeenNthCalledWith(2, "/billing/checkout-sessions", {
      method: "POST",
      body: { plan: "pro" },
      signal: controller.signal,
    });
  });

  it("forwards the Settings lifecycle signal to integration reads", async () => {
    request.mockResolvedValue({});
    const controller = new AbortController();
    await noruloApi.integrations.list({ signal: controller.signal });
    expect(request).toHaveBeenCalledWith("/integrations", { signal: controller.signal });
  });

  it("reads personal Jev settings without a selected workspace or authorization override", async () => {
    const preference = {
      enabled: true,
      revision: 7,
      eligible: true,
      available: false,
      monthlyBudgetUsd: "3",
    };
    request.mockResolvedValueOnce(preference);
    const controller = new AbortController();
    await expect(
      noruloApi.account.getJev({
        signal: controller.signal,
        workspaceId: "someone_else",
        headers: { "X-Norulo-Workspace": "someone_else" },
      })
    ).resolves.toBe(preference);
    expect(request).toHaveBeenCalledWith("/api/v1/account/jev", {
      signal: controller.signal,
    });
  });

  it("reads personal retention independently of the selected ledger without enabling it", async () => {
    const preference = { autoRemoveOldestExpense: false, revision: 1 };
    request.mockResolvedValueOnce(preference);
    const controller = new AbortController();
    await expect(
      noruloApi.account.getExpenseRetention({
        signal: controller.signal,
        workspaceId: "someone_else",
        headers: { "X-Norulo-Workspace": "someone_else" },
      })
    ).resolves.toBe(preference);
    expect(request).toHaveBeenCalledExactlyOnceWith("/api/v1/account/expense-retention", {
      signal: controller.signal,
    });
  });

  it.each([true, false])(
    "saves retention=%s with its account revision and no workspace override",
    async (autoRemoveOldestExpense) => {
      request.mockResolvedValue({});
      const controller = new AbortController();
      await noruloApi.account.updateExpenseRetention(3, autoRemoveOldestExpense, {
        signal: controller.signal,
        workspaceId: "someone_else",
        headers: { "If-Match": '"999"' },
      });
      expect(request).toHaveBeenCalledExactlyOnceWith("/api/v1/account/expense-retention", {
        method: "PATCH",
        headers: { "If-Match": '"3"' },
        body: { autoRemoveOldestExpense },
        signal: controller.signal,
      });
    }
  );

  it.each([true, false])(
    "writes only the explicit enabled=%s preference with its quoted revision",
    async (enabled) => {
      request.mockResolvedValue({});
      const controller = new AbortController();
      await noruloApi.account.updateJev(7, enabled, {
        signal: controller.signal,
        workspaceId: "someone_else",
        headers: { "If-Match": '"999"' },
      });
      expect(request).toHaveBeenCalledExactlyOnceWith("/api/v1/account/jev", {
        method: "PATCH",
        headers: { "If-Match": '"7"' },
        body: { enabled },
        signal: controller.signal,
      });
    }
  );

  it("propagates a preference revision conflict without retrying or refreshing automatically", async () => {
    const conflict = Object.assign(new Error("conflict"), { status: 412 });
    request.mockRejectedValueOnce(conflict);
    await expect(noruloApi.account.updateJev(7, false)).rejects.toBe(conflict);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(["login", "link"])(
    "requests an email code for the explicit %s purpose",
    async (purpose) => {
      const challenge = { challengeId: "challenge_1", expiresIn: 600, retryAfter: 60 };
      request.mockResolvedValueOnce(challenge);
      const controller = new AbortController();

      await expect(
        noruloApi.auth.requestEmailCode(
          { email: "person@example.com", purpose },
          { signal: controller.signal }
        )
      ).resolves.toBe(challenge);

      expect(request).toHaveBeenCalledWith("/auth/email/request-code", {
        method: "POST",
        body: { email: "person@example.com", purpose },
        signal: controller.signal,
      });
    }
  );

  it("verifies the issued email challenge without removing code leading zeros", async () => {
    const session = { authenticated: true, user: { id: "usr_1", email: "person@example.com" } };
    request.mockResolvedValueOnce(session);
    const controller = new AbortController();

    await expect(
      noruloApi.auth.verifyEmailCode(
        { email: "person@example.com", challengeId: "challenge_1", code: "001234" },
        { signal: controller.signal }
      )
    ).resolves.toBe(session);

    expect(request).toHaveBeenCalledWith("/auth/email/verify-code", {
      method: "POST",
      body: { email: "person@example.com", challengeId: "challenge_1", code: "001234" },
      signal: controller.signal,
    });
  });

  it("preserves server email verification failures without retrying", async () => {
    const failure = Object.assign(new Error("The code has expired."), {
      code: "EMAIL_CODE_EXPIRED",
    });
    request.mockRejectedValueOnce(failure);

    await expect(
      noruloApi.auth.verifyEmailCode({
        email: "person@example.com",
        challengeId: "challenge_1",
        code: "001234",
      })
    ).rejects.toBe(failure);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rejects empty dynamic account path segments", () => {
    expect(() => noruloApi.integrations.disconnect("")).toThrow(/path segment/i);
    expect(() => noruloApi.integrations.createGitHubInstallationManageSession("", {})).toThrow(
      /path segment/i
    );
    expect(() => noruloApi.apiKeys.revoke("")).toThrow(/path segment/i);
    expect(request).not.toHaveBeenCalled();
  });
});
