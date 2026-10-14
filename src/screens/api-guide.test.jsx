import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLang } from "../i18n.jsx";
import { ApiIntegrationGuide, integrationMarkdown, integrationSections } from "./api-guide.jsx";

afterEach(() => setLang("en"));

describe("REST integration journey", () => {
  it("starts with an explicit category, one-time key setup and actual response IDs", () => {
    render(<ApiIntegrationGuide base="https://preview-api.norulo.com" ids={["quickstart"]} />);
    expect(screen.getByRole("heading", { name: "Quickstart: save your first expense" })).toHaveAttribute("id", "quickstart");
    const start = integrationSections("https://preview-api.norulo.com")[0].blocks.find(block => block.title === "firstExpense").code;
    expect(start).toContain("read -r -s");
    expect(start).toContain("export NORULO_API_KEY");
    expect(start).not.toContain("PASTE_YOUR_ONE_TIME_KEY");
    expect(start).toContain("api /api/v1/me");
    expect(start).toContain("api /api/v1/categories");
    expect(start).toContain("categoryId:$category");
    expect(start).toContain("Idempotency-Key: $IDEMPOTENCY_KEY");
    expect(start).toContain("jq -r .id");
    expect(start).toContain("--fail-with-body");
    expect(start).not.toContain("nrk_example");
  });

  it("copies the same guide sections, permission boundaries and recovery instructions", () => {
    const value = integrationMarkdown("https://preview-api.norulo.com");
    for (const expected of ["## Quickstart", "## Environments", "## Scopes", "## Project and shared recurring", "## Invitations", "## Error responses", "members:write", "Cookie", "412", "428", "204", "D1_ACCESS_PAUSED", "categoryId", "nextCursor", "autoRemoveOldestExpense", "/api/v1/account/expense-retention", "NORULO_COOKIE_JAR", "Origin: $NORULO_APP_ORIGIN"])
      expect(value).toContain(expected);
    expect(value).toContain("the same REST resources and business rules");
  });

  it("distinguishes separate historical retries from future scheduling", () => {
    const value = integrationMarkdown("https://preview-api.norulo.com", ["recurring"]);
    for (const expected of ["exactly one expense on startOn", "one separate expense record", "never a cumulative amount",
      "categoryId may be omitted", "CATEGORY_REQUIRED", "strictly after today", "awaitingSync", "first 10 unresolved",
      "Later failures are discarded", "pendingOccurrences", "retryPeriodKey", "If-Match", "English email",
      "/api/v1/recurring-expense-notifications", "cookie-only", "PASTE_RETAINED_PERIOD_KEY"])
      expect(value).toContain(expected);
    expect(value).not.toContain("explicit active category is always required");
  });

  it.each([
    ["en", "projects count current undeleted projects, including archived projects", "Removing a project frees its project slot", "removing a project frees its project slot", "archived and removed projects"],
    ["zh", "projects 统计未移除项目，包括归档项目", "移除项目会释放其项目名额", "移除项目则会释放其项目名额", "归档和移除的项目仍占用"],
    ["ja", "projects はアーカイブ済みを含む未削除プロジェクト", "プロジェクトを削除するとそのプロジェクト枠が空きます", "削除するとプロジェクト枠も空きます", "アーカイブ・削除済み"],
    ["ko", "projects는 보관된 프로젝트를 포함한 제거되지 않은 프로젝트", "프로젝트를 제거하면 해당 프로젝트 자리가 비워집니다", "프로젝트를 제거하면 프로젝트 자리도 비워집니다", "보관·제거된 프로젝트"],
    ["fr", "projects compte les projets non supprimés, y compris les projets archivés", "Supprimer un projet libère sa place de projet", "supprimer un projet libère sa place de projet", "les projets archivés ou supprimés occupent"],
    ["es", "projects cuenta los proyectos no eliminados, incluidos los archivados", "Eliminar un proyecto libera su espacio de proyecto", "eliminar un proyecto libera su plaza de proyecto", "los proyectos archivados o eliminados siguen ocupando"],
  ])("explains current project capacity and deletion release in %s", async (locale, count, release, retentionRelease, oldPolicy) => {
    await setLang(locale);
    const limits = integrationMarkdown("https://api.norulo.com", ["troubleshooting"]);
    const retention = integrationMarkdown("https://api.norulo.com", ["expense-retention"]);
    expect(limits).toContain(count);
    expect(limits).toContain(release);
    expect(retention).toContain(retentionRelease);
    expect(`${limits}\n${retention}`).not.toContain(oldPolicy);
  });
});
