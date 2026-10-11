import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ProjectsList } from "./projects-list.jsx";
import { setLang, T } from "../i18n.jsx";

const projects = [
  { id: "active", name: "Platform", description: "Hosting costs", status: "active", totals: [] },
  { id: "archived", name: "Old service", description: "Retired tools", status: "archived", totals: [] },
];
const Total = () => null;
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  return setLang("en");
});

describe("Projects list filtering and announcements", () => {
  it("updates memoized row copy when the selected locale catalog finishes loading", async () => {
    const addListener = vi.spyOn(window, "addEventListener");
    render(<ProjectsList
      page={{ items: projects, nextCursor: null }}
      go={vi.fn()}
      labelForProject={(project) => project.name}
      Total={Total}
      onLoadMore={vi.fn()}
    />);
    const row = screen.getByRole("link", { name: "Platform" }).closest("article");
    expect(row).toHaveTextContent("No expenses");
    expect(addListener.mock.calls.filter(([name]) => name === "nr-langchange")).toHaveLength(1);
    let localeReady;
    act(() => { localeReady = setLang("zh"); });
    await act(async () => { await localeReady; });
    expect(T("No expenses")).not.toBe("No expenses");
    expect(row).toHaveTextContent(T("No expenses"));
  });
  it("indexes names once, searches only loaded records, and retains explicit pagination with no matches", () => {
    const labelForProject = vi.fn((project) => project.name);
    const onLoadMore = vi.fn();
    render(<ProjectsList
      page={{ items: projects, nextCursor: "next" }}
      go={vi.fn()}
      labelForProject={labelForProject}
      Total={Total}
      onLoadMore={onLoadMore}
    />);
    const search = screen.getByRole("searchbox", { name: "Find a project" });
    expect(document.getElementById(search.getAttribute("aria-describedby"))).toHaveTextContent(
      "apply to loaded projects only",
    );
    const list = screen.getByRole("list", { name: "Projects" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(labelForProject).toHaveBeenCalledTimes(2);
    fireEvent.change(search, { target: { value: "Hosting" } });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(document.querySelector(".ledger-project-results-count")).toHaveTextContent("Showing 1 of 2 loaded projects.");
    fireEvent.change(search, { target: { value: "Unknown" } });
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
    expect(labelForProject).toHaveBeenCalledTimes(2);
    expect(onLoadMore).not.toHaveBeenCalled();
    const loadMore = screen.getByRole("button", { name: "Load more projects" });
    expect(loadMore).toBeEnabled();
    fireEvent.click(loadMore);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search).toHaveFocus();
    fireEvent.change(screen.getByRole("combobox", { name: "Project status" }), {
      target: { value: "archived" },
    });
    expect(screen.getByRole("link", { name: "Old service" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Platform" })).not.toBeInTheDocument();
    expect(labelForProject).toHaveBeenCalledTimes(2);
  });

  it("shows filtering results immediately and announces only the settled search count", () => {
    vi.useFakeTimers();
    const { unmount } = render(<ProjectsList
      page={{ items: projects, nextCursor: null }}
      go={vi.fn()}
      labelForProject={(project) => project.name}
      Total={Total}
      onLoadMore={vi.fn()}
    />);
    const search = screen.getByRole("searchbox", { name: "Find a project" });
    const announcement = screen.getByRole("status");
    const visualCount = document.querySelector(".ledger-project-results-count");
    expect(announcement).toHaveTextContent("Showing 2 of 2 loaded projects.");
    fireEvent.change(search, { target: { value: "Hosting" } });
    expect(visualCount).toHaveTextContent("Showing 1 of 2 loaded projects.");
    expect(announcement).toHaveTextContent("Showing 2 of 2 loaded projects.");
    act(() => vi.advanceTimersByTime(300));
    fireEvent.change(search, { target: { value: "Unknown" } });
    expect(visualCount).toHaveTextContent("Showing 0 of 2 loaded projects.");
    expect(screen.getByRole("heading", { name: "No matching projects", level: 2 })).toBeVisible();
    act(() => vi.advanceTimersByTime(399));
    expect(announcement).toHaveTextContent("Showing 2 of 2 loaded projects.");
    // Continuing to type must postpone the announcement even when the count
    // stays at zero throughout the later keystrokes.
    fireEvent.change(search, { target: { value: "Unknown project" } });
    act(() => vi.advanceTimersByTime(399));
    expect(announcement).toHaveTextContent("Showing 2 of 2 loaded projects.");
    act(() => vi.advanceTimersByTime(1));
    expect(announcement).toHaveTextContent("Showing 0 of 2 loaded projects.");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(visualCount).toHaveTextContent("Showing 2 of 2 loaded projects.");
    expect(announcement).toHaveTextContent("Showing 0 of 2 loaded projects.");
    unmount();
    act(() => vi.runOnlyPendingTimers());
  });

  it("includes explicitly loaded pages in the current local search and retains its scope description", () => {
    const props = {
      go: vi.fn(),
      labelForProject: (project) => project.name,
      Total,
      onLoadMore: vi.fn(),
    };
    const { rerender } = render(<ProjectsList {...props} page={{ items: projects, nextCursor: "next" }} />);
    const search = screen.getByRole("searchbox", { name: "Find a project" });
    fireEvent.change(search, { target: { value: "Later page" } });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Load more projects" }));
    expect(props.onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<ProjectsList {...props} page={{
      items: [...projects, { ...projects[0], id: "later", name: "Later page project" }],
      nextCursor: null,
    }} />);
    expect(search).toHaveValue("Later page");
    expect(screen.getByRole("link", { name: "Later page project" })).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(document.querySelector(".ledger-project-results-count")).toHaveTextContent("Showing 1 of 3 loaded projects.");
    expect(screen.queryByRole("button", { name: "Load more projects" })).not.toBeInTheDocument();
    expect(document.getElementById(search.getAttribute("aria-describedby"))).toHaveTextContent("loaded list");
    expect(props.onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("shows safe product destinations, placeholders and archived labels without adding row navigation", () => {
    const go = vi.fn();
    render(<ProjectsList
      page={{ items: [
        { ...projects[0], productUrl: "https://docs.example.com:8443/product?view=1#start" },
        projects[1],
        { ...projects[0], id: "invalid", name: "Invalid link", productUrl: "javascript:alert(1)" },
      ], nextCursor: null }}
      go={go}
      labelForProject={(project) => project.name}
      Total={Total}
      onLoadMore={vi.fn()}
    />);
    const product = screen.getByRole("link", { name: "docs.example.com:8443" });
    expect(product).toHaveAttribute("href", "https://docs.example.com:8443/product?view=1#start");
    expect(product).toHaveAttribute("target", "_blank");
    expect(product).toHaveAttribute("rel", "noopener noreferrer");
    const archivedRow = screen.getByRole("link", { name: "Old service" }).closest("article");
    expect(archivedRow).toHaveClass("ledger-project-row-archived");
    expect(within(archivedRow).getByText("Archived project")).toHaveClass("ledger-project-archived");
    expect(within(archivedRow).getByText("—")).toHaveClass("ledger-project-product-empty");
    const invalidRow = screen.getByRole("link", { name: "Invalid link" }).closest("article");
    expect(within(invalidRow).getByText("—")).toBeInTheDocument();
    fireEvent.click(archivedRow);
    expect(go).not.toHaveBeenCalled();
    expect(screen.getAllByRole("list", { name: "Projects" })).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Projects" })).not.toBeInTheDocument();
    const search = screen.getByRole("searchbox", { name: "Find a project" });
    const guidance = document.getElementById(search.getAttribute("aria-describedby"));
    expect(guidance).toHaveClass("ledger-project-sr-only");
    expect(guidance).toHaveTextContent("Search project names and descriptions in the loaded list.");
  });

  it("announces retained loading results and blocks filtering and internal navigation during writes", () => {
    const props = {
      page: { items: projects, nextCursor: "next" },
      go: vi.fn(),
      labelForProject: (project) => project.name,
      Total,
      onLoadMore: vi.fn(),
    };
    const { rerender } = render(<ProjectsList {...props} />);
    const search = screen.getByRole("searchbox", { name: "Find a project" });
    fireEvent.change(search, { target: { value: "Platform" } });
    rerender(<ProjectsList {...props} loading paginationDisabled />);
    expect(screen.getByRole("status")).toHaveTextContent("Updating projects…");
    expect(document.getElementById(search.getAttribute("aria-controls"))).toHaveAttribute("aria-busy", "true");
    expect(search).toBeEnabled();
    expect(screen.getByRole("button", { name: "Load more projects" })).toBeDisabled();
    rerender(<ProjectsList {...props} writing paginationDisabled />);
    expect(search).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Project status" })).toBeDisabled();
    const project = screen.getByText("Platform").closest("a");
    expect(project).not.toHaveAttribute("href");
    fireEvent.click(project);
    expect(props.go).not.toHaveBeenCalled();
  });
});
