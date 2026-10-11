// Compatibility export for catalog inspection. Runtime loads <locale>/catalog.js.
import { LEDGER_SCREEN_PHRASES as ZH } from "./zh/ledger.js";
import { LEDGER_SCREEN_PHRASES as JA } from "./ja/ledger.js";
import { LEDGER_SCREEN_PHRASES as KO } from "./ko/ledger.js";
import { LEDGER_SCREEN_PHRASES as FR } from "./fr/ledger.js";
import { LEDGER_SCREEN_PHRASES as ES } from "./es/ledger.js";

export const LEDGER_SCREEN_PHRASES = { zh: ZH, ja: JA, ko: KO, fr: FR, es: ES };
