import { jevAllowance } from "./src/lib/jev-allowance.js";

const MAX_CATALOG_BYTES = 64 * 1024;
const PLAN_IDS = ["free", "pro", "max"];

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function priceText(price) {
  const amount = String(price?.amount ?? "");
  if (!/^\d{1,9}(?:\.\d{1,4})?$/.test(amount) || !/^[A-Z]{3}$/.test(price?.currency || "")) {
    return "Price unavailable";
  }
  return `${price.currency} ${amount}`;
}

function positiveLimit(value) {
  return Number.isSafeInteger(value) && value > 0 ? value.toLocaleString("en-US") : "Unavailable";
}

export function renderPublicPricing(catalog) {
  const plans = catalog?.plans;
  if (!Array.isArray(plans) || plans.length !== PLAN_IDS.length ||
      !PLAN_IDS.every((id) => plans.filter((plan) => plan?.id === id).length === 1)) {
    return '<section class="pricing-tiers"><div class="pricing-card"><h2>Pricing temporarily unavailable</h2><p>Current prices could not be verified. Please reload this page or contact <a href="/support">support</a>.</p></div></section>';
  }
  const cards = PLAN_IDS.map((id) => {
    const plan = plans.find((entry) => entry.id === id);
    const limits = plan.entitlements?.limits;
    const jev = plan.entitlements?.jev;
    const allowance = jev?.eligible === true ? jevAllowance(jev) : null;
    const monthly = priceText(plan.prices?.month);
    const yearly = priceText(plan.prices?.year);
    const available = id === "free" || (catalog.enabled === true &&
      ["month", "year"].some((interval) => plan.prices?.[interval]?.configured === true &&
        priceText(plan.prices[interval]) !== "Price unavailable"));
    return `<article class="pricing-card"><div class="pricing-card-h"><h2>${escapeHtml(plan.name || id)}</h2></div>
      <dl><dt>Monthly</dt><dd>${escapeHtml(monthly)} / month</dd>
      ${id === "free" ? "" : `<dt>Yearly</dt><dd>${escapeHtml(yearly)} / year</dd>`}</dl>
      <ul class="pricing-feats"><li>Projects: ${positiveLimit(limits?.projects)}</li>
      <li>Expense records: ${positiveLimit(limits?.expenseRecords)}</li>
      ${allowance ? `<li>Jev assistance: ${allowance.calls.toLocaleString("en-US")} calls · ${allowance.period === "lifetime" ? "one-time trial, no reset" : "per UTC month, no rollover"}</li>` : ""}
      <li>Project and shared expense ledger</li><li>Per-currency reports and REST API</li></ul>
      <p>${available ? (id === "free" ? "Free is available." : "Subscription available.") : "Paid subscriptions are not open yet."}</p>
      <a class="btn" href="/login">${id === "free" ? "Start free" : "Sign in"}</a></article>`;
  });
  return `<section class="pricing-tiers" aria-label="Current public plans">${cards.join("")}</section>
    <div class="pricing-faq pricing-policy"><p>Platform charges stay separate from ledger expenses.</p>
    <p>Annual subscriptions keep the same monthly Jev calls, without rollover.</p></div>`;
}

async function readCatalog(response) {
  if (response.status !== 200 || !(response.headers.get("Content-Type") || "").includes("application/json") ||
      response.headers.has("Set-Cookie")) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_CATALOG_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function publicPricingHtml(env) {
  let catalog = null;
  if (env.NORULO_SERVER?.fetch &&
      ["https://api.norulo.com", "https://preview-api.norulo.com"].includes(env.NORULO_API_ORIGIN)) {
    const controller = new AbortController();
    let timer;
    try {
      // Fixed anonymous public endpoint. Never forward cookies, credentials,
      // workspace selectors or user-controlled URLs, and never retry a failure.
      const request = new Request(`${env.NORULO_API_ORIGIN}/billing/plan`, {
        headers: { Accept: "application/json" },
        redirect: "manual",
        signal: controller.signal,
      });
      catalog = await Promise.race([
        env.NORULO_SERVER.fetch(request).then(async (response) => {
          if (controller.signal.aborted) { await response.body?.cancel(); return null; }
          return readCatalog(response);
        }),
        new Promise((resolve) => {
          timer = setTimeout(() => { controller.abort(); resolve(null); }, 2500);
        }),
      ]);
    } catch {
      // Keep the document usable; the normal browser UI retains its own fetch.
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
  return renderPublicPricing(catalog);
}
