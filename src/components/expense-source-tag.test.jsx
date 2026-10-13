import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { preloadActiveLocale, setLang } from "../i18n.jsx";
import { ExpenseSourceTag } from "./expense-source-tag.jsx";

const source = { kind: "owner", action: "create", userId: "owner", name: "Alice", githubLogin: null, via: "web" };
afterEach(async () => { await act(async () => { setLang("en"); await preloadActiveLocale(); }); });

describe("expense last operation source", () => {
  it("replaces the tag as the saved source changes without displaying history", () => {
    const view = render(<ExpenseSourceTag source={source} />);
    expect(screen.getByLabelText("Last operation source: Owner · Alice · Created")).toBeVisible();
    view.rerender(<ExpenseSourceTag source={{ ...source, kind: "member", action: "update", name: "Bob", userId: "member", via: "api_key" }} />);
    expect(screen.getByText("Shared member · Bob · Updated · API key")).toBeVisible();
    expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();
    view.rerender(<ExpenseSourceTag source={{ kind: "recurring", action: "create" }} />);
    expect(screen.getByText("Created by recurring schedule")).toBeVisible();
    expect(screen.queryByText(/Bob/)).not.toBeInTheDocument();
    view.rerender(<ExpenseSourceTag source={null} />);
    expect(screen.getByText("Source unknown")).toBeVisible();
  });

  it("shows a safe display-name fallback and treats missing attribution as unknown", () => {
    const view = render(<ExpenseSourceTag source={{ ...source, name: null, githubLogin: "alice-gh" }} />);
    expect(screen.getByText("Owner · alice-gh · Created")).toBeVisible();
    view.rerender(<ExpenseSourceTag source={{ ...source, name: null, githubLogin: null }} />);
    expect(screen.getByText("Owner · owner · Created")).toBeVisible();
    view.rerender(<ExpenseSourceTag source={{ kind: "member", action: "update" }} />);
    expect(screen.getByText("Source unknown")).toBeVisible();
  });

  it.each([
    ["zh", "周期计划自动创建", "共享成员 · 张三 · 修改"],
    ["ja", "定期スケジュールで自動作成", "共有メンバー · 张三 · 更新"],
    ["ko", "반복 일정으로 자동 생성", "공유 구성원 · 张三 · 수정"],
    ["fr", "Créé par un échéancier", "Membre du registre · 张三 · Modification"],
    ["es", "Creado por un plan recurrente", "Miembro del libro · 张三 · Modificación"],
  ])("localizes attribution in %s", async (language, recurring, member) => {
    await act(async () => { setLang(language); await preloadActiveLocale(); });
    const view = render(<ExpenseSourceTag source={{ kind: "recurring", action: "create" }} />);
    expect(screen.getByText(recurring)).toBeVisible();
    view.rerender(<ExpenseSourceTag source={{ ...source, kind: "member", action: "update", name: "张三" }} />);
    expect(screen.getByText(member)).toBeVisible();
  });
});
