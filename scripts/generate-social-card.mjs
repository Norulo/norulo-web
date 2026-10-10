import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const publicRoot = new URL("../public/", import.meta.url);
const svgPath = new URL("social-card.svg", publicRoot);
const [template, logo, geist, geistMono] = await Promise.all([
  readFile(svgPath, "utf8"),
  readFile(new URL("norulo-logo.png", publicRoot)),
  readFile(new URL("fonts/geist-latin.woff2", publicRoot)),
  readFile(new URL("fonts/geist-mono-latin.woff2", publicRoot)),
]);
const logoElement = `<image data-norulo-logo="true" x="-7" y="-7" width="48" height="48" href="data:image/png;base64,${logo.toString("base64")}" />`;
const fontStyles = `<style data-norulo-fonts="true">@font-face{font-family:Geist;src:url(data:font/woff2;base64,${geist.toString("base64")}) format('woff2')}@font-face{font-family:'Geist Mono';src:url(data:font/woff2;base64,${geistMono.toString("base64")}) format('woff2')}</style>`;
const svg = template
  .replace(/<image data-norulo-logo="true"[^>]*\/>/, logoElement)
  .replace(/<style data-norulo-fonts="true">[\s\S]*?<\/style>/, fontStyles);
if (!svg.includes(logoElement) || !svg.includes(fontStyles)) {
  throw new Error("Norulo social-card template must include its logo and font slots.");
}
await writeFile(svgPath, svg);

// Rasterize the exact local SVG, supplied logo and licensed fonts. This does
// not draw, generate or reinterpret the logo and makes no network requests.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.route(/^https?:\/\//, (route) => route.abort());
  await page.setContent(
    `<html><head><style>html,body{margin:0;width:1200px;height:630px}svg{display:block}</style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve, reject) => {
      const logo = new Image();
      logo.onload = resolve;
      logo.onerror = reject;
      logo.src = document.querySelector("image[data-norulo-logo]").getAttribute("href");
    });
  });
  await page.screenshot({ path: fileURLToPath(new URL("social-card.png", publicRoot)) });
} finally {
  await browser.close();
}
console.log("Generated the Norulo SVG and PNG social card from the supplied original logo.");
