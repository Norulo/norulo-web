import { describe, expect, it, vi } from "vitest";
import {
  createMobileLayoutFixture,
  MOBILE_ACCOUNT_NAME,
  MOBILE_NORMAL_EMAIL,
  MOBILE_VERIFIED_EMAIL,
} from "./mobile-layout-fixtures.mjs";

const baseURL = "http://127.0.0.1:4248";
function requestRoute(path, { method = "GET", origin = baseURL } = {}) {
  return {
    request: () => ({
      url: () => `${origin}${path}`,
      method: () => method,
      resourceType: () => "fetch",
      headers: () => ({}),
    }),
    fulfill: vi.fn(),
    abort: vi.fn(),
    continue: vi.fn(),
  };
}

describe("bounded account onboarding layout fixtures", () => {
  it("serves an email-only identity and empty Projects without forwarding requests", async () => {
    const fixture = createMobileLayoutFixture({ baseURL, accountOnboarding: true });
    const session = requestRoute("/api/auth/session");
    const projects = requestRoute("/api/api/v1/projects?limit=30");
    const integrations = requestRoute("/api/integrations");
    for (const route of [session, projects, integrations]) {
      await fixture.handle(route);
      expect(route.continue).not.toHaveBeenCalled();
      expect(route.abort).not.toHaveBeenCalled();
    }
    expect(JSON.parse(session.fulfill.mock.calls[0][0].body).user).toMatchObject({
      name: MOBILE_ACCOUNT_NAME,
      email: MOBILE_VERIFIED_EMAIL,
      emailVerified: true,
      providers: ["email"],
    });
    expect(JSON.parse(projects.fulfill.mock.calls[0][0].body).items).toEqual([]);
    expect(JSON.parse(integrations.fulfill.mock.calls[0][0].body).github.connected).toBe(false);
    expect(fixture.assertClean()).toMatchObject({ total: 3, api: 3, writes: 0, externalDelivered: 0 });
  });

  it("also exercises a normal-length verified email", async () => {
    const fixture = createMobileLayoutFixture({ baseURL, accountOnboarding: true, accountIdentity: "normal" });
    const route = requestRoute("/api/auth/session");
    await fixture.handle(route);
    expect(JSON.parse(route.fulfill.mock.calls[0][0].body).user.email).toBe(MOBILE_NORMAL_EMAIL);
    fixture.assertClean();
  });

  it("keeps the existing multi-screen Projects fixture populated by default", async () => {
    const fixture = createMobileLayoutFixture({ baseURL });
    const route = requestRoute("/api/api/v1/projects?limit=30");
    await fixture.handle(route);
    expect(JSON.parse(route.fulfill.mock.calls[0][0].body).items.length).toBeGreaterThan(0);
    fixture.assertClean();
  });

  it.each([
    ["a production read", "/api/api/v1/projects", { origin: "https://norulo.com" }],
    ["a local business write", "/api/api/v1/projects", { method: "POST" }],
    ["an unbounded Projects cursor", "/api/api/v1/projects?cursor=next", {}],
    ["duplicate Projects limits", "/api/api/v1/projects?limit=30&limit=100", {}],
  ])("blocks %s instead of delivering or forwarding it", async (_label, path, options) => {
    const fixture = createMobileLayoutFixture({ baseURL, accountOnboarding: true });
    const route = requestRoute(path, options);
    await fixture.handle(route);
    expect(route.abort).toHaveBeenCalledWith("blockedbyclient");
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(route.continue).not.toHaveBeenCalled();
    expect(() => fixture.assertClean()).toThrow();
  });
});
