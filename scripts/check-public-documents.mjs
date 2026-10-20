import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { chromium } from "playwright";
import worker from "../worker-entry.js";
import { PUBLIC_PAGE_ASSETS } from "../public-pages.js";

// Finite loopback validation of the actual Worker and built assets. All API
// responses are local fixtures; no production writes, accounts or providers.
const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
await mkdir(resolve(root, "work/public-browser"), { recursive: true });
const catalog = {
  enabled: true,
  plans: ["free", "pro", "max"].map((id, i) => ({
    id, name: ["Free", "Norulo Pro", "Norulo Max"][i],
    prices: {
      month: { amount: ["0", "4.99", "12.99"][i], currency: "USD", configured: true },
      year: { amount: ["0", "49.99", "129.99"][i], currency: "USD", configured: true },
    },
    entitlements: {
      limits: { projects: [3, 20, 100][i], expenseRecords: [300, 20000, 200000][i] },
      jev: { eligible: true, available: true, monthlyCalls: [0, 1000, 4000][i], trialCalls: i ? 0 : 20,
        period: i ? "utc-calendar-month" : "lifetime" },
    },
  })),
};
const calls = [];
const failures = [];
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const env = {
  NORULO_MODE: "local", NORULO_API_ORIGIN: "https://api.norulo.com",
  ASSETS: { async fetch(request) {
    const path = new URL(request.url).pathname;
    const file = resolve(dist, `.${path}`);
    assert.ok(file.startsWith(`${dist}/`));
    let body;
    let type = types[extname(path)] || "application/octet-stream";
    try { body = await readFile(file); }
    catch { body = await readFile(resolve(dist, "index.html")); type = "text/html"; }
    return new Response(request.method === "HEAD" ? null : body, { headers: { "Content-Type": type } });
  } },
  NORULO_SERVER: { async fetch(request) {
    const path = new URL(request.url).pathname;
    calls.push({ method: request.method, path });
    assert.equal(request.method, "GET", "No fixture mutation is permitted");
    if (path === "/auth/session") return Response.json({ authenticated: false });
    if (path === "/billing/plan") return Response.json(catalog);
    throw new Error(`Unexpected local API request: ${path}`);
  } },
};
const server = createServer(async (request, response) => {
  try {
    const result = await worker.fetch(new Request(`${base}${request.url}`, {
      method: request.method, headers: request.headers,
    }), env);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    failures.push(error.message);
    response.writeHead(500); response.end("Local validation failed");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const reports = [];
try {
  browser = await chromium.launch({ headless: true, env: { ...process.env,
    XDG_CACHE_HOME: resolve(root, "work/public-browser/cache"),
    XDG_CONFIG_HOME: resolve(root, "work/public-browser/config"),
    XDG_DATA_HOME: resolve(root, "work/public-browser/data"),
  } });
  for (const javaScriptEnabled of [false, true]) {
    for (const width of [320, 1440]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, serviceWorkers: "block" });
      try {
        await context.route("**/*", (route) => {
          if (new URL(route.request().url()).origin === base) return route.continue();
          failures.push("Non-local browser request"); return route.abort();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on("pageerror", (error) => failures.push(error.message));
        for (const path of Object.keys(PUBLIC_PAGE_ASSETS)) {
          const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
          assert.equal(response.status(), 200);
          assert.equal(await page.locator("main").count(), 1);
          assert.equal(await page.locator("h1").count(), 1);
          assert.ok((await page.locator("main").innerText()).length > 300);
          if (path === "/pricing") {
            assert.match(await page.locator("main").innerText(), /4\.99/);
            if (javaScriptEnabled) {
              await page.getByRole("button", { name: "Yearly" }).click();
              assert.match(await page.locator("main").innerText(), /49\.99/);
            } else {
              assert.match(await page.locator("main").innerText(), /49\.99/);
            }
          }
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert.ok(overflow <= 2, `Viewport overflow: ${path}, ${width}px, JS=${javaScriptEnabled}: ${overflow}`);
          reports.push({ path, width, javaScriptEnabled, status: 200, main: 1, horizontalOverflow: overflow });
        }
        if (!javaScriptEnabled) {
          await page.locator("header").getByRole("link", { name: "Pricing", exact: true }).click();
          await page.waitForURL(`${base}/pricing`);
          assert.match(await page.locator("main").innerText(), /49\.99/);
          const response = await page.goto(`${base}/projects`);
          assert.equal(response.status(), 200);
          assert.equal(await page.locator("#root").innerHTML(), "");
          assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex,nofollow");
        } else {
          await page.goto(`${base}/login`, { waitUntil: "networkidle" });
          await page.getByRole("button", { name: /Send.*code/i }).waitFor();
          assert.equal(await page.getByRole("button", { name: /Send.*code/i }).count(), 1);
          assert.ok(await page.getByRole("button", { name: /GitHub/i }).isVisible());
          reports.push({ path: "/login", width, javaScriptEnabled, emailSignIn: true, githubSignIn: true });
        }
      } finally { await context.close(); }
    }
  }
  assert.deepEqual(failures, []);
  assert.ok(calls.length <= 60, "Bounded local fixture calls");
  console.log(JSON.stringify({ engine: "chromium", version: browser.version(), reports, apiCalls: calls, failures }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
