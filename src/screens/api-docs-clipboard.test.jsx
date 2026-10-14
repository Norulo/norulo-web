import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiDocsScreen } from "./api-docs.jsx";
import { setLang } from "../i18n.jsx";
import { agentMarkdown } from "./api-agent.js";
import userEvent from "@testing-library/user-event";

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else delete navigator.clipboard;
  return setLang("en");
});

function clipboard(value) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

function choosePage() {
  fireEvent.click(screen.getByRole("button", { name: "Copy options" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: "Copy Page" }));
}

describe("API documentation clipboard recovery", () => {
  it.each(["missing", "denied"])(
    "offers exact selectable Markdown when clipboard is %s",
    async (failure) => {
      const writeText = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
      clipboard(failure === "missing" ? undefined : { writeText });
      render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
      choosePage();
      fireEvent.click(screen.getByRole("button", { name: "Copy Page" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Select and copy the Markdown below"
      );
      const fallback = screen.getByRole("textbox", { name: "Page Markdown" });
      expect(fallback).toHaveAttribute("readonly");
      expect(fallback).toHaveFocus();
      expect(fallback.selectionStart).toBe(0);
      expect(fallback.selectionEnd).toBe(fallback.value.length);
      expect(fallback.value).toContain("# Norulo ledger REST API");
      expect(fallback.value).toContain("Idempotency-Key");
      if (failure === "denied") expect(fallback.value).toBe(writeText.mock.calls[0][0]);
      const retry = vi.fn().mockResolvedValue(undefined);
      clipboard({ writeText: retry });
      fireEvent.click(screen.getByRole("button", { name: "Copy Page" }));
      await screen.findByRole("button", { name: "Copied" });
      expect(retry).toHaveBeenCalledWith(fallback.value);
      expect(screen.queryByRole("textbox", { name: "Page Markdown" })).not.toBeInTheDocument();
    }
  );

  it("ignores an old clipboard failure after the page is replaced", async () => {
    let reject;
    const pending = new Promise((_, fail) => {
      reject = fail;
    });
    clipboard({ writeText: vi.fn().mockReturnValue(pending) });
    const old = render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    choosePage();
    fireEvent.click(screen.getByRole("button", { name: "Copy Page" }));
    expect(screen.getByRole("button", { name: "Copy Page" })).toBeDisabled();
    old.unmount();
    clipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    await act(async () => reject(new Error("Old permission failure")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy for Agent" })).toBeEnabled();
  });

  it("keeps the recovery guidance localized", async () => {
    await setLang("zh");
    clipboard(undefined);
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "复制选项" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "复制页面" }));
    fireEvent.click(screen.getByRole("button", { name: "复制页面" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("无法自动复制此页面"));
    expect(screen.getByRole("textbox", { name: "页面 Markdown" })).toHaveAttribute("readonly");
  });

  it("defaults to agent Markdown and retains the original full-page export through the menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy for Agent" }));
    await screen.findByRole("button", { name: "Copied" });
    const agent = writeText.mock.calls[0][0];
    expect(agent).toBe(agentMarkdown("https://api.norulo.com"));
    choosePage();
    expect(writeText).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Copy Page" }));
    await screen.findByRole("button", { name: "Copied" });
    const page = writeText.mock.calls[1][0];
    for (const section of [
      "# Norulo ledger REST API",
      "## Quickstart",
      "## Complete API reference",
      "## Jev settings",
      "### GET /auth/session",
    ])
      expect(page).toContain(section);
    expect(agent.length).toBeLessThan(page.length / 3);
    fireEvent.click(screen.getByRole("button", { name: "Copy options" }));
    expect(screen.getByRole("menuitemradio", { name: "Copy Page" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Copy for Agent" }));
    expect(screen.getByRole("button", { name: "Copy for Agent" })).toBeEnabled();
  });

  it.each(["missing", "denied"])(
    "recovers the exact agent content when clipboard is %s",
    async (failure) => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      clipboard(failure === "missing" ? undefined : { writeText });
      render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy for Agent" }));
      const fallback = await screen.findByRole("textbox", { name: "Agent Markdown" });
      expect(fallback).toHaveFocus();
      expect(fallback.selectionEnd).toBe(fallback.value.length);
      expect(fallback.value).toBe(agentMarkdown("https://api.norulo.com"));
      if (failure === "denied") expect(writeText).toHaveBeenCalledWith(fallback.value);
      choosePage();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  );

  it("blocks mode changes and duplicate copies while a clipboard request is pending", async () => {
    let finish;
    const writeText = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    clipboard({ writeText });
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const copy = screen.getByRole("button", { name: "Copy for Agent" });
    fireEvent.click(copy);
    fireEvent.click(copy);
    expect(copy).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy options" })).toBeDisabled();
    expect(writeText).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Copy options" })).toBeEnabled();
  });

  it("supports keyboard selection, Escape, Tab and outside dismissal", async () => {
    const user = userEvent.setup();
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    const trigger = screen.getByRole("button", { name: "Copy options" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: "Copy for Agent" })).toHaveFocus();
    await user.keyboard("{End}{Enter}");
    expect(trigger).toHaveFocus();
    expect(screen.getByRole("button", { name: "Copy Page" })).toBeInTheDocument();
    await user.keyboard("{ArrowUp}{Home}{ArrowUp}");
    expect(screen.getByRole("menuitemradio", { name: "Copy Page" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    await user.tab();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each([
    ["zh", "复制供 Agent 使用", "复制选项"],
    ["ja", "エージェント用にコピー", "コピーの選択肢"],
    ["ko", "에이전트용 복사", "복사 옵션"],
    ["fr", "Copier pour un agent", "Options de copie"],
    ["es", "Copiar para un agente", "Opciones de copia"],
  ])("localizes agent controls and recovery in %s", async (locale, label, menuLabel) => {
    await setLang(locale);
    clipboard(undefined);
    render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: false }} />);
    expect(screen.getByRole("button", { name: menuLabel })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: label }));
    const fallback = await screen.findByRole("textbox");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Unable to copy agent documentation");
    expect(fallback.value).toBe(agentMarkdown("https://api.norulo.com"));
  });
});
