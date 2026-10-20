import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import { PUBLIC_PAGE_ASSETS } from "../public-pages.js";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(resolve(dist, ".vite/manifest.json"), "utf8"));
assert.ok(template.includes('<div id="root"></div>'), "Expected the unmodified SPA shell");

const sources = {
  "/": "index.html",
  "/pricing": "src/screens/billing.jsx",
  "/developers/docs": "src/screens/docs.jsx",
  "/developers/api": "src/screens/api-docs.jsx",
  "/plugins": "src/screens/plugins.jsx",
};

function stylesFor(source, seen = new Set()) {
  if (seen.has(source)) return [];
  seen.add(source);
  const entry = manifest[source];
  assert.ok(entry, `Missing build manifest entry: ${source}`);
  return [...(entry.css || []), ...(entry.imports || []).flatMap((key) => stylesFor(key, seen))];
}

// Vite transforms the existing JSX and CSS imports for build-time React SSR.
// No browser is launched and no network API is called. Browser effects do not run.
const vite = await createServer({
  root,
  mode: "production",
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: "custom",
});
try {
  const { renderPublicPage } = await vite.ssrLoadModule("/src/entry-public.jsx");
  for (const [path, asset] of Object.entries(PUBLIC_PAGE_ASSETS)) {
    const content = renderPublicPage(path);
    assert.ok(content.includes('<main id="main-content"'), `Missing public main: ${path}`);
    assert.ok(content.includes('href="/pricing"'), `Missing public navigation: ${path}`);
    const styles = [...new Set(stylesFor(sources[path]))]
      .filter((file) => !template.includes(`href="/${file}"`))
      .map((file) => `<link rel="stylesheet" href="/${file}" />`).join("\n");
    const html = template.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
      .replace("</head>", () => `${styles}\n</head>`);
    const file = resolve(dist, asset.slice(1));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    console.log(`Pre-rendered ${path}`);
  }
} finally {
  await vite.close();
}
// The manifest is a build input, not a public endpoint.
await rm(resolve(dist, ".vite"), { recursive: true });
