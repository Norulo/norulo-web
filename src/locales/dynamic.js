// Compatibility export for inspecting the rules across all supported locales.
import { DYNAMIC_PHRASE_TRANSLATIONS as ZH } from "./zh/dynamic.js";
import { DYNAMIC_PHRASE_TRANSLATIONS as JA } from "./ja/dynamic.js";
import { DYNAMIC_PHRASE_TRANSLATIONS as KO } from "./ko/dynamic.js";
import { DYNAMIC_PHRASE_TRANSLATIONS as FR } from "./fr/dynamic.js";
import { DYNAMIC_PHRASE_TRANSLATIONS as ES } from "./es/dynamic.js";

export const DYNAMIC_PHRASE_TRANSLATIONS = ZH.map((rule, index) => ({
  match: rule.match,
  translations: {
    zh: ZH[index].translation,
    ja: JA[index].translation,
    ko: KO[index].translation,
    fr: FR[index].translation,
    es: ES[index].translation,
  },
}));
