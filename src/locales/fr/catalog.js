// One lazy entry per language keeps other languages out of its download.
import { PHRASES as BASE_PHRASES } from "../fr.js";
import { LEDGER_PHRASES, LEDGER_LONG_PHRASES, LEDGER_UI_PHRASES, LEDGER_SCOPE_PHRASES, LEDGER_SCREEN_PHRASES, LEDGER_SUMMARY_PHRASES } from "./ledger.js";
export { DYNAMIC_PHRASE_TRANSLATIONS } from "./dynamic.js";

// Later catalogs retain their existing phrase precedence.
export const PHRASES = {
  ...BASE_PHRASES,
  ...LEDGER_PHRASES,
  ...LEDGER_LONG_PHRASES,
  ...LEDGER_UI_PHRASES,
  ...LEDGER_SCOPE_PHRASES,
  ...LEDGER_SCREEN_PHRASES,
  ...LEDGER_SUMMARY_PHRASES,
};
