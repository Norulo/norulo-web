import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { T, useLang } from "../i18n.jsx";
import { I, Icon } from "../icons.jsx";
import { createFrameResizeObserver } from "../lib/resize-observer.js";
import "./project-repository-picker.css";

function focusWithoutScroll(element) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

export function ProjectRepositoryPicker({
  repositories,
  hasMore,
  selectedRepository,
  additionalRepoIds,
  selectedCount,
  required = false,
  disabled,
  onSelect,
  onAdditionalChange,
}) {
  const lang = useLang();
  const fieldId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const optionRefs = useRef(new Map());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [position, setPosition] = useState({ side: "bottom", maxHeight: 380, offset: null });
  const query = search.trim().toLowerCase();
  const matchingRepositories = useMemo(
    () => repositories.filter((repo) => repo.fullName.toLowerCase().includes(query)),
    [repositories, query],
  );
  // Retain an authorized selection when the user narrows the local search.
  const primaryOptions = selectedRepository &&
      !matchingRepositories.some((repo) => repo.githubRepoId === selectedRepository.githubRepoId)
    ? [selectedRepository, ...matchingRepositories]
    : matchingRepositories;
  const options = [null, ...primaryOptions];
  const visible = open && !disabled;
  // Search belongs to the dropdown; the separate checklist keeps every choice visible.
  const additionalOptions = repositories.filter(
    (repo) => repo.githubRepoId !== selectedRepository?.githubRepoId,
  );
  const selectedId = selectedRepository ? String(selectedRepository.githubRepoId) : "";
  const selectedIndex = Math.max(0, options.findIndex((repo) =>
    repo ? String(repo.githubRepoId) === selectedId : !selectedId,
  ));
  const active = Math.min(activeIndex, options.length - 1);
  const listId = `${fieldId}-listbox`;
  const guidanceId = `${fieldId}-guidance`;
  const optionId = (index) => `${fieldId}-option-${index}`;

  function close(restoreFocus = true) {
    setOpen(false);
    // Keep the query for reopening the dropdown.
    if (restoreFocus && !disabled) focusWithoutScroll(triggerRef.current);
  }

  function show(index = selectedIndex) {
    if (disabled) return;
    setActiveIndex(index);
    setOpen(true);
  }

  function choose(index) {
    if (disabled || index < 0 || index >= options.length) return;
    const value = options[index] ? String(options[index].githubRepoId) : "";
    if (value !== selectedId) onSelect(value);
    setInvalid(false);
    close();
  }

  function navigate(event, fromSearch = false) {
    if (disabled || event.isComposing || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      if (fromSearch && search && ["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)));
      if (!visible) show(["Home", "End"].includes(event.key) ? next : undefined);
      else setActiveIndex(next);
    } else if (event.key === "Enter" || (!fromSearch && event.key === " ")) {
      event.preventDefault();
      if (visible) choose(active);
      else show();
    }
  }

  useEffect(() => {
    setOpen(false);
    setInvalid(false);
  }, [selectedId, disabled, required]);

  useEffect(() => {
    if (!visible) return undefined;
    const dismiss = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        // A clicked control takes focus normally after pointerdown.
        if (rootRef.current?.contains(document.activeElement)) focusWithoutScroll(triggerRef.current);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      const anchor = rootRef.current?.getBoundingClientRect();
      if (!rect || !anchor) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const viewportBottom = top + (viewport?.height || window.innerHeight);
      const dock = window.innerWidth <= 760 ? document.querySelector(".product-workspace .side") : null;
      const dockTop = dock?.getBoundingClientRect().top;
      const bottom = Number.isFinite(dockTop) && dockTop > top
        ? Math.min(viewportBottom, dockTop) : viewportBottom;
      const headerBottom = document.querySelector(".product-workspace .topbar")?.getBoundingClientRect().bottom;
      const visibleTop = Number.isFinite(headerBottom) && headerBottom > top
        ? Math.min(bottom, headerBottom) : top;
      const safeTop = visibleTop + 8;
      const safeBottom = Math.max(safeTop, bottom - 8);
      const upperEdge = Math.max(safeTop, Math.min(rect.top - 4, safeBottom));
      const lowerEdge = Math.min(safeBottom, Math.max(rect.bottom + 4, safeTop));
      const above = upperEdge - safeTop;
      const below = safeBottom - lowerEdge;
      const side = below < 240 && above > below ? "top" : "bottom";
      setPosition({
        side,
        maxHeight: Math.max(1, Math.min(420, side === "top" ? above : below)),
        offset: side === "top" ? anchor.bottom - upperEdge : lowerEdge - anchor.top,
      });
    };
    measure();
    // WebKit may finish native search-focus scrolling after the first measure.
    const frame = window.requestAnimationFrame?.(measure);
    const observer = createFrameResizeObserver(measure);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    const form = rootRef.current?.closest("form");
    if (form) observer?.observe(form);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [visible, search, lang]);

  useLayoutEffect(() => {
    if (visible) focusWithoutScroll(searchRef.current);
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible) return;
    const list = listRef.current;
    const option = optionRefs.current.get(active);
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [visible, active, matchingRepositories, selectedId, position.maxHeight, lang]);

  return (
    <>
      <div className="ledger-field">
        <label htmlFor={`${fieldId}-repository`}>{T("Repository")}</label>
        <div
          className="project-repository-picker"
          ref={rootRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) close(false);
          }}
          onKeyDown={(event) => {
            if (visible && event.key === "Escape" && !event.isComposing && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <button
            type="button"
            className="project-repository-picker-trigger"
            id={`${fieldId}-repository`}
            ref={triggerRef}
            role="combobox"
            aria-label={T("Repository")}
            aria-haspopup="listbox"
            aria-expanded={visible}
            aria-controls={visible ? listId : undefined}
            aria-activedescendant={visible && active >= 0 ? optionId(active) : undefined}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            onClick={() => visible ? close() : show()}
            onKeyDown={(event) => navigate(event)}
          >
            <span className={selectedRepository ? "project-repository-picker-value" : "project-repository-picker-placeholder"}>
              {selectedRepository?.fullName || T("Choose a repository", "选择仓库")}
            </span>
            <Icon d="m6 9 6 6 6-6" size={16} aria-hidden="true" />
          </button>
          {/* Preserve native required-form validation without a second exposed control. */}
          <select
            className="project-repository-picker-validation"
            aria-hidden="true"
            tabIndex={-1}
            value={selectedId}
            required={required}
            disabled={disabled}
            onChange={() => {}}
            onInvalid={(event) => {
              event.preventDefault();
              setInvalid(true);
              show();
            }}
          >
            <option value="">{T("Choose a repository", "选择仓库")}</option>
            {selectedRepository && <option value={selectedId}>{selectedRepository.fullName}</option>}
          </select>
          {visible && (
            <div
              className="project-repository-picker-popover"
              data-side={position.side}
              style={{
                maxHeight: `${position.maxHeight}px`,
                ...(position.offset === null ? {} : position.side === "top"
                  ? { top: "auto", bottom: `${position.offset}px` }
                  : { top: `${position.offset}px`, bottom: "auto" }),
              }}
            >
              <div className="project-repository-picker-search">
                <I.Search size={16} aria-hidden="true" />
                <input
                  id={`${fieldId}-search`}
                  ref={searchRef}
                  type="search"
                  aria-label={T("Find a repository", "查找仓库")}
                  placeholder={T("Find a repository", "查找仓库")}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={search}
                  aria-describedby={guidanceId}
                  aria-controls={listId}
                  aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                  onChange={(event) => {
                    const value = event.target.value;
                    const nextQuery = value.trim().toLowerCase();
                    const firstMatch = repositories.find((repo) => repo.fullName.toLowerCase().includes(nextQuery));
                    const retainedSelection = selectedRepository &&
                      !selectedRepository.fullName.toLowerCase().includes(nextQuery);
                    setSearch(value);
                    // Enter after typing chooses a match, never the empty selection.
                    setActiveIndex(firstMatch ? (retainedSelection ? 2 : 1) : -1);
                  }}
                  onKeyDown={(event) => navigate(event, true)}
                />
                {search && (
                  <button
                    type="button"
                    className="btn ghost sm project-repository-picker-clear"
                    aria-label={T("Clear search", "清除搜索")}
                    title={T("Clear search", "清除搜索")}
                    // Keep focus in the search field so the dropdown stays open.
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const index = selectedRepository
                        ? repositories.findIndex((repo) => repo.githubRepoId === selectedRepository.githubRepoId)
                        : -1;
                      setSearch("");
                      setActiveIndex(selectedRepository ? Math.max(0, index) + 1 : 0);
                      focusWithoutScroll(searchRef.current);
                    }}
                  >
                    <I.X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              {query && matchingRepositories.length === 0 && (
                <p className="project-repository-picker-empty" role="status">{T("No loaded repositories match this search.")}</p>
              )}
              <ul className="project-repository-picker-options" id={listId} ref={listRef} role="listbox" aria-label={T("Repository")}>
                {options.map((repo, index) => (
                  <li
                    key={repo?.githubRepoId ?? "empty"}
                    id={optionId(index)}
                    ref={(node) => {
                      if (node) optionRefs.current.set(index, node);
                      else optionRefs.current.delete(index);
                    }}
                    className={"project-repository-picker-option" + (repo ? "" : " is-empty") + (active === index ? " is-active" : "")}
                    role="option"
                    aria-selected={selectedIndex === index}
                    onPointerMove={(event) => {
                      if (event.pointerType !== "touch") setActiveIndex(index);
                    }}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => choose(index)}
                  >
                    <span>{repo?.fullName || T("Choose a repository", "选择仓库")}</span>
                    {selectedIndex === index && <I.Check size={16} aria-hidden="true" />}
                  </li>
                ))}
              </ul>
              <p className="project-repository-picker-guidance" id={guidanceId}>
                {hasMore
                  ? T("Search applies to loaded authorized repositories only. Load more repositories to include the next page.")
                  : T("Search the loaded authorized repositories. Selected repositories stay selected when you search.")}
              </p>
            </div>
          )}
        </div>
      </div>
      {selectedRepository && repositories.length > 1 && (
        <fieldset className="api-scope-panel">
          <legend>{T("Additional repositories (optional)", "其他仓库（选填）")}</legend>
          <div className="ledger-repository-list">
            <div className="api-scope-list">
              {additionalOptions.map((repo) => (
                <label className="api-scope-row" key={repo.githubRepoId}>
                  <input
                    type="checkbox"
                    checked={additionalRepoIds.includes(repo.githubRepoId)}
                    disabled={disabled || (selectedCount >= 30 && !additionalRepoIds.includes(repo.githubRepoId))}
                    onChange={(event) => onAdditionalChange(repo.githubRepoId, event.target.checked)}
                  />
                  <span className="api-scope-copy"><span>{repo.fullName}</span></span>
                </label>
              ))}
            </div>
          </div>
          <p className="ledger-help" role="status" aria-live="polite" aria-atomic="true">
            {selectedCount} / 30 {T("repositories", "个仓库")}
          </p>
        </fieldset>
      )}
    </>
  );
}
