import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const robotsFile = readFileSync(join(process.cwd(), "public", "robots.txt"), "utf-8");
const sitemapFile = readFileSync(join(process.cwd(), "public", "sitemap.xml"), "utf-8");

describe("search discovery files", () => {
  it("allows search discovery while separating ChatGPT search from model training", () => {
    expect(robotsFile).toContain("User-agent: OAI-SearchBot\nAllow: /");
    expect(robotsFile).toContain("User-agent: GPTBot\nDisallow: /");
    expect(robotsFile).toContain("Sitemap: https://norulo.com/sitemap.xml");
  });

  it("publishes only canonical public pages in the sitemap", () => {
    expect(sitemapFile).toContain("<loc>https://norulo.com/</loc>");
    expect(sitemapFile).toContain("<loc>https://norulo.com/pricing</loc>");
    expect(sitemapFile).toContain("<loc>https://norulo.com/developers/docs</loc>");
    expect(sitemapFile).toContain("<loc>https://norulo.com/developers/api</loc>");
    expect(sitemapFile).not.toContain("/dashboard");
    expect(sitemapFile).not.toContain("/login");
  });
});

describe("search engine ownership verification", () => {
  it("keeps the Bing Webmaster Tools tag in the HTML head", () => {
    const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf-8");
    const head = indexHtml.slice(0, indexHtml.indexOf("</head>"));
    expect(head).toContain('<meta name="msvalidate.01" content="FAC02BC8739E7276352818F68957948B" />');
  });

  it("keeps the Google Search Console tag in the HTML head", () => {
    const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf-8");
    const head = indexHtml.slice(0, indexHtml.indexOf("</head>"));
    expect(head).toContain(
      '<meta name="google-site-verification" content="Omc337gUD8R2I033vzm_IBsUHwJCaPwiBz_Qq4g-aqI" />'
    );
  });
});
