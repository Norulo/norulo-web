// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { indexNowPayloads, loadIndexNowConfig, sitemapUrls } from "./submit-indexnow.mjs";

const config = loadIndexNowConfig();

describe("IndexNow", () => {
  it("serves the configured key from a root key file", () => {
    const keyFile = readFileSync(join(process.cwd(), "public", `${config.key}.txt`), "utf8");
    expect(keyFile.trim()).toBe(config.key);
    expect(config.host).toBe("norulo.com");
    expect(config.endpoint).toBe("https://api.indexnow.org/indexnow");
  });

  it("submits every canonical sitemap URL", () => {
    const sitemap = readFileSync(join(process.cwd(), "public", "sitemap.xml"), "utf8");
    const urls = sitemapUrls(sitemap, config.host);
    expect(urls).toContain("https://norulo.com/");
    expect(urls).toContain("https://norulo.com/pricing");
    expect(urls.length).toBe((sitemap.match(/<loc>/g) || []).length);
    const [payload, ...rest] = indexNowPayloads(config, urls);
    expect(rest).toEqual([]);
    expect(payload).toEqual({
      host: "norulo.com",
      key: config.key,
      keyLocation: config.keyLocation,
      urlList: urls,
    });
  });

  it("rejects sitemap URLs on another host", () => {
    expect(() => sitemapUrls("<loc>https://example.com/</loc>", "norulo.com")).toThrow(
      /not on norulo.com/
    );
  });

  it("splits large URL lists at the IndexNow limit", () => {
    const urls = Array.from({ length: 10001 }, (_, i) => `https://norulo.com/${i}`);
    expect(indexNowPayloads(config, urls).map((p) => p.urlList.length)).toEqual([10000, 1]);
  });
});
