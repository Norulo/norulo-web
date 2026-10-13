import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryPicker } from "./project-repository-picker.jsx";
import { setLang } from "../i18n.jsx";

const repositories = [
  { githubRepoId: 1, fullName: "team/web" },
  { githubRepoId: 2, fullName: "team/api" },
  { githubRepoId: 3, fullName: "team/docs" },
];

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await act(async () => setLang("en"));
});

function harness(props = {}) {
  const onSelect = props.onSelect || vi.fn();
  const onAdditionalChange = props.onAdditionalChange || vi.fn();
  const onSubmit = vi.fn((event) => event.preventDefault());
  const repos = props.repositories || repositories;
  function Example() {
    const [selected, setSelected] = useState(props.selectedRepository === null ? null : props.selectedRepository || repos[0]);
    const [additional, setAdditional] = useState(props.additionalRepoIds || [2]);
    return (
      <form onSubmit={onSubmit}>
        <ProjectRepositoryPicker
          repositories={repos}
          hasMore={props.hasMore}
          selectedRepository={selected}
          additionalRepoIds={additional}
          selectedCount={props.selectedCount ?? (selected ? 1 + additional.filter((id) => id !== selected.githubRepoId).length : 0)}
          required={props.required}
          disabled={props.disabled}
          onSelect={(id) => {
            onSelect(id);
            setSelected(repos.find((repo) => String(repo.githubRepoId) === id) || null);
          }}
          onAdditionalChange={(id, checked) => {
            onAdditionalChange(id, checked);
            setAdditional((old) => checked ? [...old, id] : old.filter((item) => item !== id));
          }}
        />
        <button type="button">Outside action</button>
        <button type="submit">Save project</button>
      </form>
    );
  }
  return { ...render(<Example />), onSelect, onAdditionalChange, onSubmit };
}

const trigger = () => screen.getByRole("combobox");
const search = () => screen.getByRole("searchbox");

describe("Project repository dropdown search", () => {
  it.each([
    ["en", "Find a repository"],
    ["zh", "查找仓库"],
    ["ja", "リポジトリを検索"],
    ["ko", "저장소 검색"],
    ["fr", "Rechercher un dépôt"],
    ["es", "Buscar un repositorio"],
  ])("puts the localized search inside the popup and focuses it in %s", async (locale, label) => {
    await act(async () => setLang(locale));
    harness({ required: true });
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-required", "true");
    fireEvent.click(trigger());
    const input = screen.getByRole("searchbox", { name: label });
    expect(input).toHaveFocus();
    expect(input.closest(".project-repository-picker-popover")).toContainElement(screen.getByRole("listbox"));
    expect(screen.getByRole("option", { name: "team/web" })).toHaveAttribute("aria-selected", "true");
  });

  it("filters only loaded dropdown choices while preserving the full additional checklist", () => {
    const { onSelect, onAdditionalChange } = harness({ hasMore: true, required: true });
    fireEvent.click(trigger());
    expect(document.getElementById(search().getAttribute("aria-describedby"))).toHaveTextContent(
      "loaded authorized repositories only",
    );
    fireEvent.change(search(), { target: { value: "  DOCS " } });
    expect(trigger()).toHaveTextContent("team/web");
    expect(screen.getByRole("option", { name: "team/web" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("option", { name: "team/api" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "team/docs" }));
    expect(onAdditionalChange).toHaveBeenCalledExactlyOnceWith(3, true);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(search(), { key: "Escape" });
    expect(trigger()).toHaveFocus();
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "team/docs" })).toBeChecked();
    fireEvent.click(trigger());
    expect(search()).toHaveValue("  DOCS ");
    fireEvent.change(search(), { target: { value: "nothing" } });
    expect(screen.getByText("No loaded repositories match this search.")).toHaveAttribute("role", "status");
    expect(search()).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(search()).toHaveFocus();
    fireEvent.change(search(), { target: { value: "" } });
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeChecked();
  });

  it("clears the search in place without closing the dropdown or changing the selection", async () => {
    const user = userEvent.setup();
    const { onSelect, onSubmit } = harness();
    await user.click(trigger());
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    await user.type(search(), "docs");
    expect(screen.queryByRole("option", { name: "team/api" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search()).toHaveValue("");
    expect(search()).toHaveFocus();
    expect(screen.getByRole("option", { name: "team/api" })).toBeInTheDocument();
    expect(search()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "team/web" }).id);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("chooses matching repositories and clears selection with keyboard without submitting the form", async () => {
    const user = userEvent.setup();
    const { onSelect, onSubmit } = harness();
    trigger().focus();
    await user.keyboard("{ArrowDown}");
    expect(search()).toHaveFocus();
    await user.type(search(), "docs");
    expect(search()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "team/docs" }).id);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("3");
    expect(trigger()).toHaveTextContent("team/docs");
    expect(trigger()).toHaveFocus();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(trigger());
    await user.clear(search());
    await user.keyboard("{Home}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("");
    expect(trigger()).toHaveTextContent("Choose a repository");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not choose or dismiss during IME composition", () => {
    const { onSelect, onSubmit } = harness();
    fireEvent.click(trigger());
    fireEvent.change(search(), { target: { value: "docs" } });
    const active = search().getAttribute("aria-activedescendant");
    for (const key of ["Enter", "ArrowUp", "Escape"]) {
      fireEvent.keyDown(search(), { key, isComposing: true });
      expect(search()).toHaveAttribute("aria-activedescendant", active);
      expect(search()).toHaveFocus();
    }
    fireEvent.keyDown(search(), { key: "Enter", keyCode: 229 });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("dismisses on Escape, outside click, and Tab while preserving outside focus", async () => {
    const user = userEvent.setup();
    const { onSelect } = harness();
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(trigger()).toHaveFocus();
    await user.click(trigger());
    const outside = screen.getByRole("button", { name: "Outside action" });
    await user.click(outside);
    expect(outside).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(trigger());
    await user.keyboard("{Tab}");
    expect(screen.getByRole("checkbox", { name: "team/api" })).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("preserves native required form validity through the accessible dropdown", async () => {
    const user = userEvent.setup();
    const { container, onSelect, onSubmit } = harness({ selectedRepository: null, additionalRepoIds: [], required: true });
    const validation = container.querySelector(".project-repository-picker-validation");
    expect(validation).toHaveAttribute("aria-hidden", "true");
    expect(validation).toHaveAttribute("tabindex", "-1");
    expect(validation).toBeRequired();
    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(search()).toHaveFocus();
    await user.click(screen.getByRole("option", { name: "team/api" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("2");
    expect(validation).toHaveValue("2");
    expect(validation.validity.valid).toBe(true);
    expect(trigger()).not.toHaveAttribute("aria-invalid");
    await user.click(screen.getByRole("button", { name: "Save project" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("closes while disabled, blocks changes, and keeps checked additions removable at the cap", () => {
    const onSelect = vi.fn();
    const onAdditionalChange = vi.fn();
    const props = {
      repositories, selectedRepository: repositories[0], additionalRepoIds: [2],
      selectedCount: 30, required: true, onSelect, onAdditionalChange,
    };
    const view = render(<ProjectRepositoryPicker {...props} />);
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "team/docs" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "team/api" }));
    expect(onAdditionalChange).toHaveBeenCalledExactlyOnceWith(2, false);
    fireEvent.click(trigger());
    view.rerender(<ProjectRepositoryPicker {...props} disabled />);
    expect(trigger()).toBeDisabled();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "team/api" })).toBeDisabled();
    expect(view.container.querySelector(".project-repository-picker-validation")).toBeDisabled();
    fireEvent.click(trigger());
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps every loaded additional repository in the existing scroll wrapper", () => {
    const many = Array.from({ length: 30 }, (_, index) => ({
      githubRepoId: index + 1,
      fullName: `team/repository-${index + 1}`,
    }));
    harness({ repositories: many, additionalRepoIds: [] });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(29);
    const list = checkboxes[0].closest(".api-scope-list");
    expect(list).not.toHaveClass("ledger-repository-list");
    expect(list.parentElement).toHaveClass("ledger-repository-list");
    fireEvent.click(trigger());
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(31);
  });

  it("repositions above the short mobile viewport after search moves its trigger", () => {
    vi.stubGlobal("innerWidth", 320);
    vi.stubGlobal("innerHeight", 480);
    vi.stubGlobal("visualViewport", undefined);
    let top = 236;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
      const currentTop = this.classList.contains("topbar") ? 0 : this.classList.contains("side") ? 424 : top;
      const height = this.classList.contains("topbar") ? 65 : 48;
      return { top: currentTop, bottom: currentTop + height, left: 0, right: 280, width: 280, height };
    });
    render(
      <div className="product-workspace">
        <div className="topbar" />
        <div className="side" />
        <ProjectRepositoryPicker
          repositories={repositories}
          selectedRepository={repositories[0]}
          additionalRepoIds={[]}
          selectedCount={1}
          onSelect={vi.fn()}
          onAdditionalChange={vi.fn()}
        />
      </div>
    );
    fireEvent.click(trigger());
    const popup = screen.getByRole("listbox").closest(".project-repository-picker-popover");
    expect(popup).toHaveAttribute("data-side", "top");
    expect(popup.style.maxHeight).toBe("159px");
    // A native search interaction can move the trigger without a timely scroll event.
    top = 225;
    fireEvent.change(search(), { target: { value: "nothing" } });
    expect(popup.style.maxHeight).toBe("148px");
  });
});
