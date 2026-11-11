import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import contract from "../data/api-contract.json";
import outline from "../data/api-contract-outline.json";

const METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];

describe("API contract outline", () => {
  it("matches the full contract's operations, order and first tags", () => {
    expect(outline.openapi).toBe(contract.openapi);
    expect(outline.info.version).toBe(contract.info.version);
    expect(Object.keys(outline.paths)).toEqual(Object.keys(contract.paths));
    for (const [path, item] of Object.entries(contract.paths)) {
      const expected = Object.fromEntries(
        Object.entries(item)
          .filter(([method]) => METHODS.includes(method))
          .map(([method, operation]) => [
            method,
            operation.tags?.length ? { tags: operation.tags.slice(0, 1) } : {},
          ])
      );
      expect(outline.paths[path], path).toEqual(expected);
    }
  });

  it("lists endpoints before the full contract loads and fills an opened endpoint after", async () => {
    vi.resetModules();
    const source = await import("./api-contract-source.js");
    const { ApiReference } = await import("./api-reference.jsx");
    expect(source.loadedApiContract()).toBeNull();
    render(<ApiReference />);
    expect(source.loadedApiContract()).toBeNull();
    const summary = [...document.querySelectorAll("summary")].find(
      (item) => item.querySelector("code")?.textContent === "/auth/session"
    );
    const details = summary.closest("details");
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(within(details).getByRole("status")).toHaveTextContent("Loading endpoint details");
    await waitFor(() =>
      expect(within(details).getByRole("heading", { name: "Authentication" })).toBeInTheDocument()
    );
    expect(source.loadedApiContract()).not.toBeNull();
    expect(screen.queryByText("Loading endpoint details…")).not.toBeInTheDocument();
  });
});
