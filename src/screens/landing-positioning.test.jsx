import { render, screen, within } from "@testing-library/react";
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
