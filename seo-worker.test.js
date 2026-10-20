// @vitest-environment node
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./worker-entry.js";
import { PUBLIC_PAGE_ASSETS, PUBLIC_PRICING_MARKER } from "./public-pages.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("SEO Worker shell", () => {
  it.each(Object.entries(PUBLIC_PAGE_ASSETS))("serves the generated public asset for %s", async (path, asset) => {
    const assets = { fetch: vi.fn(async (request) => {
      expect(new URL(request.url).pathname).toBe(asset);
      expect(request.headers.get("If-None-Match")).toBeNull();
      expect(request.headers.get("Range")).toBeNull();
      return new Response('<html><head></head><body><main>Public document</main></body></html>', {
        headers: { "Content-Type": "text/html", ETag: '"source-only"' },
      });
    }) };
    const server = { fetch: vi.fn() };
    const response = await worker.fetch(new Request(`https://norulo.com${path}`, {
      headers: { "If-None-Match": '"source-only"', Range: "bytes=0-99" },
    }), { ASSETS: assets, NORULO_SERVER: server });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Public document");
    expect(response.headers.get("ETag")).toBeNull();
    expect(server.fetch).not.toHaveBeenCalled();
  });

  it("reads pricing anonymously even when the browser sends account credentials", async () => {
    const server = { fetch: vi.fn(async (request) => {
      expect(request.headers.get("Cookie")).toBeNull();
      expect(request.headers.get("Authorization")).toBeNull();
      expect(request.headers.get("X-Norulo-Workspace")).toBeNull();
      return Response.json({ plans: [] });
    }) };
    const response = await worker.fetch(new Request("https://norulo.com/pricing?workspaceId=private", {
      headers: { Cookie: "session=private", Authorization: "Bearer private", "X-Norulo-Workspace": "private" },
    }), {
      NORULO_API_ORIGIN: "https://api.norulo.com", NORULO_SERVER: server,
      ASSETS: { fetch: async () => new Response(`<html><head></head><body>${PUBLIC_PRICING_MARKER}</body></html>`, {
        headers: { "Content-Type": "text/html" },
      }) },
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toContain("Pricing temporarily unavailable");
    expect(server.fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps protected navigation on the original empty SPA shell without pricing calls", async () => {
    const assets = { fetch: vi.fn(async (request) => {
      expect(request.url).toBe("https://norulo.com/projects/p1");
      return new Response('<html><head></head><body><div id="root"></div></body></html>', {
        headers: { "Content-Type": "text/html" },
      });
    }) };
    const server = { fetch: vi.fn() };
    const response = await worker.fetch(new Request("https://norulo.com/projects/p1"), {
      ASSETS: assets, NORULO_SERVER: server,
    });
    const html = await response.text();
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('content="noindex,nofollow"');
    expect(server.fetch).not.toHaveBeenCalled();
  });

  it("keeps public HEAD bodyless without loading pricing or returning source validators", async () => {
    const server = { fetch: vi.fn() };
    const response = await worker.fetch(new Request("https://norulo.com/pricing", { method: "HEAD" }), {
      NORULO_SERVER: server,
      ASSETS: { fetch: async () => new Response(null, {
        headers: { "Content-Type": "text/html", "Content-Length": "1234", ETag: '"source"' },
      }) },
    });
    expect(await response.text()).toBe("");
    expect(response.headers.get("Content-Length")).toBeNull();
    expect(response.headers.get("ETag")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(server.fetch).not.toHaveBeenCalled();
  });
  it.each([
    [
      "http://preview.norulo.com/signin?redirectTo=%2Fprojects",
      "GET",
      "https://preview.norulo.com/signin?redirectTo=%2Fprojects",
    ],
    ["http://preview.norulo.com/projects", "HEAD", "https://preview.norulo.com/projects"],
    ["http://norulo.com/signin", "GET", "https://norulo.com/signin"],
    [
      "http://www.norulo.com/pricing?ref=launch",
      "GET",
      "https://norulo.com/pricing?ref=launch",
    ],
    [
      "http://preview.norulo.com:8080//other.example/signin?redirectTo=https%3A%2F%2Fother.example",
      "GET",
      "https://preview.norulo.com//other.example/signin?redirectTo=https%3A%2F%2Fother.example",
    ],
  ])(
    "upgrades a deployed HTTP navigation before serving the page: %s",
    async (source, method, target) => {
      const assets = { fetch: vi.fn() };
      const service = { fetch: vi.fn() };
      const network = vi.fn();
      globalThis.fetch = network;

      const response = await worker.fetch(new Request(source, { method }), {
        NORULO_MODE: "preview",
        ASSETS: assets,
        NORULO_SERVER: service,
      });

      expect(response.status).toBe(308);
      expect(response.headers.get("Location")).toBe(target);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(response.headers.get("Strict-Transport-Security")).toBeNull();
      expect(assets.fetch).not.toHaveBeenCalled();
      expect(service.fetch).not.toHaveBeenCalled();
      expect(network).not.toHaveBeenCalled();
    }
  );

  it.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "does not redirect or dispatch an insecure %s authentication request",
    async (method) => {
      const assets = { fetch: vi.fn() };
      const service = { fetch: vi.fn() };
      const network = vi.fn();
      globalThis.fetch = network;
      const response = await worker.fetch(
        new Request("http://preview.norulo.com/api/auth/email/request-code", {
          method,
          headers: { Origin: "http://preview.norulo.com" },
          body: JSON.stringify({ email: "member@example.com", purpose: "login" }),
        }),
        { ASSETS: assets, NORULO_SERVER: service }
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: { code: "HTTPS_REQUIRED" } });
      expect(response.headers.get("Location")).toBeNull();
      expect(response.headers.get("Strict-Transport-Security")).toBeNull();
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(assets.fetch).not.toHaveBeenCalled();
      expect(service.fetch).not.toHaveBeenCalled();
      expect(network).not.toHaveBeenCalled();
    }
  );

  it("keeps trusted HTTPS email requests intact over the service binding", async () => {
    const service = {
      fetch: vi.fn(async (request) => {
        expect(request.url).toBe("https://preview-api.norulo.com/auth/email/request-code");
        expect(request.method).toBe("POST");
        expect(request.headers.get("Origin")).toBe("https://preview.norulo.com");
        expect(request.headers.get("Referer")).toBe("https://preview.norulo.com/signin");
        expect(await request.json()).toEqual({ email: "member@example.com", purpose: "login" });
        return Response.json({ challengeId: "local-only", expiresIn: 600 }, { status: 202 });
      }),
    };
    const response = await worker.fetch(
      new Request("https://preview.norulo.com/api/auth/email/request-code", {
        method: "POST",
        headers: {
          Origin: "https://preview.norulo.com",
          Referer: "https://preview.norulo.com/signin",
        },
        body: JSON.stringify({ email: "member@example.com", purpose: "login" }),
      }),
      { NORULO_API_ORIGIN: "https://preview-api.norulo.com", NORULO_SERVER: service }
    );

    expect(response.status).toBe(202);
    expect(service.fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["http://127.0.0.1:4248/", "http://localhost:4248/", "http://unrelated.example/"])(
    "preserves HTTP development and unrelated hosts: %s",
    async (source) => {
      const assets = { fetch: vi.fn(async () => new Response("local asset")) };
      const response = await worker.fetch(new Request(source), { ASSETS: assets });
      expect(response.status).toBe(200);
      expect(response.headers.get("Location")).toBeNull();
      expect(assets.fetch).toHaveBeenCalledTimes(1);
    }
  );

  it("keeps preview pages out of indexing", async () => {
    const response = await worker.fetch(new Request("https://preview.norulo.com/pricing"), {
      NORULO_MODE: "preview",
      ASSETS: {
        fetch: async () =>
          new Response("<html><head></head><body></body></html>", {
            headers: { "Content-Type": "text/html" },
          }),
      },
    });
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
  it("redirects the www hostname to the canonical apex domain", async () => {
    const assets = { fetch: vi.fn() };

    const response = await worker.fetch(
      new Request("https://www.norulo.com/pricing?ref=launch"),
      { ASSETS: assets }
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://norulo.com/pricing?ref=launch");
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=15552000");
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it("injects route-specific metadata into the HTML shell", async () => {
    const assets = {
      fetch: vi.fn(
        async () =>
          new Response(
            '<!doctype html><html><head><title data-seo-managed="true">Old</title></head><body></body></html>',
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
      ),
    };

    const response = await worker.fetch(new Request("https://norulo.com/pricing"), {
      ASSETS: assets,
    });
    const html = await response.text();

    expect(html).toContain("Norulo Pricing — Project Expense Ledger");
    expect(html).toContain('<link rel="canonical" href="https://norulo.com/pricing"');
    expect(html).toContain('<meta name="robots" content="index,follow"');
  });

  it("injects noindex metadata for private app routes", async () => {
    const assets = {
      fetch: vi.fn(
        async () =>
          new Response(
            '<!doctype html><html><head><title data-seo-managed="true">Old</title></head><body></body></html>',
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
      ),
    };

    const response = await worker.fetch(new Request("https://norulo.com/dashboard/overview"), {
      ASSETS: assets,
    });

    expect(await response.text()).toContain('<meta name="robots" content="noindex,nofollow"');
  });

  it("allows only the generated structured data hash beside the fixed bootstrap", async () => {
    const untrustedScript = "window.untrusted = true;";
    const response = await worker.fetch(new Request("https://norulo.com/pricing"), {
      ASSETS: {
        fetch: async () =>
          new Response(
            `<html><head><script>${untrustedScript}</script></head><body></body></html>`,
            { headers: { "Content-Type": "text/html", "Content-Length": "100" } }
          ),
      },
    });
    const html = await response.text();
    const schema = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1];
    const hash = (source) => `sha256-${createHash("sha256").update(source).digest("base64")}`;
    const policy = response.headers.get("Content-Security-Policy");
    expect(policy).toContain(`'${hash(schema)}'`);
    expect(policy).not.toContain(hash(untrustedScript));
    expect(policy.match(/(?:^|; )script-src ([^;]+)/)[1]).not.toContain("'unsafe-inline'");
    expect(response.headers.get("Content-Length")).toBeNull();
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("does not apply shell SEO or CSP to a Server OAuth HTML response", async () => {
    const html =
      '<html><head></head><body><script nonce="provider">window.close()</script></body></html>';
    const response = await worker.fetch(
      new Request("https://norulo.com/api/auth/github/callback?code=local"),
      {
        NORULO_API_ORIGIN: "https://api.norulo.com",
        NORULO_SERVER: {
          fetch: async () =>
            new Response(html, {
              headers: {
                "Content-Type": "text/html",
                "Content-Security-Policy": "script-src 'nonce-provider'",
                "Set-Cookie": "nr_session=opaque; HttpOnly; Secure; SameSite=None",
              },
            }),
        },
      }
    );
    expect(await response.text()).toBe(html);
    expect(response.headers.get("Content-Security-Policy")).toBe("script-src 'nonce-provider'");
    expect(response.headers.get("Set-Cookie")).toContain("SameSite=None");
  });

  it.each([
    "https://github.com/login/oauth/authorize",
    "https://checkout.creem.io/checkout/local",
    "https://test-checkout.creem.io/checkout/local",
  ])("preserves trusted top-level provider redirects: %s", async (location) => {
    const response = await worker.fetch(new Request("https://norulo.com/api/provider/start"), {
      NORULO_API_ORIGIN: "https://api.norulo.com",
      NORULO_SERVER: {
        fetch: async () => new Response(null, { status: 302, headers: { Location: location } }),
      },
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(location);
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
  });
});
