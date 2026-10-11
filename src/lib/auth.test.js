import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noruloApi } from "../api/norulo.js";
import { captureGitHubRefreshScope, setGitHubRefreshIdentity } from "../api/github-refresh.js";
import { connectGitHubRepositories, manageGitHubInstallation, startGitHubLogin } from "./auth.js";
import {
  clearGitHubRepositoryAccessRefreshNeeded,
  markGitHubRepositoryAccessRefreshNeeded,
} from "./github-repository-access-refresh.js";
import { openGitHubInstallPopup } from "./install-popup.js";

vi.mock("../api/norulo.js", () => ({
  noruloApi: {
    auth: {
      getGitHubAuthorizeUrl: vi.fn(),
      signOut: vi.fn(),
    },
    integrations: {
      getGitHubAuthorizeUrl: vi.fn(),
      createGitHubInstallationManageSession: vi.fn(),
    },
    repositories: {
      sync: vi.fn(),
    },
  },
}));

vi.mock("./install-popup.js", () => ({
  openGitHubInstallPopup: vi.fn(),
}));

vi.mock("./github-repository-access-refresh.js", () => ({
  markGitHubRepositoryAccessRefreshNeeded: vi.fn(),
  clearGitHubRepositoryAccessRefreshNeeded: vi.fn(),
}));

function redirectScreen(call) {
  const redirectTo = call[0].redirectTo;
  return new URL(redirectTo).searchParams.get("screen");
}

function redirectPath(call) {
  const redirectTo = call[0].redirectTo;
  return new URL(redirectTo).pathname;
}

function redirectParam(call, name) {
  const redirectTo = call[0].redirectTo;
  return new URL(redirectTo).searchParams.get(name);
}

describe("auth redirects", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setGitHubRefreshIdentity(null);
    setGitHubRefreshIdentity("usr_one");
    window.history.replaceState({}, "", "/?screen=login#ignored");
  });
  afterEach(() => {
    setGitHubRefreshIdentity(null);
    vi.unstubAllGlobals();
  });

  function mockNavigation() {
    const browser = window;
    const assign = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { href: browser.location.href, hash: browser.location.hash, origin: browser.location.origin, assign, reload },
      addEventListener: browser.addEventListener.bind(browser),
      removeEventListener: browser.removeEventListener.bind(browser),
      dispatchEvent: browser.dispatchEvent.bind(browser),
    });
    return { assign, reload };
  }

  it.each(["login", "repository identity", "install fallback", "manage fallback"])(
    "reports %s full-page navigation without verifying provider completion",
    async (flow) => {
      const { assign } = mockNavigation();
      const oauthUrl = "https://github.com/login/oauth/authorize?client_id=app";
      const installationUrl = "https://github.com/apps/norulo/installations/new";
      noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValue({ url: oauthUrl });
      noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValue({ url: installationUrl });
      noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValue({ url: installationUrl });
      openGitHubInstallPopup.mockReturnValue(null);
      if (flow === "repository identity")
        noruloApi.integrations.getGitHubAuthorizeUrl.mockRejectedValueOnce(
          Object.assign(new Error("GitHub identity required"), { code: "GITHUB_IDENTITY_REQUIRED" })
        );

      const outcome = await (flow === "login"
        ? startGitHubLogin()
        : flow === "manage fallback"
          ? manageGitHubInstallation("999")
          : connectGitHubRepositories());

      expect(outcome).toEqual({ status: "redirecting" });
      expect(assign).toHaveBeenCalledExactlyOnceWith(
        ["login", "repository identity"].includes(flow) ? oauthUrl : installationUrl
      );
      expect(noruloApi.repositories.sync).not.toHaveBeenCalled();
    }
  );

  it("restores a full-page GitHub navigation only once when the old page returns from cache", async () => {
    const { reload } = mockNavigation();
    noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValue({ url: "https://github.com/login/oauth/authorize" });
    await startGitHubLogin();
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    expect(reload).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it.each(["lifecycle", "account"])("removes cache restoration after %s cancellation", async (cancellation) => {
    const { reload } = mockNavigation();
    const controller = new AbortController();
    noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValue({ url: "https://github.com/login/oauth/authorize" });
    await startGitHubLogin({ signal: controller.signal });
    if (cancellation === "lifecycle") controller.abort();
    else setGitHubRefreshIdentity("usr_other");
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not restore from cache when navigation fails or GitHub authorization uses a popup", async () => {
    const { assign, reload } = mockNavigation();
    noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValue({ url: "https://github.com/login/oauth/authorize" });
    assign.mockImplementationOnce(() => { throw new Error("navigation failed"); });
    await expect(startGitHubLogin()).rejects.toThrow("navigation failed");
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValue({ url: "https://github.com/apps/norulo/installations/new" });
    openGitHubInstallPopup.mockResolvedValue(closedWithAccessForNavigation());
    await connectGitHubRepositories();
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    expect(reload).not.toHaveBeenCalled();
  });

  function closedWithAccessForNavigation() {
    return { status: "closed_unverified", repositories: { githubAccess: "authorized", items: [{ fullName: "alice/service" }] } };
  }

  it("returns from GitHub login to the dashboard so slow session checks show a neutral restore state", async () => {
    noruloApi.auth.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("stop"));

    await expect(startGitHubLogin()).rejects.toThrow("stop");

    const call = noruloApi.auth.getGitHubAuthorizeUrl.mock.calls[0];
    expect(redirectPath(call)).toBe("/projects");
    expect(redirectScreen(call)).toBeNull();
    expect(call[0]).not.toHaveProperty("intent");
  });

  it("forwards explicit GitHub account-linking intent and the lifecycle signal", async () => {
    noruloApi.auth.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("stop"));
    const controller = new AbortController();
    const redirectTo = new URL("/settings", window.location.origin).toString();

    await expect(startGitHubLogin({
      redirectTo, intent: "link", signal: controller.signal,
    })).rejects.toThrow("stop");

    expect(noruloApi.auth.getGitHubAuthorizeUrl).toHaveBeenCalledWith(
      { redirectTo, intent: "link" },
      { signal: controller.signal }
    );
  });

  it("preserves invitation return fragments when starting ordinary GitHub login", async () => {
    const invitation = "#invite=abcdefghijklmnopqrst";
    window.history.replaceState({}, "", `/login${invitation}`);
    noruloApi.auth.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("stop"));

    await expect(startGitHubLogin()).rejects.toThrow("stop");

    const call = noruloApi.auth.getGitHubAuthorizeUrl.mock.calls[0];
    expect(call[0]).toEqual({ redirectTo: new URL(`/members${invitation}`, window.location.origin).toString() });
  });

  it("does not start GitHub authorization after its lifecycle is cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(startGitHubLogin({ intent: "link", signal: controller.signal }))
      .rejects.toMatchObject({ name: "AbortError" });

    expect(noruloApi.auth.getGitHubAuthorizeUrl).not.toHaveBeenCalled();
  });

  it("ignores a GitHub authorize URL received after lifecycle cancellation", async () => {
    const controller = new AbortController();
    let receiveUrl;
    noruloApi.auth.getGitHubAuthorizeUrl.mockReturnValueOnce(new Promise((resolve) => {
      receiveUrl = resolve;
    }));
    const completion = startGitHubLogin({ intent: "link", signal: controller.signal });
    controller.abort();
    receiveUrl({ url: "javascript:alert(1)" });

    await expect(completion).resolves.toBeUndefined();
  });

  it("keeps repository authorization scoped to the repositories flow", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("stop"));

    await expect(connectGitHubRepositories()).rejects.toThrow("stop");

    const call = noruloApi.integrations.getGitHubAuthorizeUrl.mock.calls[0];
    expect(redirectPath(call)).toBe("/projects");
    expect(redirectScreen(call)).toBeNull();
  });

  it("starts GitHub login first when repository authorization requires a GitHub identity", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockRejectedValueOnce(
      Object.assign(new Error("Sign in with GitHub before authorizing repositories."), {
        status: 401,
      })
    );
    noruloApi.auth.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("login-started"));

    await expect(connectGitHubRepositories()).rejects.toThrow("login-started");

    const call = noruloApi.auth.getGitHubAuthorizeUrl.mock.calls[0];
    expect(redirectPath(call)).toBe("/projects");
    expect(redirectScreen(call)).toBeNull();
    expect(redirectParam(call, "repoAuth")).toBe("1");
    expect(call[0].intent).toBe("link");
    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it.each([
    { code: "GITHUB_IDENTITY_REQUIRED" },
    { payload: { code: "GITHUB_IDENTITY_REQUIRED" } },
    { payload: { error: { code: "GITHUB_IDENTITY_REQUIRED" } } },
  ])("links the current account on structured missing-GitHub-identity errors (%j)", async (details) => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockRejectedValueOnce(
      Object.assign(new Error("A GitHub identity is required."), { status: 401, ...details })
    );
    noruloApi.auth.getGitHubAuthorizeUrl.mockRejectedValueOnce(new Error("link-started"));
    const controller = new AbortController();

    await expect(connectGitHubRepositories({ signal: controller.signal })).rejects.toThrow("link-started");

    const call = noruloApi.auth.getGitHubAuthorizeUrl.mock.calls[0];
    expect(call[0].intent).toBe("link");
    expect(redirectPath(call)).toBe("/projects");
    expect(redirectParam(call, "repoAuth")).toBe("1");
    expect(call[1]).toEqual({ signal: controller.signal });
    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("does not turn unrelated authorization failures into account linking", async () => {
    const failure = Object.assign(new Error("Please sign in."), {
      status: 401, code: "AUTH_REQUIRED",
    });
    noruloApi.integrations.getGitHubAuthorizeUrl.mockRejectedValueOnce(failure);

    await expect(connectGitHubRepositories()).rejects.toBe(failure);

    expect(noruloApi.auth.getGitHubAuthorizeUrl).not.toHaveBeenCalled();
    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("rejects unsafe GitHub login URLs before navigating", async () => {
    noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "javascript:alert(1)",
    });

    await expect(startGitHubLogin()).rejects.toThrow(/safe GitHub authorize URL/i);
  });

  it("rejects non-trusted GitHub login authorize hosts before navigating", async () => {
    noruloApi.auth.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "https://evil.example/phish",
    });

    await expect(startGitHubLogin()).rejects.toThrow(/safe GitHub authorize URL/i);
  });

  it("rejects unsafe repository authorization URLs before opening a popup", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "javascript:alert(1)",
      mode: "github-app-install",
    });

    await expect(connectGitHubRepositories()).rejects.toThrow(
      /safe GitHub repository authorization URL/i
    );

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("rejects repository authorization URLs with control characters before opening a popup", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "https://github.com/apps/norulo/installations/new\r\nX-Injected: bad",
      mode: "github-app-install",
    });

    await expect(connectGitHubRepositories()).rejects.toThrow(
      /safe GitHub repository authorization URL/i
    );

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("rejects non-trusted repository authorization hosts before opening a popup", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "https://evil.example/phish",
      mode: "github-app-install",
    });

    await expect(connectGitHubRepositories()).rejects.toThrow(
      /safe GitHub repository authorization URL/i
    );

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("does not open the GitHub install popup when an existing app installation is connected", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      connected: true,
      mode: "github-app-existing",
    });
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "octocat/private-repo", installationId: "999" }],
    });

    await expect(connectGitHubRepositories()).resolves.toBeUndefined();

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
    expect(noruloApi.repositories.sync).toHaveBeenCalledTimes(1);
  });

  it("opens the controlled manage popup and syncs repositories when managing connected app installations", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      connected: true,
      mode: "github-installation-manage",
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
      installationId: "999",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "octocat/private-repo", installationId: "999" }],
    });

    await expect(connectGitHubRepositories({ manage: true })).resolves.toBeUndefined();

    expect(noruloApi.integrations.getGitHubAuthorizeUrl).toHaveBeenCalledWith(
      expect.objectContaining({ manage: "1" }),
      expect.anything()
    );
    expect(openGitHubInstallPopup).toHaveBeenCalledWith(
      "https://api.norulo.com/integrations/github/manage/start?state=abc",
      { installationId: "999", githubIdentityId: undefined, requireCloseSyncReady: true },
      expect.objectContaining({ scope: captureGitHubRefreshScope(), signal: undefined, nonce: expect.stringMatching(/^[0-9a-f]{32}$/) })
    );
    expect(noruloApi.repositories.sync).toHaveBeenCalledTimes(1);
  });

  it("rejects a completed connect-manage popup when fresh access belongs to another installation", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      mode: "github-installation-manage",
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
      installationId: 999,
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "alice/other", installationId: "111" }],
    });

    await expect(connectGitHubRepositories({ manage: true })).rejects.toMatchObject({
      code: "no_authorized_repositories",
    });
    expect(noruloApi.repositories.sync).toHaveBeenCalledWith(
      { installationId: "999", githubIdentityId: undefined },
      { scope: captureGitHubRefreshScope(), signal: undefined }
    );
    expect(noruloApi.repositories.sync).toHaveBeenCalledTimes(1);
    expect(clearGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it("creates a manage session for a specific installation and syncs only that installation", async () => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      mode: "github-installation-manage",
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
      installationId: "999",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "octocat/private-repo", installationId: "999" }],
    });

    await expect(
      manageGitHubInstallation("999", { githubIdentityId: "ghi_1" })
    ).resolves.toBeUndefined();

    expect(noruloApi.integrations.createGitHubInstallationManageSession).toHaveBeenCalledWith(
      "999",
      expect.objectContaining({ githubIdentityId: "ghi_1" })
    );
    expect(openGitHubInstallPopup).toHaveBeenCalledWith(
      "https://api.norulo.com/integrations/github/manage/start?state=abc",
      { installationId: "999", githubIdentityId: "ghi_1", requireCloseSyncReady: true },
      expect.objectContaining({ scope: captureGitHubRefreshScope(), signal: undefined, nonce: expect.stringMatching(/^[0-9a-f]{32}$/) })
    );
    expect(noruloApi.repositories.sync).toHaveBeenCalledWith(
      { installationId: "999", githubIdentityId: "ghi_1" },
      { scope: captureGitHubRefreshScope(), signal: undefined }
    );
  });

  it("does not arm automatic repository refresh while a manage popup can still be cancelled", async () => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      mode: "github-installation-manage",
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
      installationId: "999",
    });
    let finishPopup;
    openGitHubInstallPopup.mockReturnValueOnce(
      new Promise((resolve) => {
        finishPopup = resolve;
      })
    );
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "octocat/private-repo", installationId: "999" }],
    });

    const completion = manageGitHubInstallation("999", { githubIdentityId: "ghi_1" });
    await Promise.resolve();
    await Promise.resolve();

    expect(openGitHubInstallPopup).toHaveBeenCalledTimes(1);
    expect(markGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();

    finishPopup();
    await completion;

    expect(markGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it.each(["connect", "manage"])("passes a neutral %s close outcome to the caller without a second sync", async (mode) => {
    const repositories = { githubAccess: "authorized", needsAuthorization: false,
      items: [{ fullName: "old/repository", installationId: "999" }] };
    const outcome = { status: "closed_unverified", repositories };
    openGitHubInstallPopup.mockResolvedValueOnce(outcome);
    let completion;
    if (mode === "manage") {
      noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
        url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
      });
      completion = manageGitHubInstallation("999");
    } else {
      noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
        url: "https://github.com/apps/norulo/installations/new",
      });
      completion = connectGitHubRepositories();
    }
    await expect(completion).resolves.toBe(outcome);
    expect(noruloApi.repositories.sync).not.toHaveBeenCalled();
    const options = openGitHubInstallPopup.mock.calls[0][2];
    const returnUrl = mode === "manage"
      ? noruloApi.integrations.createGitHubInstallationManageSession.mock.calls[0][1].returnUrl
      : noruloApi.integrations.getGitHubAuthorizeUrl.mock.calls[0][0].redirectTo;
    expect(new URL(returnUrl).searchParams.get("github_popup_nonce")).toBe(options.nonce);
    expect(options.nonce).toMatch(/^[0-9a-f]{32}$/);
  });

  it.each(["lost", "other-installation", "provider-unavailable"])("does not confirm a managed callback when fresh access is %s", async (state) => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    const providerFailure = Object.assign(new Error("GitHub provider unavailable"), { code: "GITHUB_UNAVAILABLE" });
    noruloApi.repositories.sync.mockResolvedValueOnce(state === "lost"
      ? { githubAccess: "lost", needsAuthorization: true, items: [] }
      : { githubAccess: "authorized", needsAuthorization: false,
          items: [{ installationId: "other", fullName: "other/repository" }],
          ...(state === "provider-unavailable" ? { githubRefreshError: providerFailure } : {}) });
    await expect(manageGitHubInstallation("999")).rejects.toMatchObject({
      code: state === "provider-unavailable" ? "GITHUB_UNAVAILABLE" : "no_authorized_repositories",
    });
    expect(noruloApi.repositories.sync).toHaveBeenCalledTimes(1);
    expect(clearGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it("maps manage account mismatch errors to a readable message", async () => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
    });
    openGitHubInstallPopup.mockRejectedValueOnce(
      Object.assign(new Error("github_account_mismatch"), {
        code: "github_account_mismatch",
      })
    );

    await expect(manageGitHubInstallation("999")).rejects.toThrow(/account mismatch/i);
  });

  it("rejects non-trusted GitHub installation manage hosts before opening a popup", async () => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      url: "https://evil.example/manage",
    });

    await expect(manageGitHubInstallation("999")).rejects.toThrow(
      /safe GitHub installation manage URL/i
    );

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("opens the controlled GitHub install identity flow when adding another account or organization", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      mode: "github-app-add",
      url: "https://api.norulo.com/integrations/github/install/start?state=abc",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: false,
      githubAccess: "authorized",
      items: [{ fullName: "acme/service" }],
    });

    await expect(connectGitHubRepositories({ add: true })).resolves.toBeUndefined();

    expect(noruloApi.integrations.getGitHubAuthorizeUrl).toHaveBeenCalledWith(
      expect.objectContaining({ add: "1", manage: undefined }),
      expect.anything()
    );
    expect(openGitHubInstallPopup).toHaveBeenCalledWith(
      "https://api.norulo.com/integrations/github/install/start?state=abc",
      undefined,
      expect.objectContaining({ scope: captureGitHubRefreshScope(), signal: undefined, nonce: expect.stringMatching(/^[0-9a-f]{32}$/) })
    );
  });

  it("does not treat connected responses as successful until repositories are actually available", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      connected: true,
      mode: "github-app-existing",
    });
    noruloApi.repositories.sync.mockResolvedValueOnce({
      needsAuthorization: true,
      githubAccess: "not_connected",
      items: [],
      repositories: [],
    });

    await expect(connectGitHubRepositories()).rejects.toMatchObject({
      code: "no_authorized_repositories",
    });

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
  });

  it("keeps repository refresh armed when post-popup verification fails", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      mode: "github-app-install",
      url: "https://github.com/apps/norulo/installations/new",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockRejectedValueOnce(new Error("sync temporarily unavailable"));

    await expect(connectGitHubRepositories()).rejects.toThrow("sync temporarily unavailable");

    expect(markGitHubRepositoryAccessRefreshNeeded).toHaveBeenCalled();
    expect(clearGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it("arms repository refresh when a completed manage popup cannot sync", async () => {
    noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({
      url: "https://api.norulo.com/integrations/github/manage/start?state=abc",
    });
    openGitHubInstallPopup.mockResolvedValueOnce(undefined);
    noruloApi.repositories.sync.mockRejectedValueOnce(new Error("sync temporarily unavailable"));

    await expect(manageGitHubInstallation("999")).rejects.toThrow("sync temporarily unavailable");

    expect(markGitHubRepositoryAccessRefreshNeeded).toHaveBeenCalledTimes(1);
    expect(clearGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it.each(["connect", "manage"])(
    "does not sync or alter the new account's refresh flag after an old %s popup completes",
    async (kind) => {
      const url = "https://api.norulo.com/integrations/github/install/start?state=abc";
      noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({ url });
      noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({ url });
      let completePopup;
      openGitHubInstallPopup.mockReturnValueOnce(new Promise((resolve) => { completePopup = resolve; }));
      const controller = new AbortController();
      const scope = captureGitHubRefreshScope();
      const completion = kind === "connect"
        ? connectGitHubRepositories({ signal: controller.signal })
        : manageGitHubInstallation("999", { signal: controller.signal });
      const aborted = expect(completion).rejects.toMatchObject({ name: "AbortError" });
      await vi.waitFor(() => expect(openGitHubInstallPopup).toHaveBeenCalledTimes(1));
      expect(openGitHubInstallPopup.mock.calls[0][2]).toEqual({ scope, signal: controller.signal, nonce: expect.stringMatching(/^[0-9a-f]{32}$/) });
      markGitHubRepositoryAccessRefreshNeeded.mockClear();
      clearGitHubRepositoryAccessRefreshNeeded.mockClear();

      setGitHubRefreshIdentity("usr_two");
      const newScope = captureGitHubRefreshScope();
      completePopup();
      await aborted;

      // Sync is the only entry to renewal here; abandoning it prevents either request.
      expect(noruloApi.repositories.sync).not.toHaveBeenCalled();
      expect(markGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
      expect(clearGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
      expect(newScope.controller.signal.aborted).toBe(false);
    }
  );

  it.each(["connect", "manage"])(
    "preserves the initiating account scope and caller signal for a successful %s popup",
    async (kind) => {
      const url = "https://api.norulo.com/integrations/github/install/start?state=abc";
      noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({ url });
      noruloApi.integrations.createGitHubInstallationManageSession.mockResolvedValueOnce({ url });
      openGitHubInstallPopup.mockResolvedValueOnce(undefined);
      noruloApi.repositories.sync.mockResolvedValueOnce({
        needsAuthorization: false,
        githubAccess: "authorized",
        items: [{ id: "repo_1", installationId: "999" }],
      });
      const scope = captureGitHubRefreshScope();
      const controller = new AbortController();

      if (kind === "connect") await connectGitHubRepositories({ signal: controller.signal });
      else await manageGitHubInstallation("999", { signal: controller.signal });

      expect(noruloApi.repositories.sync).toHaveBeenCalledTimes(1);
      expect(noruloApi.repositories.sync.mock.calls[0][1]).toEqual({ scope, signal: controller.signal });
      expect(clearGitHubRepositoryAccessRefreshNeeded).toHaveBeenCalledTimes(1);
    }
  );

  it("discards an authorization URL that arrives after its account changed", async () => {
    let receiveUrl;
    noruloApi.integrations.getGitHubAuthorizeUrl.mockReturnValueOnce(new Promise((resolve) => {
      receiveUrl = resolve;
    }));
    const completion = connectGitHubRepositories();
    const aborted = expect(completion).rejects.toMatchObject({ name: "AbortError" });

    setGitHubRefreshIdentity("usr_two");
    receiveUrl({ url: "https://github.com/apps/norulo/installations/new" });
    await aborted;

    expect(openGitHubInstallPopup).not.toHaveBeenCalled();
    expect(noruloApi.repositories.sync).not.toHaveBeenCalled();
    expect(markGitHubRepositoryAccessRefreshNeeded).not.toHaveBeenCalled();
  });

  it("preserves caller cancellation while waiting for a repository popup", async () => {
    noruloApi.integrations.getGitHubAuthorizeUrl.mockResolvedValueOnce({
      url: "https://github.com/apps/norulo/installations/new",
    });
    let completePopup;
    openGitHubInstallPopup.mockReturnValueOnce(new Promise((resolve) => { completePopup = resolve; }));
    const controller = new AbortController();
    const completion = connectGitHubRepositories({ signal: controller.signal });
    const aborted = expect(completion).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(openGitHubInstallPopup).toHaveBeenCalledTimes(1));

    controller.abort();
    completePopup();
    await aborted;

    expect(noruloApi.repositories.sync).not.toHaveBeenCalled();
    expect(clearGitHubRepositoryAccessRefreshNeeded).toHaveBeenCalledTimes(1);
  });
});
