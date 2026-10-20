// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { publicPricingHtml, renderPublicPricing } from "./public-pricing.js";

function catalog() {
  return {
    enabled: true,
    account: { email: "private@example.com", plan: "max" },
    ledgerUsage: { secret: "private-ledger-count" },
    plans: ["free", "pro", "max"].map((id, index) => ({
      id, name: id === "free" ? "Free" : `Norulo ${id}`,
      prices: {
        month: { amount: ["0", "4.99", "12.99"][index], currency: "USD", configured: true },
        year: { amount: ["0", "49.99", "129.99"][index], currency: "USD", configured: true },
      },
      entitlements: {
        limits: { projects: [3, 20, 100][index], expenseRecords: [300, 20000, 200000][index] },
        jev: { eligible: true, trialCalls: index ? 0 : 20, monthlyCalls: [0, 1000, 4000][index],
          period: index ? "utc-calendar-month" : "lifetime" },
      },
    })),
  };
}

describe("anonymous public pricing document", () => {
  it("renders current exact prices, both intervals and Server entitlements without account data", () => {
    const html = renderPublicPricing(catalog());
    for (const text of ["USD 4.99", "USD 49.99", "USD 12.99", "USD 129.99", "20,000", "200,000", "4,000", "one-time trial"]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("private@example.com");
    expect(html).not.toContain("private-ledger-count");
    expect(html).not.toContain("Current account plan");
  });

  it("escapes catalog text and never invents unavailable prices or capacities", () => {
    const payload = catalog();
    payload.enabled = false;
    payload.plans[1].name = '<script>alert("unsafe")</script>';
    payload.plans[1].prices.month.amount = null;
    payload.plans[1].entitlements.limits.projects = null;
    const html = renderPublicPricing(payload);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Price unavailable");
    expect(html).toContain("Projects: Unavailable");
    expect(html).toContain("Paid subscriptions are not open yet");
  });

  it.each([null, {}, { plans: [] }, { plans: [null, null, null] }])(
    "keeps missing or malformed catalogs explicitly unavailable: %s", (payload) => {
      const html = renderPublicPricing(payload);
      expect(html).toContain("Pricing temporarily unavailable");
      expect(html).not.toContain("USD 0");
    }
  );

  it("uses only the fixed credential-free Server binding read, never public fetch", async () => {
    const service = { fetch: vi.fn(async (request) => {
      expect(request.url).toBe("https://api.norulo.com/billing/plan");
      expect(request.method).toBe("GET");
      expect([...request.headers.keys()]).toEqual(["accept"]);
      expect(request.redirect).toBe("manual");
      return Response.json(catalog());
    }) };
    const html = await publicPricingHtml({ NORULO_SERVER: service, NORULO_API_ORIGIN: "https://api.norulo.com" });
    expect(service.fetch).toHaveBeenCalledTimes(1);
    expect(html).toContain("USD 4.99");
  });

  it.each([
    () => new Response(null, { status: 302, headers: { Location: "https://other.example" } }),
    () => Response.json(catalog(), { headers: { "Set-Cookie": "session=private" } }),
    () => new Response("x".repeat(65537), { headers: { "Content-Type": "application/json" } }),
    () => new Response("not json", { headers: { "Content-Type": "application/json" } }),
    () => { throw new Error("unavailable"); },
  ])("fails closed without retries for redirects, cookies, oversized or failed responses", async (reply) => {
    const service = { fetch: vi.fn(reply) };
    const html = await publicPricingHtml({ NORULO_SERVER: service, NORULO_API_ORIGIN: "https://api.norulo.com" });
    expect(html).toContain("Pricing temporarily unavailable");
    expect(service.fetch).toHaveBeenCalledTimes(1);
  });

  it("bounds a stalled binding call and aborts it without retrying", async () => {
    vi.useFakeTimers();
    try {
      let signal;
      const service = { fetch: vi.fn((request) => {
        signal = request.signal;
        return new Promise(() => {});
      }) };
      const pending = publicPricingHtml({ NORULO_SERVER: service, NORULO_API_ORIGIN: "https://api.norulo.com" });
      await vi.advanceTimersByTimeAsync(2500);
      expect(await pending).toContain("Pricing temporarily unavailable");
      expect(signal.aborted).toBe(true);
      expect(service.fetch).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });

  it("does not dispatch to a user-controlled origin", async () => {
    const service = { fetch: vi.fn() };
    expect(await publicPricingHtml({ NORULO_SERVER: service, NORULO_API_ORIGIN: "https://other.example" }))
      .toContain("Pricing temporarily unavailable");
    expect(service.fetch).not.toHaveBeenCalled();
  });
});
