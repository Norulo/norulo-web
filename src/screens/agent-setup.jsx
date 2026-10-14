import { T } from "../i18n.jsx";
import { AGENT_GUIDE } from "../locales/agent-guide.js";
import { DocsCode } from "./docs-layout.jsx";

export const agentEnvironmentExample = [
  "# Bash: run in the environment your Coding Agent will inherit.",
  "# Skip key input if your secure runtime already provides NORULO_API_KEY.",
  "export NORULO_API_BASE='https://api.norulo.com'",
  "read -r -s -p 'Norulo API key: ' NORULO_API_KEY",
  "printf '\\n'",
  "export NORULO_API_KEY",
].join("\n");

export function agentSetupMarkdown() {
  return [
    `## ${T(...AGENT_GUIDE.title)}`,
    T(...AGENT_GUIDE.intro),
    ...AGENT_GUIDE.steps.flatMap((step, index) => [
      `${index + 1}. **${T(...step.title)}** — ${T(...step.text)}`,
      ...(step.href ? [`[${T(...step.label)}](https://norulo.com${step.href})`] : []),
    ]),
    "```sh", agentEnvironmentExample, "```",
    `### ${T(...AGENT_GUIDE.modelTitle)}`, T(...AGENT_GUIDE.model),
    `### ${T(...AGENT_GUIDE.promptTitle)}`, T(...AGENT_GUIDE.prompt),
  ].join("\n\n");
}

export function AgentSetupGuide() {
  return (
    <section className="docs-section docs-agent-setup" aria-labelledby="agent-setup">
      <h2 id="agent-setup" className="docs-h2">{T(...AGENT_GUIDE.title)}</h2>
      <p>{T(...AGENT_GUIDE.intro)}</p>
      {/* The explicit role keeps list semantics with custom step markers. */}
      <ol className="docs-agent-steps" role="list">
        {AGENT_GUIDE.steps.map((step) => (
          <li key={step.title[0]}>
            <h3>{T(...step.title)}</h3>
            <p>{T(...step.text)}</p>
            {step.href && <a className="auth-link" href={step.href}>{T(...step.label)}</a>}
          </li>
        ))}
      </ol>
      <DocsCode>{agentEnvironmentExample}</DocsCode>
      <h3>{T(...AGENT_GUIDE.modelTitle)}</h3>
      <p>{T(...AGENT_GUIDE.model)}</p>
      <h3>{T(...AGENT_GUIDE.promptTitle)}</h3>
      <p className="docs-agent-prompt">{T(...AGENT_GUIDE.prompt)}</p>
    </section>
  );
}
