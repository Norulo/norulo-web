import { useEffect, useId, useRef, useState } from "react";
import { I } from "../icons.jsx";

// A heading becomes current once it reaches this distance from the viewport
// top; the sticky phone section bar sits inside the same band.
const ACTIVE_OFFSET = 112;

function currentSection(ids) {
  // At the end of the page, short final sections cannot reach the offset, so
  // any heading in the upper part of the viewport counts.
  const atEnd =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const limit = atEnd ? window.innerHeight * 0.6 : ACTIVE_OFFSET;
  let active = ids[0];
  for (const id of ids) {
    const heading = document.getElementById(id);
    if (!heading) continue;
    if (heading.getBoundingClientRect().top > limit) break;
    active = id;
  }
  return active;
}

function useCurrentSection(ids) {
  const key = ids.join(" ");
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const list = key.split(" ");
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(currentSection(list));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key]);
  return active;
}

// Keeps the current link inside the sidebar's own scroll area without
// scrolling the page itself.
function revealLink(container, link) {
  const box = container.getBoundingClientRect();
  const rect = link.getBoundingClientRect();
  const margin = 16;
  if (container.scrollHeight > container.clientHeight + 1) {
    if (rect.top < box.top) container.scrollTop += rect.top - box.top - margin;
    else if (rect.bottom > box.bottom) container.scrollTop += rect.bottom - box.bottom + margin;
  }
  if (container.scrollWidth > container.clientWidth + 1) {
    if (rect.left < box.left) container.scrollLeft += rect.left - box.left - margin;
    else if (rect.right > box.right) container.scrollLeft += rect.right - box.right + margin;
  }
}

export function DocsSideNav({ label, groups }) {
  const idPrefix = useId();
  const sideRef = useRef(null);
  const active = useCurrentSection(groups.flatMap((group) => group.items.map((item) => item.id)));
  useEffect(() => {
    const link = sideRef.current?.querySelector('[aria-current="location"]');
    if (link) revealLink(sideRef.current, link);
  }, [active]);
  return (
    <aside className="docs-side" ref={sideRef}>
      <nav className="docs-nav" aria-label={label}>
        {groups.map((group) => (
          <div
            key={group.key}
            className="docs-side-g"
            role="group"
            aria-labelledby={`${idPrefix}-${group.key}`}
          >
            <div className="docs-side-h" id={`${idPrefix}-${group.key}`}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <a
                key={item.id}
                className="docs-side-i"
                href={`#${item.id}`}
                aria-current={active === item.id ? "location" : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function DocsCode({ title, children }) {
  return (
    <div className="docs-code">
      {title && (
        <div className="docs-code-h">
          <I.Terminal size={13} aria-hidden="true" />
          <span>{title}</span>
        </div>
      )}
      <pre>{children}</pre>
    </div>
  );
}
