// Build-only: move inline translations out of the shared copy modules and into
// each language's lazily loaded phrase catalog.
//
// Copy modules such as src/locales/plugins-guide.js hold [english, { zh, ja,
// ko, fr, es }] tuples that screens pass to T(...tuple). Bundled as written,
// every visitor downloads all six languages. In a production build this plugin
// replaces each tuple with [english] and appends the translations to
// src/locales/<code>/catalog.js, keyed by the English text. T() already falls
// back to the active catalog when no inline translation is given, so every
// language resolves to the same text as before while English sessions
// download no translations and other sessions download only their own.
//
// Source files, the dev server, SSR pre-rendering and tests are unchanged.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const TRANSLATED_LANGUAGES = ["zh", "ja", "ko", "fr", "es"];

// Pure-data copy modules: every export is a string or plain data built from
// copy tuples. The build fails if one of them starts exporting a function.
export const SPLIT_COPY_MODULES = [
  "src/locales/agent-guide.js",
  "src/locales/api-guide.js",
  "src/locales/billing-subscription.js",
  "src/locales/billing-usage.js",
  "src/locales/currency-picker.js",
  "src/locales/docs-guide.js",
  "src/locales/docs-nav.js",
  "src/locales/expense-capacity.js",
  "src/locales/expense-retention.js",
  "src/locales/github-account.js",
  "src/locales/landing.js",
  "src/locales/plugins-guide.js",
  "src/locales/status-traffic.js",
  "src/locales/timezone-picker.js",
];

const LANGUAGE_SET = new Set(TRANSLATED_LANGUAGES);

function isTranslationMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length > 0 &&
    keys.every((key) => LANGUAGE_SET.has(key)) &&
    Object.values(value).every((text) => typeof text === "string")
  );
}

function isCopyTuple(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    isTranslationMap(value[1])
  );
}

function visitTuples(value, visit) {
  if (isCopyTuple(value)) return visit(value);
  if (Array.isArray(value)) return value.map((item) => visitTuples(item, visit));
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null)
      throw new Error("Split copy modules may only export plain data");
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, visitTuples(item, visit)])
    );
  }
  if (typeof value === "function") throw new Error("Split copy modules may not export functions");
  return value;
}

/**
 * Computes the English-only modules and the per-language phrase additions.
 * `modules` maps a module path to its evaluated exports; `catalogs` maps a
 * language code to the phrases its catalog already provides.
 */
export function splitCopyModules(modules, catalogs) {
  // English text -> language -> set of distinct translations across modules.
  const seen = new Map();
  for (const exports of Object.values(modules)) {
    visitTuples(exports, ([english, translations]) => {
      if (!seen.has(english)) seen.set(english, new Map());
      const byLanguage = seen.get(english);
      for (const [language, text] of Object.entries(translations)) {
        if (!byLanguage.has(language)) byLanguage.set(language, new Set());
        byLanguage.get(language).add(text);
      }
    });
  }

  // A tuple can move only when every language it carries resolves to the same
  // text from the catalog: no other tuple or existing phrase may disagree.
  const movable = new Set();
  for (const [english, byLanguage] of seen) {
    const agrees = [...byLanguage].every(([language, texts]) => {
      if (texts.size !== 1) return false;
      const [text] = texts;
      if (!text) return false;
      const existing = catalogs[language]?.[english];
      return existing === undefined || existing === text;
    });
    if (agrees) movable.add(english);
  }

  const phrases = Object.fromEntries(TRANSLATED_LANGUAGES.map((language) => [language, {}]));
  const stripped = {};
  for (const [path, exports] of Object.entries(modules)) {
    stripped[path] = visitTuples(exports, (tuple) => {
      const [english, translations] = tuple;
      if (!movable.has(english)) return tuple;
      for (const [language, text] of Object.entries(translations))
        phrases[language][english] = text;
      return [english];
    });
  }
  return { stripped, phrases, kept: [...seen.keys()].filter((english) => !movable.has(english)) };
}

function moduleSource(exports) {
  return Object.entries(exports)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};`)
    .join("\n");
}

async function importFresh(file) {
  return { ...(await import(`${pathToFileURL(file).href}?split=${Date.now()}`)) };
}

export function localeSplitPlugin({ root = process.cwd() } = {}) {
  let result = null;
  const moduleFiles = new Map(SPLIT_COPY_MODULES.map((path) => [resolve(root, path), path]));
  const catalogFiles = new Map(
    TRANSLATED_LANGUAGES.map((language) => [
      resolve(root, `src/locales/${language}/catalog.js`),
      language,
    ])
  );
  return {
    name: "norulo-locale-split",
    apply: "build",
    async buildStart() {
      const modules = {};
      for (const [file, path] of moduleFiles) modules[path] = await importFresh(file);
      const catalogs = {};
      for (const [file, language] of catalogFiles)
        catalogs[language] = (await importFresh(file)).PHRASES;
      result = splitCopyModules(modules, catalogs);
    },
    transform(code, id) {
      const file = id.split("?")[0];
      if (moduleFiles.has(file)) {
        return { code: moduleSource(result.stripped[moduleFiles.get(file)]), map: null };
      }
      if (catalogFiles.has(file)) {
        const additions = result.phrases[catalogFiles.get(file)];
        return {
          code: `${code}\nObject.assign(PHRASES, ${JSON.stringify(additions)});\n`,
          map: null,
        };
      }
      return null;
    },
  };
}
