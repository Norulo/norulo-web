import { describe, expect, it } from "vitest";
import {
  SPLIT_COPY_MODULES,
  TRANSLATED_LANGUAGES,
  splitCopyModules,
} from "./locale-split-plugin.mjs";

// Mirrors T(): inline translation first, then the active catalog, then English.
function resolveCopy(tuple, language, phrases) {
  const [english, translations] = tuple;
  if (language === "en") return english;
  return translations?.[language] || phrases?.[english] || english;
}

function tuples(value, found = []) {
  if (Array.isArray(value) && typeof value[0] === "string" && value.length <= 2) {
    if (value.length === 1 || (value[1] && typeof value[1] === "object")) found.push(value);
    return found;
  }
  if (value && typeof value === "object")
    for (const item of Object.values(value)) tuples(item, found);
  return found;
}

async function load() {
  const modules = {};
  for (const path of SPLIT_COPY_MODULES)
    modules[path] = { ...(await import(/* @vite-ignore */ `../${path}`)) };
  const catalogs = {};
  for (const language of TRANSLATED_LANGUAGES)
    catalogs[language] = (await import(`../src/locales/${language}/catalog.js`)).PHRASES;
  return { modules, catalogs };
}

describe("build-time locale split", () => {
  it("resolves every copy tuple to the same text in every language", async () => {
    const { modules, catalogs } = await load();
    const { stripped, phrases } = splitCopyModules(modules, catalogs);
    for (const path of SPLIT_COPY_MODULES) {
      const before = tuples(modules[path]);
      const after = tuples(stripped[path]);
      expect(after).toHaveLength(before.length);
      for (const language of ["en", ...TRANSLATED_LANGUAGES]) {
        const merged = { ...catalogs[language], ...phrases[language] };
        before.forEach((tuple, index) => {
          expect(resolveCopy(after[index], language, merged), `${path} ${language}`).toBe(
            resolveCopy(tuple, language, catalogs[language])
          );
        });
      }
    }
  });

  it("removes the translations from the English bundle", async () => {
    const { modules, catalogs } = await load();
    const { stripped, kept } = splitCopyModules(modules, catalogs);
    const remaining = tuples(stripped).filter((tuple) => tuple.length === 2);
    expect(remaining.length).toBe(
      tuples(modules).filter((tuple) => tuple.length === 2 && kept.includes(tuple[0])).length
    );
    expect(remaining.length).toBeLessThan(tuples(modules).length / 10);
  });

  it("keeps a tuple inline when its translations disagree with the catalog", () => {
    const { stripped, phrases, kept } = splitCopyModules(
      { a: { X: ["Save", { zh: "保存" }], Y: ["Open", { zh: "打开" }] } },
      { zh: { Save: "存储" } }
    );
    expect(stripped.a.X).toEqual(["Save", { zh: "保存" }]);
    expect(stripped.a.Y).toEqual(["Open"]);
    expect(phrases.zh).toEqual({ Open: "打开" });
    expect(kept).toEqual(["Save"]);
  });

  it("rejects modules that export functions", () => {
    expect(() => splitCopyModules({ a: { f: () => 1 } }, {})).toThrow(/functions/);
  });
});
