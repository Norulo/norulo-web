import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLang } from "../i18n.jsx";
import { ApiDocsScreen } from "./api-docs.jsx";
import { DocsScreen } from "./docs.jsx";
import { DocsSideNav } from "./docs-layout.jsx";

afterEach(async () => {
  vi.restoreAllMocks();
  await act(async () => {
    await setLang("en");
  });
});

function sidebarIds(name) {
  const nav = screen.getByRole("navigation", { name });
  return within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href").slice(1));
}

function pageSectionIds() {
  return [...document.querySelectorAll("#main-content :is(h1, h2)[id]")].map(
    (heading) => heading.id
  );
}

describe("Docs and API sidebars", () => {
  it("lists every Docs section once, in page order, under labelled groups", () => {
    render(<DocsScreen go={vi.fn()} auth={{ authenticated: false }} />);

    expect(sidebarIds("Docs sections")).toEqual(pageSectionIds());
    const nav = screen.getByRole("navigation", { name: "Docs sections" });
    expect(within(nav).getAllByRole("group")).toHaveLength(5);
    for (const name of ["Get started", "Projects", "Expenses", "Jev", "Reports and access"])
      expect(within(nav).getByRole("group", { name })).toBeInTheDocument();
  });

  it("lists every API section once, in page order, ending with the reference", () => {
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);

    const ids = sidebarIds("API sections");
    expect(ids).toEqual(pageSectionIds());
    expect(ids[0]).toBe("overview");
    expect(ids.at(-1)).toBe("reference");
    const nav = screen.getByRole("navigation", { name: "API sections" });
    const jev = within(nav).getByRole("group", { name: "Jev" });
    expect(within(jev).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "#max-assistance",
      "#jev-settings",
      "#expense-review",
    ]);
  });

  it.each([
    ["zh", "文档章节", "快速开始", "API 章节", "参考"],
    ["ja", "ドキュメントのセクション", "はじめに", "API のセクション", "リファレンス"],
    ["ko", "문서 섹션", "시작하기", "API 섹션", "참조"],
    ["fr", "Sections de la documentation", "Premiers pas", "Sections de l’API", "Référence"],
    ["es", "Secciones de la documentación", "Primeros pasos", "Secciones de la API", "Referencia"],
  ])("localizes sidebar landmarks and groups in %s", async (lang, docs, start, api, reference) => {
    await act(async () => {
      await setLang(lang);
    });
    const view = render(<DocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    expect(
      within(screen.getByRole("navigation", { name: docs })).getByRole("group", { name: start })
    ).toBeInTheDocument();
    view.unmount();

    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    expect(
      within(screen.getByRole("navigation", { name: api })).getByRole("group", { name: reference })
    ).toBeInTheDocument();
  });

  it("marks the section whose heading has reached the top of the viewport", async () => {
    const tops = { first: -400, second: 40, third: 500 };
    const headings = Object.keys(tops).map((id) => {
      const heading = document.createElement("h2");
      heading.id = id;
      heading.getBoundingClientRect = () => ({ top: tops[id], bottom: tops[id] + 30 });
      document.body.append(heading);
      return heading;
    });
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(10000);
    const frames = [];
    let frameId = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      frameId += 1;
      return frameId;
    });
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    const view = render(
      <DocsSideNav
        label="Sections"
        groups={[
          { key: "a", label: "A", items: [{ id: "first", label: "First" }, { id: "second", label: "Second" }] },
          { key: "b", label: "B", items: [{ id: "third", label: "Third" }] },
        ]}
      />
    );
    const link = (name) => screen.getByRole("link", { name });
    expect(link("Second")).toHaveAttribute("aria-current", "location");
    expect(link("First")).not.toHaveAttribute("aria-current");

    tops.second = -300;
    tops.third = 90;
    fireEvent.scroll(window);
    fireEvent.scroll(window);
    expect(frames).toHaveLength(1);
    act(() => frames.shift()());
    expect(link("Third")).toHaveAttribute("aria-current", "location");
    expect(link("Second")).not.toHaveAttribute("aria-current");

    fireEvent.scroll(window);
    view.unmount();
    expect(cancel).toHaveBeenCalledWith(2);
    headings.forEach((heading) => heading.remove());
  });

  it("keeps sharp, shadow-free docs surfaces with an accent bar only on the current section", () => {
    const styles = readFileSync("src/screens/docs.css", "utf8");
    expect(styles).not.toMatch(/border-radius|box-shadow/);
    expect(styles).toMatch(/\.docs-side-i\[aria-current="location"\]\s*{[^}]*border-left:\s*2px solid var\(--accent\);/);
  });

  it("keeps the sidebar scrollable while hiding its scrollbar", () => {
    const styles = readFileSync("src/screens/docs.css", "utf8");
    expect(styles).toMatch(/^\.docs-side\s*{[^}]*overflow-y:\s*auto;[^}]*scrollbar-width:\s*none;/m);
    expect(styles).toMatch(/\.docs-side::-webkit-scrollbar\s*{\s*display:\s*none;/);
    expect(styles).toMatch(/@media \(max-width: 899px\) \{\s*\.docs-side \{[^}]*overflow-x:\s*auto;/);
  });

  it("aligns the sidebar and content with the public header's inner edges at every width", () => {
    const styles = readFileSync("src/screens/docs.css", "utf8");
    const header = readFileSync("src/screens/public.css", "utf8");
    const rule = (selector) =>
      styles.match(new RegExp(`^${selector}\\s*\\{(?<body>[^}]*)\\}`, "m"))?.groups?.body;
    const shell = rule("\\.docs-shell");
    expect(shell).toMatch(/max-width:\s*1240px;/);
    expect(shell).toMatch(/padding-left:\s*var\(--space-10\);[\s\S]*padding-right:\s*var\(--space-10\);/);
    expect(header).toMatch(/^\.lp-top\s*\{[^}]*padding:\s*22px var\(--space-10\);[^}]*max-width:\s*1240px;/m);
    expect(rule("\\.docs-main")).not.toMatch(/max-width|margin/);
    // Phone gutters follow the header: 20px through 760px, 16px through 420px.
    expect(styles).toMatch(
      /@media \(max-width: 760px\) \{\s*\.docs-shell \{[^}]*padding-left:\s*var\(--space-5\);\s*padding-right:\s*var\(--space-5\);/
    );
    expect(header).toMatch(
      /@media \(max-width: 760px\) \{\s*\.lp-top \{[^}]*padding:\s*var\(--space-4\) var\(--space-5\);/
    );
    expect(styles).toMatch(
      /@media \(max-width: 420px\) \{\s*\.docs-shell \{\s*padding-left:\s*var\(--space-4\);\s*padding-right:\s*var\(--space-4\);/
    );
    expect(header).toMatch(
      /@media \(max-width: 420px\) \{\s*\.lp-top \{\s*padding-right:\s*var\(--space-4\);\s*padding-left:\s*var\(--space-4\);/
    );
  });

  it("frames featured boxes with a hairline only", () => {
    const styles = readFileSync("src/screens/docs.css", "utf8");
    const rule = (selector) =>
      styles.match(new RegExp(`^${selector}\\s*\\{(?<body>[^}]*)\\}`, "m"))?.groups?.body;
    for (const selector of [
      "\\.docs-agent-setup",
      "\\.docs-callout",
      "\\.docs-main \\.docs-agent-setup \\.docs-agent-prompt",
    ]) {
      const body = rule(selector);
      expect(body, selector).toContain("border: 1px solid var(--border);");
      expect(body, selector).not.toMatch(/background|border-(?:top|left):/);
    }
  });
});
