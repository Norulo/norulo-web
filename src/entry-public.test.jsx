// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { renderPublicPage } from "./entry-public.jsx";
import { PUBLIC_PAGE_ASSETS, PUBLIC_PRICING_MARKER, publicPageAsset } from "../public-pages.js";

describe("build-time public documents", () => {
  it.each(Object.keys(PUBLIC_PAGE_ASSETS))("renders %s with real text and native links, without effects or API calls", (path) => {
    const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No build-time network"));
    try {
      const html = renderPublicPage(path);
      expect(html).toContain('<main id="main-content"');
      expect(html).toContain("<h1");
      expect(html).toContain('href="/pricing"');
      expect(html).toContain('href="/developers/docs"');
      expect(html).toContain('href="/plugins"');
      expect(html.length).toBeGreaterThan(1500);
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });

  it("includes the actual product, guide and MCP setup content", () => {
    expect(renderPublicPage("/")).toContain("Record project and shared costs");
    expect(renderPublicPage("/developers/docs")).toContain("Share a ledger");
    expect(renderPublicPage("/developers/api")).toContain("Idempotency-Key");
    expect(renderPublicPage("/plugins")).toContain("https://mcp.norulo.com/mcp");
    expect(renderPublicPage("/pricing")).toContain(PUBLIC_PRICING_MARKER);
  });

  it.each(["/login", "/oauth", "/projects", "/projects/p1", "/settings", "/billing", "/api-keys", "/api/billing/plan", "/status/traffic.json", "/__proto__", "/plugins/other"])(
    "does not pre-render protected or protocol routes: %s", (path) => {
      expect(publicPageAsset(path)).toBeNull();
      expect(() => renderPublicPage(path)).toThrow("Not a pre-renderable public page");
    }
  );
});
