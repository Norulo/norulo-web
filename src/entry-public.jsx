// Build-time rendering only. Never import App, restore a session, run effects,
// read customer data or invoke a business API while generating these documents.
import { renderToStaticMarkup } from "react-dom/server";
import { LandingScreen } from "./screens/public.jsx";
import { DocsScreen } from "./screens/docs.jsx";
import { ApiDocsScreen } from "./screens/api-docs.jsx";
import { PluginsScreen } from "./screens/plugins.jsx";
import { PublicFooter, PublicHeader } from "./screens/public-layout.jsx";
import { PUBLIC_PRICING_MARKER } from "../public-pages.js";

const SCREENS = {
  "/": LandingScreen,
  "/developers/docs": DocsScreen,
  "/developers/api": ApiDocsScreen,
  "/plugins": PluginsScreen,
  "/pricing": PublicPricingDocument,
};

function PublicPricingDocument() {
  return (
    <div className="landing">
      <PublicHeader current="pricing" />
      <main id="main-content" tabIndex={-1}>
        <section className="pricing-hero">
          <div className="lp-hero-tag">Account plans</div>
          <h1 className="lp-title">Pricing</h1>
          <p className="lp-sub">
            Compare Norulo platform subscriptions. Expenses you record in the ledger are separate
            from these charges.
          </p>
        </section>
        <div data-public-pricing="true" />
      </main>
      <PublicFooter current="pricing" />
    </div>
  );
}

export function renderPublicPage(path) {
  const Screen = SCREENS[path];
  if (!Screen) throw new Error("Not a pre-renderable public page");
  return renderToStaticMarkup(
    <div className="app-frame" data-console="false">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="screen-root" data-screen-label="public-document">
        <Screen />
      </div>
    </div>
  ).replace('<div data-public-pricing="true"></div>', PUBLIC_PRICING_MARKER);
}
