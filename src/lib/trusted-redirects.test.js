import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  safeBillingRedirectUrl,
  safeGitHubAuthorizeUrl,
  safeGitHubInstallationUrl,
  safeHttpUrl,
} from "./trusted-redirects.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("safe HTTP URLs", () => {
  it("returns the parsed URL that passed validation", () => {
    expect(
      safeHttpUrl(" HTTPS://GITHUB.COM:443/a/../settings?q=hello world ", "URL")
    ).toBe("https://github.com/settings?q=hello%20world");
  });

  it.each([
    "https://user:password@github.com/settings/installations",
    "https://user@github.com/settings/installations",
    "\r\nhttps://github.com/settings/installations",
    "https://github.com/settings/installations\n",
    "https://github.com/settings/\tinstallations",
    "javascript:alert(1)",
    "//github.com/settings/installations",
  ])("rejects unsafe HTTP URL %s", (url) => {
    expect(() => safeHttpUrl(url, "URL")).toThrow(/safe URL/i);
  });
});

describe("trusted GitHub authorize redirects", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/dashboard/overview");
  });

  it("accepts GitHub OAuth authorize URLs", () => {
    const url = "https://github.com/login/oauth/authorize?client_id=norulo&state=abc";

    expect(safeGitHubAuthorizeUrl(url, "GitHub authorize URL")).toBe(url);
  });

  it("accepts trusted first-party GitHub authorize endpoints", () => {
    const url = `${window.location.origin}/api/auth/github/authorize?redirectTo=%2Fdashboard`;

    expect(safeGitHubAuthorizeUrl(url, "GitHub authorize URL")).toBe(url);
  });

  it("accepts loopback local-mock GitHub callback endpoints", () => {
    const url = `${window.location.origin}/auth/github/callback?redirectTo=%2Fdashboard`;

    expect(safeGitHubAuthorizeUrl(url, "GitHub authorize URL")).toBe(url);
  });

  it("rejects non-loopback first-party GitHub callback endpoints", () => {
    expect(() =>
      safeGitHubAuthorizeUrl(
        "https://api.norulo.com/auth/github/callback?redirectTo=%2Fdashboard",
        "GitHub authorize URL"
      )
    ).toThrow(/safe GitHub authorize URL/i);
  });

  it("accepts same-origin GitHub installation endpoints", () => {
    const url = `${window.location.origin}/api/integrations/github/install/start?state=abc`;

    expect(safeGitHubInstallationUrl(url, "GitHub installation URL")).toBe(url);
  });

  it("rejects non-authorize GitHub paths", () => {
    expect(() =>
      safeGitHubAuthorizeUrl("https://github.com/settings/profile", "GitHub authorize URL")
    ).toThrow(/safe GitHub authorize URL/i);
  });

  it("rejects non-trusted authorize hosts", () => {
    expect(() =>
      safeGitHubAuthorizeUrl("https://evil.example/phish", "GitHub authorize URL")
    ).toThrow(/safe GitHub authorize URL/i);
  });

  it.each([
    "https://user:password@github.com/login/oauth/authorize",
    "\nhttps://github.com/login/oauth/authorize",
  ])("rejects unsafe GitHub authorize redirect %s", (url) => {
    expect(() => safeGitHubAuthorizeUrl(url, "GitHub authorize URL")).toThrow(
      /safe GitHub authorize URL/i
    );
  });

  it.each([
    "https://user:password@github.com/settings/installations",
    "https://github.com/settings/installations\r\n",
  ])("rejects unsafe GitHub installation redirect %s", (url) => {
    expect(() => safeGitHubInstallationUrl(url, "GitHub installation URL")).toThrow(
      /safe GitHub installation URL/i
    );
  });
});

describe("trusted billing redirects", () => {
  it.each(["checkout.creem.io", "creem.io", "www.creem.io"])(
    "accepts the exact HTTPS provider host %s",
    (host) => {
      const url = `https://${host}/checkout/ch_1`;
      expect(safeBillingRedirectUrl(url, "billing checkout URL")).toBe(url);
    }
  );

  it.each(["development", "test"])(
    "allows the test provider only with explicit opt-in in %s mode",
    (mode) => {
      const url = "https://test-checkout.creem.io/ch_test";
      vi.stubEnv("MODE", mode);
      vi.stubEnv("VITE_CREEM_MODE", undefined);
      expect(() => safeBillingRedirectUrl(url, "billing checkout URL")).toThrow();
      vi.stubEnv("VITE_CREEM_MODE", "test");
      expect(safeBillingRedirectUrl(url, "billing checkout URL")).toBe(url);
    }
  );

  it.each([undefined, "test"])(
    "rejects the test provider in production with opt-in %s",
    (mode) => {
      vi.stubEnv("MODE", "production");
      vi.stubEnv("VITE_CREEM_MODE", mode);
      expect(() =>
        safeBillingRedirectUrl("https://test-checkout.creem.io/ch_test", "billing checkout URL")
      ).toThrow(/safe billing checkout URL/i);
    }
  );

  it.each([
    "https://checkout.creem.io.evil.example/ch_1",
    "https://user:password@checkout.creem.io/ch_1",
    "https://checkout.creem.io:444/ch_1",
    "https://norulo.com:444/billing",
    "https://creem.io/",
    "https://www.creem.io/login",
    "https://creem.io/checkout",
    "https://creem.io/checkout.evil/ch_1",
    "\r\nhttps://checkout.creem.io/ch_1",
    "https://checkout.creem.io/ch_1\n",
  ])("rejects unsafe redirect %s", (url) => {
    expect(() => safeBillingRedirectUrl(url, "billing checkout URL")).toThrow(
      /safe billing checkout URL/i
    );
  });

  it("allows same-origin returns while rejecting embedded credentials", () => {
    const url = `${window.location.origin}/billing?billing=success`;
    expect(safeBillingRedirectUrl(url, "billing return URL")).toBe(url);
    const credentials = new URL(url);
    credentials.username = "user";
    expect(() => safeBillingRedirectUrl(credentials.toString(), "billing return URL")).toThrow(
      /safe billing return URL/i
    );
  });
});
