import "./docs.css";
import { useEffect } from "react";
import { I } from "../icons.jsx";
import { T, useLang } from "../i18n.jsx";
import { screenLinkProps } from "../lib/navigation.js";
import { MCP_SERVER_URL, PLUGINS_GUIDE, SUPPORT_EMAIL } from "../locales/plugins-guide.js";
import { DocsCode, DocsSideNav } from "./docs-layout.jsx";
import { PublicFooter, PublicHeader } from "./public-layout.jsx";

// ChatGPT's own field labels stay in English so they match its interface.
const CONNECTION_DETAILS = [
  "Name: Norulo",
  `MCP server URL: ${MCP_SERVER_URL}`,
  "Authentication: OAuth",
].join("\n");

const URL_PATTERN = /(https:\/\/[A-Za-z0-9][A-Za-z0-9./?=&%_~+#:@-]*[A-Za-z0-9/#])/g;

// Renders the URLs written inside translated copy as links.
function Linked({ text }) {
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 ? (
      <a key={index} className="auth-link" href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

const HELP_SECTIONS = ["troubleshooting", "about", "support"];

function helpTitle(id) {
  if (id === "troubleshooting") return T(...PLUGINS_GUIDE.troubleshootingTitle);
  if (id === "about") return T(...PLUGINS_GUIDE.aboutTitle);
  return T(...PLUGINS_GUIDE.supportTitle);
}

export function PluginsScreen({ go, auth }) {
  useLang();
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;
    const frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="landing fade-in">
      <PublicHeader go={go} current="plugins" auth={auth} />
      <div className="docs-shell">
        <DocsSideNav
          label={T(...PLUGINS_GUIDE.sections)}
          groups={[
            {
              key: "setup",
              label: T(...PLUGINS_GUIDE.groupSetup),
              items: PLUGINS_GUIDE.steps.map((step) => ({ id: step.id, label: T(...step.title) })),
            },
            {
              key: "help",
              label: T(...PLUGINS_GUIDE.groupHelp),
              items: HELP_SECTIONS.map((id) => ({ id, label: helpTitle(id) })),
            },
          ]}
        />
        <main id="main-content" tabIndex={-1} className="docs-main">
          <div className="docs-crumbs">
            <a className="auth-link" {...screenLinkProps(go, "landing")}>
              Norulo
            </a>
            <span className="sep">/</span>
            <span className="now">{T(...PLUGINS_GUIDE.nav)}</span>
          </div>
          <h1 className="docs-h1">{T(...PLUGINS_GUIDE.title)}</h1>
          <p className="docs-lede">{T(...PLUGINS_GUIDE.intro)}</p>
          <div className="docs-callout">
            <I.Shield size={16} />
            <div>
              <b>{T(...PLUGINS_GUIDE.noDownloadTitle)}</b>
              <p>{T(...PLUGINS_GUIDE.noDownload)}</p>
            </div>
          </div>
          <section className="docs-section docs-agent-setup" aria-labelledby="setup">
            <h2 id="setup" className="docs-h2">
              {T(...PLUGINS_GUIDE.groupSetup)}
            </h2>
            <p>{T(...PLUGINS_GUIDE.interfaceNote)}</p>
            {/* The explicit role keeps list semantics with custom step markers. */}
            <ol className="docs-agent-steps" role="list">
              {PLUGINS_GUIDE.steps.map((step) => (
                <li key={step.id}>
                  <h3 id={step.id}>{T(...step.title)}</h3>
                  {step.text.map((text) => (
                    <p key={text[0]}>
                      <Linked text={T(...text)} />
                    </p>
                  ))}
                  {step.details && (
                    <DocsCode title={T(...PLUGINS_GUIDE.detailsTitle)}>{CONNECTION_DETAILS}</DocsCode>
                  )}
                  {step.examples && (
                    <ul className="docs-agent-examples" role="list">
                      {step.examples.map((example) => (
                        <li key={example[0]} className="docs-agent-prompt">
                          “{T(...example)}”
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.apiKeysLink && (
                    <a className="auth-link" {...screenLinkProps(go, "apiKeys")}>
                      {T(...step.apiKeysLink)}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <section className="docs-section">
            <h2 id="troubleshooting" className="docs-h2">
              {T(...PLUGINS_GUIDE.troubleshootingTitle)}
            </h2>
            {PLUGINS_GUIDE.troubleshooting.map((item) => (
              <div key={item.title[0]}>
                <h3>{T(...item.title)}</h3>
                <p>{T(...item.text)}</p>
              </div>
            ))}
          </section>
          <section className="docs-section">
            <h2 id="about" className="docs-h2">
              {T(...PLUGINS_GUIDE.aboutTitle)}
            </h2>
            {PLUGINS_GUIDE.about.map((text) => (
              <p key={text[0]}>{T(...text)}</p>
            ))}
          </section>
          <section className="docs-section">
            <h2 id="support" className="docs-h2">
              {T(...PLUGINS_GUIDE.supportTitle)}
            </h2>
            <p>{T(...PLUGINS_GUIDE.support)}</p>
            <div className="docs-callout">
              <I.Shield size={16} />
              <div>
                <b>{T(...PLUGINS_GUIDE.safetyTitle)}</b>
                <p>{T(...PLUGINS_GUIDE.safety)}</p>
              </div>
            </div>
          </section>
          <div className="docs-foot-actions">
            <a className="btn primary" href={`mailto:${SUPPORT_EMAIL}`}>
              {T(...PLUGINS_GUIDE.emailSupport)}
            </a>
            <a className="btn" {...screenLinkProps(go, "docs")}>
              {T("Docs", "文档")}
            </a>
          </div>
        </main>
      </div>
      <PublicFooter go={go} current="plugins" />
    </div>
  );
}
