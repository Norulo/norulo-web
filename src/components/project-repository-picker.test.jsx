import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectRepositoryPicker } from "./project-repository-picker.jsx";

const repositories = [
  { githubRepoId: 1, fullName: "team/web" },
  { githubRepoId: 2, fullName: "team/api" },
  { githubRepoId: 3, fullName: "team/docs" },
];

describe("Project repository local search", () => {
  it("retains authorized selections while filtering loaded primary and additional choices", () => {
    const onSelect = vi.fn();
    const onAdditionalChange = vi.fn();
    render(<ProjectRepositoryPicker
      repositories={repositories}
      hasMore
      selectedRepository={repositories[0]}
      additionalRepoIds={[2]}
      selectedCount={2}
      required
      onSelect={onSelect}
      onAdditionalChange={onAdditionalChange}
    />);
    const search = screen.getByRole("searchbox", { name: "Find a repository" });
    const picker = screen.getByRole("combobox", { name: "Repository" });
    expect(picker).toHaveValue("1");
    expect(picker).toBeRequired();
    expect(document.getElementById(search.getAttribute("aria-describedby"))).toHaveTextContent(
      "loaded authorized repositories only",
    );
    fireEvent.change(search, { target: { value: "docs" } });
    expect(picker).toHaveValue("1");
    expect(screen.getByRole("option", { name: "team/web" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "team/api" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "team/api" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "team/docs" }));
    expect(onAdditionalChange).toHaveBeenCalledWith(3, true);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.change(search, { target: { value: "nothing" } });
    expect(picker).toHaveValue("1");
    expect(screen.getByText("No loaded repositories match this search.")).toBeVisible();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeChecked();
  });

  it("scrolls every loaded repository inside a wrapper around the equal-row list", () => {
    const many = Array.from({ length: 30 }, (_, index) => ({
      githubRepoId: index + 1,
      fullName: `team/repository-${index + 1}`,
    }));
    render(<ProjectRepositoryPicker
      repositories={many}
      selectedRepository={many[0]}
      additionalRepoIds={[]}
      selectedCount={1}
      onSelect={vi.fn()}
      onAdditionalChange={vi.fn()}
    />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(29);
    const list = checkboxes[0].closest(".api-scope-list");
    // The height cap belongs to the scroll wrapper, never to the 1fr grid itself.
    expect(list).not.toHaveClass("ledger-repository-list");
    expect(list.parentElement).toHaveClass("ledger-repository-list");
    expect(list.querySelectorAll(".api-scope-row")).toHaveLength(29);
  });
});
