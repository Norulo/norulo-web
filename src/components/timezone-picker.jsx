import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { T, useLang } from "../i18n.jsx";
import { I, Icon } from "../icons.jsx";
import { createFrameResizeObserver } from "../lib/resize-observer.js";
import { availableTimezones, isValidTimezone, normalizeTimezone } from "../lib/timezones.js";
import { TIMEZONE_PICKER_COPY } from "../locales/timezone-picker.js";
import "./timezone-picker.css";

const copy = (key) => T(...TIMEZONE_PICKER_COPY[key]);
function focusWithoutScroll(element) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

export function TimezonePicker({ id, label, value, onChange, disabled = false, required = false }) {
  const lang = useLang();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const customRef = useRef(null);
  const optionRefs = useRef(new Map());
  const zones = useMemo(() => availableTimezones(value), [value]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [position, setPosition] = useState({ side: "bottom", maxHeight: 380, offset: null });
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase().replaceAll(" ", "_");
    return zones.filter((zone) => zone.toLowerCase().includes(search));
  }, [zones, query]);
  const customIndex = filtered.length;
  const active = Math.min(activeIndex, customIndex);
  const visible = open && !disabled;
  const listVisible = visible && !customOpen;
  const listId = `${id}-listbox`;
  const codeId = `${id}-custom-code`;
  const helpId = `${id}-custom-help`;
  const errorId = `${id}-custom-error`;
  const optionId = (index) => `${id}-option-${index}`;
  const customValue = draft.trim();
  const canonical = normalizeTimezone(customValue);
  const customSelection = customValue && customValue === value ? value : canonical
    ? zones.find((zone) => zone.toLowerCase() === canonical.toLowerCase()) || canonical : null;
  const validCustom = Boolean(customSelection);

  function close(restoreFocus = true) {
    setOpen(false);
    setCustomOpen(false);
    setDraft("");
    setQuery("");
    if (restoreFocus && !disabled) focusWithoutScroll(triggerRef.current);
  }
  function show(index) {
    if (disabled) return;
    const selected = zones.indexOf(value);
    setActiveIndex(index ?? Math.max(0, selected));
    setCustomOpen(false);
    setDraft("");
    setQuery("");
    setOpen(true);
  }
  function commit(zone) {
    if (disabled || !zone || (zone !== value && !isValidTimezone(zone))) return;
    onChange(zone);
    close();
  }
  function choose(index) {
    if (disabled) return;
    if (index === customIndex) {
      setDraft(typeof value === "string" ? value : "");
      setCustomOpen(true);
    } else if (filtered[index]) commit(filtered[index]);
  }
  function navigate(event, fromSearch = false) {
    if (disabled || event.isComposing || event.nativeEvent.isComposing) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      if (fromSearch && query && ["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? customIndex
        : Math.max(0, Math.min(customIndex, active + (event.key === "ArrowDown" ? 1 : -1)));
      if (!visible) show(["Home", "End"].includes(event.key) ? next : undefined);
      else setActiveIndex(next);
    } else if (event.key === "Enter" || (!fromSearch && event.key === " ")) {
      event.preventDefault();
      if (listVisible) choose(active);
      else if (!visible) show();
    }
  }

  useEffect(() => {
    setOpen(false);
    setCustomOpen(false);
    setDraft("");
    setQuery("");
  }, [value, disabled]);
  useEffect(() => {
    if (!visible) return undefined;
    const dismiss = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setCustomOpen(false);
        setDraft("");
        setQuery("");
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
    const observer = createFrameResizeObserver(measure);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [visible, customOpen]);
  useLayoutEffect(() => {
    if (visible) focusWithoutScroll(customOpen ? customRef.current : searchRef.current);
  }, [visible, customOpen]);
  useLayoutEffect(() => {
    if (!listVisible) return;
    const list = listRef.current;
    const option = optionRefs.current.get(active);
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [listVisible, active, filtered, position.maxHeight, lang]);

  return (
    <div
      className="timezone-picker"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close(false);
      }}
      onKeyDown={(event) => {
        if (visible && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        className="timezone-picker-trigger"
        id={id}
        ref={triggerRef}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={visible}
        aria-controls={listVisible ? listId : undefined}
        aria-activedescendant={listVisible ? optionId(active) : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => visible ? close() : show()}
        onKeyDown={(event) => navigate(event)}
      >
        <span className={value ? "timezone-picker-value" : "timezone-picker-placeholder"}>{value || copy("choose")}</span>
        <Icon d="m6 9 6 6 6-6" size={16} aria-hidden="true" />
      </button>
      {visible && (
        <div
          className="timezone-picker-popover"
          data-side={position.side}
          style={{
            maxHeight: `${position.maxHeight}px`,
            ...(position.offset === null ? {} : position.side === "top"
              ? { top: "auto", bottom: `${position.offset}px` }
              : { top: `${position.offset}px`, bottom: "auto" }),
          }}
        >
          {listVisible && (
            <>
              <div className="timezone-picker-search">
                <label htmlFor={`${id}-search`}>{copy("search")}</label>
                <input
                  id={`${id}-search`}
                  ref={searchRef}
                  type="search"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={query}
                  aria-controls={listId}
                  aria-activedescendant={optionId(active)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => navigate(event, true)}
                />
              </div>
              {!filtered.length && <p className="timezone-picker-empty" role="status">{copy("empty")}</p>}
              <ul className="timezone-picker-options" id={listId} ref={listRef} role="listbox" aria-label={label}>
                {[...filtered, null].map((zone, index) => (
                  <li
                    key={zone || "custom"}
                    id={optionId(index)}
                    ref={(node) => {
                      if (node) optionRefs.current.set(index, node);
                      else optionRefs.current.delete(index);
                    }}
                    className={"timezone-picker-option" + (active === index ? " is-active" : "")}
                    role="option"
                    aria-selected={zone !== null && zone === value}
                    onPointerMove={(event) => {
                      if (event.pointerType !== "touch") setActiveIndex(index);
                    }}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => choose(index)}
                  >
                    <span>{zone || copy("custom")}</span>
                    {zone !== null && zone === value && <I.Check size={16} aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            </>
          )}
          {customOpen && (
            <div className="timezone-picker-custom" role="group" aria-label={copy("code")}>
              <button className="btn" type="button" onClick={() => setCustomOpen(false)}>{copy("back")}</button>
              <label htmlFor={codeId}>{copy("code")}</label>
              <input
                id={codeId}
                ref={customRef}
                type="text"
                maxLength={100}
                pattern="[A-Za-z0-9_+./-]+"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby={`${helpId}${customValue && !validCustom ? ` ${errorId}` : ""}`}
                aria-invalid={Boolean(customValue && !validCustom) || undefined}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!event.isComposing && !event.nativeEvent.isComposing) commit(customSelection);
                  }
                }}
              />
              <p id={helpId}>{copy("help")}</p>
              {customValue && !validCustom && <p id={errorId} role="status">{copy("invalid")}</p>}
              <button className="btn" type="button" disabled={disabled || !validCustom} onClick={() => commit(customSelection)}>{copy("use")}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
