// Submits every URL in the norulo.com sitemap to IndexNow.
//
// Usage:
//   npm run indexnow:submit                 # live sitemap, after a deploy
//   npm run indexnow:submit -- --local      # public/sitemap.xml from this checkout
//   npm run indexnow:submit -- --dry-run    # print the request, send nothing
//
// The live key file is checked first, because IndexNow rejects submissions
// whose key file it cannot read (the SPA fallback would return HTML instead).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REQUEST_TIMEOUT_MS = 30000;
// IndexNow accepts at most 10,000 URLs per request.
const MAX_URLS_PER_REQUEST = 10000;

export function loadIndexNowConfig(path = resolve(root, "indexnow.config.json")) {
  const config = JSON.parse(readFileSync(path, "utf8"));
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(config.key || ""))
    throw new Error("IndexNow key must be 8-128 letters, digits or dashes");
  if (config.keyLocation !== `https://${config.host}/${config.key}.txt`)
    throw new Error("keyLocation must be the key file at the host root");
  return config;
}

export function sitemapUrls(xml, host) {
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) =>
    match[1].replaceAll("&amp;", "&")
  );
  const unique = [...new Set(urls)];
  for (const url of unique) {
    if (new URL(url).hostname !== host) throw new Error(`Sitemap URL is not on ${host}: ${url}`);
  }
  return unique;
}

export function indexNowPayloads(config, urls) {
  const payloads = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    payloads.push({
      host: config.host,
      key: config.key,
      keyLocation: config.keyLocation,
      urlList: urls.slice(i, i + MAX_URLS_PER_REQUEST),
    });
  }
  return payloads;
}

async function get(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Norulo-IndexNow-Submit" },
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

async function main(args) {
  const config = loadIndexNowConfig();
  const dryRun = args.includes("--dry-run");
  const local = args.includes("--local");

  const xml = local
    ? readFileSync(resolve(root, "public", "sitemap.xml"), "utf8")
    : (await get(config.sitemap)).body;
  const urls = sitemapUrls(xml, config.host);
  if (urls.length === 0) throw new Error("Sitemap has no URLs");

  if (!dryRun) {
    const keyFile = await get(config.keyLocation);
    if (keyFile.status !== 200 || keyFile.body.trim() !== config.key) {
      throw new Error(
        `Live key file ${config.keyLocation} does not contain the key (HTTP ${keyFile.status}); deploy first`
      );
    }
  }

  for (const payload of indexNowPayloads(config, urls)) {
    if (dryRun) {
      console.log(`POST ${config.endpoint}\n${JSON.stringify(payload, null, 2)}`);
      continue;
    }
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Norulo-IndexNow-Submit",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const text = await response.text();
    // 200 = accepted, 202 = accepted while the key is still being validated.
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`IndexNow HTTP ${response.status}: ${text.slice(0, 500)}`);
    }
    console.log(`IndexNow accepted ${payload.urlList.length} URLs (HTTP ${response.status})`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
