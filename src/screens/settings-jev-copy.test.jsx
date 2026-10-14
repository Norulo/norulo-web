import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLang } from "../i18n.jsx";
import { DocsScreen } from "./docs.jsx";
import { ApiDocsScreen } from "./api-docs.jsx";

afterEach(() => setLang("en"));

describe("Jev preference product contract", () => {
  it.each([
    [
      "en",
      "Jev settings",
      "Free, Pro and Max owners",
      "GET/PATCH /api/v1/account/jev",
      "Free can also toggle Jev",
      "one-time 20 trials",
    ],
    [
      "zh",
      "Jev 设置",
      "Free、Pro 和 Max",
      "GET/PATCH /api/v1/account/jev",
      "Free 也可开关 Jev",
      "一次性 20 次试用",
    ],
    [
      "ja",
      "Jev 設定",
      "Free・Pro・Max",
      "GET/PATCH /api/v1/account/jev",
      "Free も切り替え可能",
      "一度限り20回",
    ],
    [
      "ko",
      "Jev 설정",
      "Free·Pro·Max",
      "GET/PATCH /api/v1/account/jev",
      "Free도 전환",
      "일회성 20회",
    ],
    [
      "fr",
      "Paramètres Jev",
      "Les Owners Free, Pro et Max",
      "GET/PATCH /api/v1/account/jev",
      "Free peut aussi",
      "20 essais uniques",
    ],
    [
      "es",
      "Configuración de Jev",
      "Los Owners Free, Pro y Max",
      "GET/PATCH /api/v1/account/jev",
      "Free también",
      "20 pruebas únicas",
    ],
  ])(
    "explains the account switch and cookie-only revision contract in %s",
    async (locale, heading, guide, api, auth, freeGate) => {
      await setLang(locale);
      render(<DocsScreen go={vi.fn()} auth={{ authenticated: true }} />);
      expect(screen.getByRole("heading", { name: heading })).toHaveAttribute("id", "jev-settings");
      expect(
        screen.getByText((_, node) => node.tagName === "P" && node.textContent.includes(guide))
      ).toHaveTextContent(freeGate);
      cleanup();
      render(<ApiDocsScreen go={vi.fn()} auth={{ authenticated: true }} />);
      expect(screen.getByRole("heading", { name: heading })).toHaveAttribute("id", "jev-settings");
      const contract = screen.getByText(
        (_, node) => node.tagName === "P" && node.textContent.startsWith(api)
      );
      expect(contract).toHaveTextContent(auth);
      expect(contract).toHaveTextContent("monthlyCalls");
      expect(contract).toHaveTextContent("trialCalls");
      expect(contract).toHaveTextContent("If-Match");
      expect(contract).toHaveTextContent("412");
      expect(contract).toHaveTextContent("monthlyBudgetUsd");
      const endpoints = screen.getAllByText("/api/v1/account/jev");
      expect(endpoints).toHaveLength(2);
      for (const path of endpoints)
        expect(path.closest("details").textContent).not.toContain("profile:write");
    }
  );
});
