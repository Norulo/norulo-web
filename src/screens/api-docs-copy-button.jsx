import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { I, Icon } from "../icons.jsx";
import { T, useLang } from "../i18n.jsx";

export function ApiDocsCopyButton({ mode, onModeChange, onCopy, copyState }) {
  const language = useLang();
  const [open, setOpen] = useState(false);
  const groupRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef([]);
  const menuId = useId();
  const pending = copyState === "pending";
  const options = [
    { value: "agent", label: T("Copy for Agent") },
    { value: "page", label: T("Copy Page", "复制页面") },
  ];

  useEffect(() => setOpen(false), [language, pending]);
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const group = groupRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!group || !menu) return;
      const width = menu.getBoundingClientRect().width;
      const left = Math.max(16, Math.min(group.right - width, window.innerWidth - width - 16));
      menu.style.left = `${left - group.left}px`;
      menu.style.right = "auto";
    };
    position();
    window.addEventListener("resize", position);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(position) : null;
    observer?.observe(menuRef.current);
    observer?.observe(groupRef.current);
    return () => {
      window.removeEventListener("resize", position);
      observer?.disconnect();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    optionRefs.current[mode === "agent" ? 0 : 1]?.focus({ preventScroll: true });
    const dismiss = (event) => {
      if (!groupRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, mode]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function menuKey(event) {
    const index = optionRefs.current.indexOf(document.activeElement);
    const destinations = { ArrowDown: (index + 1) % 2, ArrowUp: (index + 1) % 2, Home: 0, End: 1 };
    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      optionRefs.current[destinations[event.key]]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  return (
    <div
      className="docs-copy"
      ref={groupRef}
      data-copy-exclude
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="docs-copy-buttons">
        <button
          className="btn sm"
          type="button"
          onClick={onCopy}
          disabled={pending}
          aria-busy={pending}
        >
          {copyState === "copied" ? <I.Check size={13} /> : <I.Copy size={13} />}{" "}
          {copyState === "copied"
            ? T("Copied", "已复制")
            : options.find((option) => option.value === mode).label}
        </button>
        <button
          className="btn sm docs-copy-trigger"
          type="button"
          ref={triggerRef}
          aria-label={T("Copy options")}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          disabled={pending}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (["ArrowDown", "ArrowUp"].includes(event.key)) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <Icon d="m6 9 6 6 6-6" size={14} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div
          className="docs-copy-menu"
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={T("Copy options")}
          onKeyDown={menuKey}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={mode === option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              tabIndex={-1}
              onClick={() => {
                onModeChange(option.value);
                close();
              }}
            >
              <span>{option.label}</span>
              {mode === option.value && <I.Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
