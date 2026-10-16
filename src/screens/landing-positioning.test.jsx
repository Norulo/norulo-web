import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingScreen } from "./public.jsx";

describe("landing positioning", () => {
  it("explains the product, outcome, and next step without internal implementation jargon", () => {
    render(<LandingScreen go={vi.fn()} auth={{ authenticated: false }} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /track project and shared expenses.*keep every cost in view/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/record project and shared costs/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see pricing/i })).toHaveAttribute("href", "/pricing");

    const pipeline = screen.getByRole("region", {
      name: /how norulo organizes costs/i,
    });
    expect(within(pipeline).getAllByRole("article")).toHaveLength(6);
    expect(screen.getByText("Create projects")).toBeInTheDocument();
    expect(screen.getByText("Record project expenses")).toBeInTheDocument();
    expect(screen.getByText("Record shared expenses")).toBeInTheDocument();
    expect(screen.getByText("Review category reports")).toBeInTheDocument();
    expect(screen.getByText("Compare currencies separately")).toBeInTheDocument();
    expect(screen.getByText("Control API access")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Let your Coding Agent organize expenses." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Follow the Agent setup guide" })).toHaveAttribute("href", "/developers/docs#agent-setup");
    expect(screen.getByRole("link", { name: "Open API · Copy for Agent" })).toHaveAttribute("href", "/developers/api#overview");
  });

  it("spotlights the MCP connector before the Coding Agent panel", () => {
    render(<LandingScreen go={vi.fn()} auth={{ authenticated: false }} />);

    const plugins = screen.getByRole("region", { name: "Ask about your expenses with AI agents." });
    const agent = screen.getByRole("region", { name: "Let your Coding Agent organize expenses." });
    const capabilities = screen.getByRole("region", { name: /how norulo organizes costs/i });
    expect(capabilities.compareDocumentPosition(plugins) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(plugins.compareDocumentPosition(agent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(plugins).getByRole("link", { name: "Set up Norulo in your AI agent" })).toHaveAttribute("href", "/plugins");
    expect(within(plugins).getByRole("link", { name: "Claude setup" })).toHaveAttribute("href", "/plugins#claude");
    expect(within(plugins).getByRole("link", { name: "ChatGPT setup" })).toHaveAttribute("href", "/plugins#chatgpt");
    expect(within(plugins).getByRole("link", { name: "Troubleshooting" })).toHaveAttribute("href", "/plugins#troubleshooting");
    expect(within(plugins).queryByRole("link", { name: /download/i })).toBeNull();
    expect(plugins).toHaveTextContent("https://mcp.norulo.com/mcp");
    expect(plugins).toHaveTextContent("Claude · ChatGPT · Codex");
    expect(within(plugins).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Ask in plain language",
      "You decide what it can access",
      "No API key to copy",
    ]);
    const chat = within(plugins).getByRole("figure", { name: "Example conversation" });
    expect(chat).toHaveTextContent("getLedgerSummary");
    expect(chat).toHaveTextContent("USD 44.00");
    expect(chat).toHaveTextContent("EUR 49.00");
  });

  it("copies the MCP server URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<LandingScreen go={vi.fn()} auth={{ authenticated: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy the MCP server URL" }));
    expect(writeText).toHaveBeenCalledWith("https://mcp.norulo.com/mcp");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("leads the capabilities with the three-step core flow", () => {
    render(<LandingScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const capabilities = screen.getByRole("region", { name: /how norulo organizes costs/i });
    const steps = within(capabilities).getAllByRole("list")[0];
    expect(within(steps).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Create projects",
      "Record project expenses",
      "Record shared expenses",
    ]);
    expect(within(capabilities).getByRole("heading", { name: "Also included" })).toBeInTheDocument();
  });

  it("leads with the product and places Coding Agent setup after the capabilities", () => {
    render(<LandingScreen go={vi.fn()} auth={{ authenticated: false }} />);

    const hero = screen.getByRole("region", { name: /track project and shared expenses/i });
    expect(within(hero).getAllByRole("link").map((link) => link.textContent.trim())).toEqual([
      "Start with email",
      "See pricing",
    ]);
    expect(within(hero).queryByText(/coding agent/i)).not.toBeInTheDocument();

    const regions = screen.getAllByRole("region").map((region) => region.getAttribute("aria-labelledby"));
    expect(regions).toEqual([
      "lp-title",
      "lp-preview-title",
      "lp-capabilities-title",
      "lp-plugins-title",
      "lp-agent-title",
      "lp-cta-title",
    ]);

    const example = screen.getByRole("region", { name: "Example ledger" });
    expect(within(example).getAllByRole("listitem")).toHaveLength(6);
    expect(example).toHaveTextContent("Shared pool");
    expect(example).toHaveTextContent("USD 44.00");
    expect(example).toHaveTextContent("EUR 49.00");
  });
});
