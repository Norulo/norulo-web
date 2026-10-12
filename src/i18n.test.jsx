import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function blockedStorage() {
  return {
    getItem: vi.fn(() => {
      throw new Error("storage blocked");
    }),
    setItem: vi.fn(() => {
      throw new Error("storage blocked");
    }),
  };
}

describe("i18n storage resilience", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("falls back when localStorage is unavailable during import or language changes", async () => {
    vi.stubGlobal("localStorage", blockedStorage());

    const { T, setLang } = await import("./i18n.jsx");

    expect(T("English", "Chinese")).toBe("English");
    let switching;
    expect(() => {
      switching = setLang("zh");
    }).not.toThrow();
    expect(T("English", "Chinese")).toBe("Chinese");
    // Finish the catalog import inside this test; a late import would
    // otherwise resolve against the next suite's mocked catalogs.
    await switching;
  });

  it("supports the expanded language list with object translations and English fallback", async () => {
    const { T, setLang } = await import("./i18n.jsx");

    const switches = [setLang("ja")];
    expect(T("Custom", { zh: "zh-custom", ja: "ja-custom", ko: "ko-custom" })).toBe("ja-custom");

    switches.push(setLang("ko"));
    expect(T("Custom", { zh: "zh-custom", ja: "ja-custom", ko: "ko-custom" })).toBe("ko-custom");

    switches.push(setLang("fr"));
    expect(T("Custom", { zh: "zh-custom" })).toBe("Custom");

    switches.push(setLang("es"));
    expect(T("Custom", { es: "es-custom" })).toBe("es-custom");
    await Promise.all(switches);
  });

  it("rejects unsupported language codes instead of normalizing aliases", async () => {
    const { T, setLang, useLang } = await import("./i18n.jsx");

    const switches = [setLang("zh-CN")];
    expect(T("Settings", "Chinese settings")).toBe("Settings");
    expect(T("Overview", "Overview")).toBe("Overview");

    switches.push(setLang("de"));
    expect(T("Settings", "Chinese settings")).toBe("Settings");
    expect(typeof useLang).toBe("function");
    await Promise.all(switches);
  });
});

describe("locale catalog loading", () => {
  const locales = ["zh", "ja", "ko", "fr", "es"];

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    for (const locale of locales) vi.doUnmock(`./locales/${locale}/catalog.js`);
    vi.resetModules();
    localStorage.clear();
  });

  function mockCatalogs(overrides = {}) {
    const loaders = {};
    for (const locale of locales) {
      loaders[locale] = vi.fn(overrides[locale] || (() => ({
        PHRASES: { Projects: `${locale}-projects` },
        DYNAMIC_PHRASE_TRANSLATIONS: [],
      })));
      vi.doMock(`./locales/${locale}/catalog.js`, loaders[locale]);
    }
    return loaders;
  }

  it("loads only the selected language and reuses its catalog", async () => {
    const loaders = mockCatalogs();
    const { T, setLang, preloadActiveLocale } = await import("./i18n.jsx");

    await preloadActiveLocale();
    expect(T("Projects")).toBe("Projects");
    for (const loader of Object.values(loaders)) expect(loader).not.toHaveBeenCalled();

    await setLang("zh");
    await setLang("zh");
    expect(T("Projects")).toBe("zh-projects");
    expect(loaders.zh).toHaveBeenCalledOnce();
    for (const locale of locales.filter(code => code !== "zh")) {
      expect(loaders[locale]).not.toHaveBeenCalled();
    }

    await setLang("en");
    expect(T("Projects")).toBe("Projects");
  });

  it("resolves inline and literal copy before running dynamic matches", async () => {
    const match = vi.fn(() => ["7 repositories", "7"]);
    mockCatalogs({
      zh: () => ({
        PHRASES: { Projects: "目录项目" },
        DYNAMIC_PHRASE_TRANSLATIONS: [{ match: { [Symbol.match]: match }, translation: "$1 个仓库" }],
      }),
    });
    const { T, setLang } = await import("./i18n.jsx");
    await setLang("zh");

    expect(T("Projects")).toBe("目录项目");
    expect(T("Projects", "内联项目")).toBe("内联项目");
    expect(T("Projects", "Projects")).toBe("目录项目");
    expect(T("Projects", { zh: "对象项目", en: "Inline projects" })).toBe("对象项目");
    expect(T("Projects", { en: "Inline projects" })).toBe("Inline projects");
    expect(T("Projects", { ja: "プロジェクト" })).toBe("目录项目");
    expect(match).not.toHaveBeenCalled();

    expect(T("7 repositories")).toBe("7 个仓库");
    expect(match).toHaveBeenCalledOnce();
  });

  it("preloads the stored language before translated copy is needed", async () => {
    localStorage.setItem("nr-lang", "ko");
    const loaders = mockCatalogs();
    const { T, preloadActiveLocale } = await import("./i18n.jsx");

    expect(document.documentElement.lang).toBe("ko");
    expect(T("Projects")).toBe("Projects");
    await preloadActiveLocale();
    expect(T("Projects")).toBe("ko-projects");
    expect(loaders.ko).toHaveBeenCalledOnce();
    expect(loaders.zh).not.toHaveBeenCalled();
  });

  it("uses English fallback while another language is loading and ignores stale completion", async () => {
    let resolveJapanese;
    const pendingJapanese = new Promise(resolve => { resolveJapanese = resolve; });
    const loaders = mockCatalogs({ ja: () => pendingJapanese });
    const { T, setLang } = await import("./i18n.jsx");
    await setLang("zh");
    expect(T("Projects")).toBe("zh-projects");

    const loading = setLang("ja");
    expect(T("Projects")).toBe("Projects");
    expect(T("Custom", { ja: "日本語" })).toBe("日本語");
    await vi.waitFor(() => expect(loaders.ja).toHaveBeenCalledOnce());
    await setLang("fr");

    resolveJapanese({ PHRASES: { Projects: "ja-projects" }, DYNAMIC_PHRASE_TRANSLATIONS: [] });
    await loading;
    expect(document.documentElement.lang).toBe("fr");
    expect(T("Projects")).toBe("fr-projects");
  });

  it("keeps English selected when an earlier catalog completes", async () => {
    let resolveChinese;
    const pendingChinese = new Promise(resolve => { resolveChinese = resolve; });
    const loaders = mockCatalogs({ zh: () => pendingChinese });
    const { T, setLang } = await import("./i18n.jsx");
    const loading = setLang("zh");
    await vi.waitFor(() => expect(loaders.zh).toHaveBeenCalledOnce());
    await setLang("en");

    resolveChinese({ PHRASES: { Projects: "zh-projects" }, DYNAMIC_PHRASE_TRANSLATIONS: [] });
    await loading;
    expect(document.documentElement.lang).toBe("en");
    expect(T("Projects", "内联项目")).toBe("Projects");
  });

  it("retains English and inline fallbacks after a failed catalog download", async () => {
    mockCatalogs({ es: () => { throw new Error("download unavailable"); } });
    const { T, setLang } = await import("./i18n.jsx");

    await setLang("es");
    expect(T("Projects")).toBe("Projects");
    expect(T("Projects", { es: "Proyectos" })).toBe("Proyectos");
  });
});
