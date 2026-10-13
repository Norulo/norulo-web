import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { PHRASES as zh } from "../src/locales/zh/catalog.js";
import { PHRASES as ja } from "../src/locales/ja/catalog.js";
import { PHRASES as ko } from "../src/locales/ko/catalog.js";
import { PHRASES as fr } from "../src/locales/fr/catalog.js";
import { PHRASES as es } from "../src/locales/es/catalog.js";
import { createMobileLayoutFixture } from "./mobile-layout-fixtures.mjs";
import { WORKSPACE_ID } from "./date-layout-fixtures.mjs";

// Run only after a completed build. Every API response is synthetic and local;
// reject writes, remote requests and extra repository reads rather than retry.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = "http://127.0.0.1:4248";
const requested = process.argv.slice(2);
const screenshots = requested.includes("--screenshots");
const args = requested.filter((argument) => argument !== "--screenshots");
assert(
  args.length === 0 || (args.length === 1 && /^--browser=(chromium|webkit|firefox)$/.test(args[0])),
  "Usage: node scripts/check-repository-picker-layout.mjs [--browser=chromium|webkit|firefox] [--screenshots]"
);
const engines = args.length ? [args[0].split("=")[1]] : ["chromium", "webkit", "firefox"];
const profiles = [
  {
    name: "desktop-1440-rail260",
    width: 1440,
    height: 1000,
    lang: "en",
    theme: "light",
    touch: false,
  },
  {
    name: "desktop-short-rail260",
    width: 1440,
    height: 480,
    lang: "fr",
    theme: "dark",
    touch: false,
  },
  { name: "phone-short", width: 320, height: 480, lang: "en", theme: "dark", touch: true },
  ...["en", "zh", "ja", "ko", "fr", "es"].map((lang, index) => ({
    name: `phone-320-${lang}`,
    width: 320,
    height: 844,
    lang,
    theme: index % 2 ? "dark" : "light",
    touch: true,
  })),
];
assert(engines.length * profiles.length <= 27, "Context cap exceeded (27)");
const repositories = [
  {
    githubRepoId: 1001,
    fullName: `fixture-primary-owner/${"LongReadableRepositoryNameForSharedHostingAndInfrastructure".repeat(2)}`,
  },
  { githubRepoId: 1002, fullName: "fixture-owner/api-costs" },
  ...Array.from({ length: 31 }, (_, index) => ({
    githubRepoId: 1003 + index,
    fullName: `fixture-owner/additional-${String(index + 1).padStart(2, "0")}`,
  })),
].map((repo) => ({
  ...repo,
  isBound: false,
  account: { id: 1, login: "fixture-owner", type: "Organization" },
}));
const copy = (key, lang) => ({ zh, ja, ko, fr, es })[lang]?.[key] || key;
const reports = [];
const runtimeHome = await mkdtemp(join(tmpdir(), "norulo-repository-picker-"));
const screenshotDir = join(root, "work", "repository-picker-layout");
if (screenshots) await mkdir(screenshotDir, { recursive: true });
const activate = (locator, profile) => (profile.touch ? locator.tap() : locator.click());
let server;
let browser;

function createFixture() {
  const core = createMobileLayoutFixture({ baseURL });
  const requests = [];
  const violations = [];
  let repositoryReads = 0;
  let projectReads = 0;
  return {
    repositoryReads: () => repositoryReads,
    apiReads: () => requests.filter((request) => request.api).length,
    recordResponse: core.recordResponse,
    async handle(route) {
      const request = route.request();
      const url = new URL(request.url());
      const record = {
        url: url.href,
        path: url.pathname,
        method: request.method(),
        api:
          request.resourceType() !== "document" &&
          /^\/(?:api|auth|billing)(?:\/|$)/.test(url.pathname),
      };
      requests.push(record);
      try {
        assert(requests.length <= 80, "Repository picker request cap exceeded (80)");
        assert(requests.filter((item) => item.api).length <= 20, "API GET cap exceeded (20)");
        assert.equal(record.method, "GET", "Picker interaction attempted a business write");
        if (
          url.origin !== baseURL ||
          !["/api/api/v1/projects", "/api/api/v1/repositories"].includes(url.pathname)
        ) {
          await core.handle(route);
          return;
        }
        assert.equal(request.headers()["x-norulo-workspace"], WORKSPACE_ID);
        for (const key of url.searchParams.keys()) {
          assert.equal(key, "limit", `Unexpected fixture query: ${key}`);
          assert.equal(url.searchParams.getAll(key).length, 1, "Duplicate fixture query");
          assert(
            /^(?:[1-9][0-9]?|100)$/.test(url.searchParams.get(key)),
            "Invalid fixture page limit"
          );
        }
        let payload;
        if (url.pathname.endsWith("/projects")) {
          projectReads += 1;
          assert.equal(projectReads, 1, "Unexpected Projects read");
          payload = { items: [], nextCursor: null };
        } else {
          repositoryReads += 1;
          assert.equal(repositoryReads, 1, "Local filtering fetched more repositories");
          payload = {
            items: repositories,
            nextCursor: "fixture-repositories-next-page",
            organizations: [{ id: 1, login: "fixture-owner" }],
            githubAccess: "authorized",
          };
        }
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
    assertClean() {
      assert.deepEqual(violations, [], "Repository picker fixture violations");
      assert.equal(repositoryReads, 1, "Expected one explicit repository read");
      assert.equal(projectReads, 1, "Expected one Projects read");
      return {
        total: requests.length,
        api: this.apiReads(),
        repositories: repositoryReads,
        inherited: core.assertClean(),
      };
    },
  };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => {
          const end = animation.effect?.getComputedTiming().endTime;
          return Number.isFinite(end) && end <= 1000;
        })
        .map((animation) => animation.finished.catch(() => {}))
    );
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
}

async function measure(page, engine, profile, stage) {
  await settle(page);
  const data = await page.evaluate(() => {
    const rect = (element) => {
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    };
    const trigger = document.querySelector('#add-repository button[role="combobox"]');
    const menu = document.querySelector(".project-repository-picker-popover");
    const search = menu?.querySelector('input[type="search"]');
    const nav = innerWidth <= 760 ? document.querySelector(".product-workspace .side") : null;
    const input = document.querySelector(".project-repository-picker-validation");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      coarse: matchMedia("(pointer: coarse)").matches,
      touchPoints: navigator.maxTouchPoints,
      field: rect(trigger.closest(".ledger-field")),
      trigger: {
        rect: rect(trigger),
        text: trigger.textContent,
        font: parseFloat(getComputedStyle(trigger).fontSize),
        expanded: trigger.getAttribute("aria-expanded"),
      },
      input: input
        ? {
            value: input.value,
            required: input.required,
            rect: rect(input),
            width: input.clientWidth,
            scrollWidth: input.scrollWidth,
          }
        : null,
      menu: menu
        ? {
            rect: rect(menu),
            width: menu.clientWidth,
            scrollWidth: menu.scrollWidth,
            maxHeight: getComputedStyle(menu).maxHeight,
            minHeight: getComputedStyle(menu).minHeight,
            boxSizing: getComputedStyle(menu).boxSizing,
            padding: getComputedStyle(menu).padding,
          }
        : null,
      search: search
        ? {
            rect: rect(search),
            font: parseFloat(getComputedStyle(search).fontSize),
            active: document.activeElement === search,
            labelled: Boolean(search.labels?.length || search.getAttribute("aria-label")),
            describedby: search.getAttribute("aria-describedby"),
          }
        : null,
      options: menu
        ? [...menu.querySelectorAll('[role="option"]')].map((element) => ({
            text: element.textContent,
            rect: rect(element),
            scrollWidth: element.scrollWidth,
            width: element.clientWidth,
            selected: element.getAttribute("aria-selected"),
          }))
        : [],
      topbarBottom: document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0,
      navTop: nav?.getBoundingClientRect().top || innerHeight,
      overflow:
        document.documentElement.scrollWidth > innerWidth + 1
          ? [...document.querySelectorAll("body *")]
              .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 10)
              .map((element) => ({
                tag: element.tagName,
                className: element.className,
                rect: rect(element),
              }))
          : [],
    };
  });
  const details = `${engine}/${profile.name}/${stage}: ${JSON.stringify(data)}`;
  assert(data.documentWidth <= data.viewport.width + 1, `Document overflow: ${details}`);
  assert.equal(data.coarse, profile.touch, `Pointer mismatch: ${details}`);
  if (profile.touch && engine === "chromium")
    assert(data.touchPoints > 0, `Touch emulation unavailable: ${details}`);
  assert(
    Math.abs(data.trigger.rect.left - data.field.left) <= 1 &&
      Math.abs(data.trigger.rect.right - data.field.right) <= 1,
    `Picker does not align with form field: ${details}`
  );
  if (profile.touch)
    assert(
      data.trigger.rect.height >= 44 && data.trigger.font >= 16,
      `Small phone trigger: ${details}`
    );
  if (data.menu) {
    assert.equal(data.trigger.expanded, "true", `Open state not exposed: ${details}`);
    assert(data.menu.scrollWidth <= data.menu.width + 1, `Popup horizontal overflow: ${details}`);
    assert(
      data.menu.rect.left >= -1 && data.menu.rect.right <= data.viewport.width + 1,
      `Popup escapes horizontal viewport: ${details}`
    );
    assert(
      data.menu.rect.top >= data.topbarBottom - 1 && data.menu.rect.bottom <= data.navTop + 1,
      `Popup hidden behind navigation: ${details}`
    );
    assert(
      data.search?.labelled && data.search.describedby,
      `Search lacks name/local-scope guidance: ${details}`
    );
    assert(
      data.search.rect.top >= data.menu.rect.top - 1 &&
        data.search.rect.bottom <= data.menu.rect.bottom + 1,
      `Search escapes popup: ${details}`
    );
    if (profile.touch)
      assert(
        data.search.rect.height >= 44 && data.search.font >= 16,
        `Small phone search: ${details}`
      );
    for (const option of data.options) {
      assert(
        option.scrollWidth <= option.width + 1,
        `Repository name overflows option: ${details}`
      );
      assert(
        option.rect.left >= data.menu.rect.left - 1 &&
          option.rect.right <= data.menu.rect.right + 1,
        `Option escapes popup: ${details}`
      );
      assert(option.rect.height >= 44, `Small repository option: ${details}`);
    }
  } else {
    assert.equal(data.trigger.expanded, "false", `Closed state not exposed: ${details}`);
    assert.equal(
      await page.locator('#add-repository input[type="search"]').count(),
      0,
      "Search remains outside the dropdown"
    );
  }
  return { stage, ...data };
}

async function dismissOutside(page, profile) {
  await settle(page);
  const point = await page.evaluate(() => {
    const menu = document.querySelector(".project-repository-picker-popover");
    const picker = document.querySelector(".project-repository-picker");
    const top = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
    const bottom =
      innerWidth <= 760
        ? document.querySelector(".product-workspace .side")?.getBoundingClientRect().top ||
          innerHeight
        : innerHeight;
    const box = menu.getBoundingClientRect();
    for (const x of [box.left - 8, box.right + 8, 4, innerWidth - 4]) {
      for (const y of [top + 12, bottom - 12, (top + bottom) / 2]) {
        if (x < 0 || x >= innerWidth || y <= top || y >= bottom) continue;
        const target = document.elementFromPoint(x, y);
        if (
          target &&
          !menu.contains(target) &&
          !picker?.contains(target) &&
          !target.closest('a, button, input, select, textarea, label, summary, [role="separator"]')
        )
          return { x, y };
      }
    }
    return null;
  });
  assert(point, "No non-interactive background outside repository dropdown");
  // Precise pointer coordinates avoid Chromium's touch retargeting from narrow
  // background gaps to the adjacent Repository label/trigger.
  await page.mouse.click(point.x, point.y);
  return { point, simulatedTouchContext: profile.touch };
}

await access(join(root, "dist", "index.html"));
process.env.PLAYWRIGHT_BROWSERS_PATH ||= join(root, "node_modules", ".cache", "ms-playwright");
try {
  server = await preview({
    configFile: false,
    root,
    appType: "spa",
    logLevel: "warn",
    server: { proxy: {} },
    preview: { host: "127.0.0.1", port: 4248, strictPort: true, proxy: {} },
  });
  const playwright = await import("playwright");
  for (const engine of engines) {
    const browserType = playwright[engine];
    let executablePath = process.env[`${engine.toUpperCase()}_EXECUTABLE_PATH`];
    if (
      !executablePath &&
      engine === "chromium" &&
      !(await exists(browserType.executablePath())) &&
      (await exists("/usr/bin/chromium"))
    )
      executablePath = "/usr/bin/chromium";
    browser = await browserType.launch({
      headless: true,
      timeout: 30000,
      ...(executablePath ? { executablePath } : {}),
      env: {
        ...process.env,
        XDG_CACHE_HOME: join(runtimeHome, "cache"),
        XDG_CONFIG_HOME: join(runtimeHome, "config"),
        XDG_DATA_HOME: join(runtimeHome, "data"),
      },
    });
    for (const profile of profiles) {
      const fixture = createFixture();
      const errors = [];
      const report = { engine, version: browser.version(), profile, states: [] };
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        locale: profile.lang,
        hasTouch: profile.touch,
        ...(engine !== "firefox" ? { isMobile: profile.touch } : {}),
        serviceWorkers: "block",
      });
      try {
        await context.route("**/*", (route) => fixture.handle(route));
        context.on("response", fixture.recordResponse);
        await context.addInitScript(({ lang, theme }) => {
          localStorage.setItem("nr-lang", lang);
          localStorage.setItem("nr-theme", theme);
        }, profile);
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${baseURL}/projects`, { waitUntil: "domcontentloaded" });
        const form = page.locator("#add-repository");
        await form.waitFor();
        await form.locator('input[maxlength="120"]').fill("Local repository UI fixture");
        await activate(form.locator("details > summary").nth(2), profile);
        const trigger = form.locator('button[role="combobox"]');
        await trigger.waitFor();
        // Locale catalogs load lazily. Complete their first translated render
        // before measuring an opened dropdown or triggering native validation.
        await form
          .getByRole("button", { name: copy("Create project", profile.lang), exact: true })
          .waitFor();
        await settle(page);
        if (!profile.touch) {
          // An empty Projects fixture opens its only form without a split
          // divider. Constrain that same container to the supported rail min.
          await form.evaluate((element) => {
            element.style.width = "260px";
          });
          assert(
            Math.abs((await form.boundingBox()).width - 260) <= 1,
            "Repository form did not fit a 260px rail"
          );
        }
        await trigger.evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" })
        );
        const baselineReads = fixture.apiReads();
        report.states.push(await measure(page, engine, profile, "closed"));
        assert.equal(
          await form
            .locator(".project-repository-picker-validation")
            .evaluate((element) => element.form.reportValidity()),
          false,
          "Missing required repository passed native form validation"
        );
        const popup = page.locator(".project-repository-picker-popover");
        const search = popup.locator('input[type="search"]');
        await search.waitFor();
        assert(
          await search.evaluate((element) => document.activeElement === element),
          "Opening repository dropdown does not focus its search"
        );
        assert.equal(
          await popup
            .getByRole("searchbox", { name: copy("Find a repository", profile.lang), exact: true })
            .count(),
          1,
          "Repository search lacks its localized accessible name"
        );
        report.states.push(await measure(page, engine, profile, "open"));
        await search.fill("API-COSTS");
        assert.equal(
          await popup.getByRole("option", { name: repositories[1].fullName, exact: true }).count(),
          1,
          "Local search is not case insensitive"
        );
        assert.equal(
          await popup.getByRole("option", { name: repositories[0].fullName, exact: true }).count(),
          0,
          "Search did not filter loaded repositories"
        );
        await search.fill("not-in-the-loaded-page");
        await popup.getByRole("status").waitFor();
        report.states.push(await measure(page, engine, profile, "no-match"));
        assert.equal(
          await form
            .getByRole("button", { name: copy("Load more repositories", profile.lang) })
            .count(),
          1,
          "No-match search hides manual pagination"
        );
        await search.press("Escape");
        await popup.waitFor({ state: "hidden" });
        assert(
          await trigger.evaluate((element) => document.activeElement === element),
          "Escape does not restore repository trigger focus"
        );
        await trigger.press("ArrowDown");
        await search.waitFor();
        await search.fill("fixture-primary");
        await search.press("ArrowDown");
        await search.press("Enter");
        await popup.waitFor({ state: "hidden" });
        assert(
          (await trigger.textContent()).includes(repositories[0].fullName),
          "Keyboard Enter did not select the primary repository"
        );
        assert.equal(
          await form
            .locator(".project-repository-picker-validation")
            .evaluate((element) => element.checkValidity()),
          true,
          "Selected repository failed native required validation"
        );
        report.states.push(await measure(page, engine, profile, "long-selected-name"));
        await activate(trigger, profile);
        await search.fill("");
        await search.press("Escape");
        const additional = form.locator(".ledger-repository-list");
        const extra = additional.getByRole("checkbox", {
          name: repositories[1].fullName,
          exact: true,
        });
        await extra.check();
        await activate(trigger, profile);
        await search.fill("not-in-the-loaded-page");
        assert(
          (await trigger.textContent()).includes(repositories[0].fullName),
          "Searching discarded primary selection"
        );
        await search.fill("");
        await search.press("Escape");
        assert.equal(await extra.isChecked(), true, "Searching discarded additional repository ID");
        if (profile.name === "desktop-1440-rail260") {
          for (const repository of repositories.slice(2, 30))
            await additional
              .getByRole("checkbox", { name: repository.fullName, exact: true })
              .check();
          assert.equal(
            await additional.locator('input[type="checkbox"]:checked').count(),
            29,
            "Additional repository count changed"
          );
          const overflow = additional.getByRole("checkbox", {
            name: repositories[30].fullName,
            exact: true,
          });
          assert(await overflow.isDisabled(), "Thirty-repository cap allows another selection");
          assert.equal(
            await extra.isDisabled(),
            false,
            "Repository cap prevents removing selected extras"
          );
          await extra.uncheck();
          assert.equal(
            await overflow.isDisabled(),
            false,
            "Removing a selected repository did not restore capacity"
          );
        }
        await trigger.evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" })
        );
        await activate(trigger, profile);
        await search.waitFor();
        report.outsideDismiss = await dismissOutside(page, profile);
        await popup.waitFor({ state: "hidden" });
        report.states.push(await measure(page, engine, profile, "outside-dismissed"));
        assert.equal(fixture.repositoryReads(), 1, "Picker automatically fetched repositories");
        assert.equal(
          fixture.apiReads(),
          baselineReads,
          "Typing or selecting triggered extra API reads"
        );
        assert.deepEqual(errors, [], "Repository picker browser errors");
        report.requests = fixture.assertClean();
        if (screenshots && ["desktop-1440-rail260", "phone-320-zh"].includes(profile.name)) {
          await activate(trigger, profile);
          await search.fill("fixture-primary");
          const path = join(screenshotDir, `${engine}-${profile.name}.png`);
          await page.screenshot({ path, fullPage: true });
          report.screenshot = path;
        }
        reports.push(report);
        process.stderr.write(`${engine}/${profile.name}: ${report.states.length} states passed\n`);
      } catch (error) {
        process.stderr.write(JSON.stringify({ ...report, error: error.message }) + "\n");
        throw error;
      } finally {
        await context.close();
      }
    }
    await browser.close();
    browser = null;
  }
  process.stdout.write(
    JSON.stringify(
      {
        scope:
          "Bounded loopback GET-only repository fixtures; search and selection never fetch or mutate remote business data. Browser viewport/touch emulation is local evidence, not physical-device acceptance.",
        maxContexts: 27,
        perContextRequestCap: 80,
        perContextAPIReadCap: 20,
        contexts: reports.length,
        states: reports.reduce((sum, report) => sum + report.states.length, 0),
        reports,
      },
      null,
      2
    ) + "\n"
  );
} finally {
  const cleanup = await Promise.allSettled([
    browser?.close(),
    server
      ? new Promise((done, reject) => {
          server.httpServer.closeAllConnections?.();
          server.httpServer.close((error) => (error ? reject(error) : done()));
        })
      : Promise.resolve(),
  ]);
  await rm(runtimeHome, { recursive: true, force: true });
  const failures = cleanup.filter((result) => result.status === "rejected");
  if (failures.length)
    throw new AggregateError(
      failures.map((result) => result.reason),
      "Repository picker cleanup failed"
    );
}
