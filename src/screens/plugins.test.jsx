import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PluginsScreen } from "./plugins.jsx";
import { PLUGINS_GUIDE } from "../locales/plugins-guide.js";
import { pathFromScreen, screenFromPath } from "../lib/navigation.js";
import { setLang } from "../i18n.jsx";

describe("Plugins page", () => {
  afterEach(() => setLang("en"));

  it("routes /plugins and links it beside API in the main navigation", () => {
    expect(pathFromScreen("plugins")).toBe("/plugins");
    expect(screenFromPath("/plugins")).toBe("plugins");
    render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const nav = document.querySelector(".lp-nav");
    const labels = within(nav).getAllByRole("link").map((link) => link.textContent);
    expect(labels.indexOf("Plugins")).toBe(labels.indexOf("API") + 1);
    expect(within(nav).getByRole("link", { name: "Plugins" })).toHaveAttribute("aria-current", "page");
  });

  it("lists the seven ChatGPT setup steps with the OAuth MCP connection details", () => {
    render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const section = screen.getByRole("heading", { level: 2, name: "Set up in ChatGPT" }).closest("section");
    expect(section.querySelector("ol").children).toHaveLength(7);
    expect(section).toHaveTextContent("Name: Norulo");
    expect(section).toHaveTextContent("MCP server URL: https://mcp.norulo.com/mcp");
    expect(section).toHaveTextContent("Authentication: OAuth");
    expect(within(section).getByRole("link", { name: "https://chatgpt.com/plugins" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/plugins"
    );
    expect(within(section).getByRole("link", { name: "Open API Keys" })).toHaveAttribute("href", "/api-keys");
    expect(within(section).getByText(/does not switch an existing ChatGPT connection/)).toBeInTheDocument();
  });

  it("guides Claude custom connector setup over the same OAuth MCP server", () => {
    render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Use Norulo with AI agents" })).toBeInTheDocument();
    const section = screen.getByRole("heading", { level: 2, name: "Set up in Claude" }).closest("section");
    const steps = [...section.querySelectorAll("ol > li > h3")].map((heading) => heading.textContent);
    expect(steps).toEqual([
      "Sign in to Norulo",
      "Open Claude connector settings",
      "Add Norulo as a custom connector",
      "Connect your Norulo account",
      "Use Norulo in a chat",
      "Optional: use Norulo in Claude Code",
      "Manage access",
    ]);
    expect(section).toHaveTextContent("Remote MCP server URL: https://mcp.norulo.com/mcp");
    expect(section).toHaveTextContent(/OAuth Client ID and OAuth Client Secret fields under “Advanced settings” empty/);
    expect(section).toHaveTextContent("claude mcp add --transport http norulo https://mcp.norulo.com/mcp");
    expect(within(section).getAllByRole("link", { name: "https://claude.ai/settings/connectors" })[0]).toHaveAttribute(
      "href",
      "https://claude.ai/settings/connectors"
    );
    expect(within(section).getByRole("link", { name: "Open API Keys" })).toHaveAttribute("href", "/api-keys");
    expect(within(section).getByText(/does not switch an existing Claude connection/)).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Plugins sections" });
    expect(within(nav).getByRole("link", { name: "Add Norulo as a custom connector" })).toHaveAttribute(
      "href",
      "#claude-add-connector"
    );
    expect(screen.getByRole("heading", { level: 3, name: "Claude cannot connect to Norulo" })).toBeInTheDocument();
  });

  it("keeps every step anchor unique across AI apps", () => {
    const ids = [...PLUGINS_GUIDE.chatgptSteps, ...PLUGINS_GUIDE.claudeSteps].map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    const { container } = render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const domIds = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(domIds).size).toBe(domIds.length);
  });

  it("offers configuration only, with no package download", () => {
    const { container } = render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    expect(container.querySelector("a[download], a[href$='.zip']")).toBeNull();
    expect(screen.queryByRole("link", { name: /download/i })).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/approved|published in/i);
    expect(screen.getByRole("link", { name: "Email support" })).toHaveAttribute(
      "href",
      "mailto:contact@norulo.com"
    );
    expect(container).toHaveTextContent("cannot charge cards, pay vendors or cancel external subscriptions");
  });

  it.each(["en", "zh", "ja", "ko", "fr", "es"])("keeps setup URLs exact in %s", (lang) => {
    setLang(lang);
    const { container } = render(<PluginsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    for (const href of ["https://norulo.com", "https://chatgpt.com/plugins", "https://claude.ai/settings/connectors"]) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
  });

  it("translates every guide string into all five non-English locales", () => {
    const pairs = [];
    const collect = (value) => {
      if (Array.isArray(value) && typeof value[0] === "string" && value[1] && typeof value[1] === "object") {
        pairs.push(value);
      } else if (value && typeof value === "object") {
        Object.values(value).forEach(collect);
      }
    };
    collect(PLUGINS_GUIDE);
    expect(pairs.length).toBeGreaterThan(40);
    for (const [, translations] of pairs) {
      expect(Object.keys(translations).sort()).toEqual(["es", "fr", "ja", "ko", "zh"]);
      Object.values(translations).forEach((text) => expect(text).toBeTruthy());
    }
  });
});
