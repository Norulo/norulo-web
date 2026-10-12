import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedgerScreen } from "./ledger.jsx";

const workspace = (fields = {}) => ({
  id: "wsp_current",
  revision: 5,
  memberRevision: 7,
  permissions: { manageProjects: true, manageCategories: true, writeExpenses: true },
  ...fields,
});

function fixture({ mode = "shared", projectId = "prj_current", purpose = "Current hosting" } = {}) {
  const target = mode === "shared" ? { kind: "shared" } : { kind: "project", projectId };
  const expense = {
    id: "exp_current",
    occurredOn: "2026-10-08",
    amount: "12.50",
    currency: "USD",
    categoryId: "cat_hosting",
    purpose,
    note: null,
    target,
    revision: 2,
  };
  const project = {
    id: projectId,
    name: "Current project",
    description: "",
    status: "active",
    githubAccess: "not_linked",
    githubRepoIds: [],
    repositories: [],
    canCreateExpense: true,
    revision: 3,
    totals: [],
  };
  const api = {
    activity: vi.fn().mockResolvedValue({ items: [], nextCursor: null,
      windowStart: "2026-10-08T08:00:00Z", windowEnd: "2026-10-09T08:00:00Z" }),
    categories: vi.fn().mockResolvedValue([
      { id: "cat_hosting", name: "Hosting", archivedAt: null },
      { id: "cat_tools", name: "Tools", archivedAt: null },
    ]),
    projects: vi.fn().mockResolvedValue({ items: [project], nextCursor: null }),
    project: vi.fn().mockResolvedValue(project),
    expenses: vi.fn().mockResolvedValue({ items: [expense], nextCursor: null }),
    recurringRules: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    reportSummary: vi.fn().mockResolvedValue({ groups: [] }),
    reportTimeseries: vi.fn().mockResolvedValue({ groups: [] }),
    reportCategories: vi.fn().mockResolvedValue({ groups: [] }),
    repositories: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  };
  return { api, expense };
}

function filterToggle() {
  return screen.getByRole("button", { name: /^Filters(?: \d+)?$/ });
}

function filterStrip() {
  return document.getElementById(filterToggle().getAttribute("aria-controls"));
}

function exportQuery() {
  return new URL(screen.getByRole("link", { name: "Export CSV" }).href).searchParams;
}

function targetQuery(mode, projectId = "prj_current") {
  return mode === "shared" ? { target: "shared" } : { target: "project", projectId };
}

const requestCounts = (api) =>
  [
    api.expenses,
    api.categories,
    api.projects,
    api.project,
    api.reportSummary,
    api.reportTimeseries,
    api.reportCategories,
  ].map((method) => method.mock.calls.length);

afterEach(() => vi.useRealTimers());

describe("Shared expense and project view toolbar", () => {
  it.each(["shared", "project"])(
    "rejects inverted and equal %s date ranges without requests or misleading exports",
    async (mode) => {
      const { api, expense } = fixture({ mode });
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId="prj_current" />);
      await screen.findByText(expense.purpose);
      const originalReads = requestCounts(api);
      vi.useFakeTimers();
      fireEvent.click(filterToggle());
      const from = screen.getByLabelText("From date");
      const before = screen.getByLabelText("Before date");
      fireEvent.change(from, { target: { value: "2026-09-10" } });
      fireEvent.change(before, { target: { value: "2026-09-01" } });
      await act(async () => vi.advanceTimersByTime(1000));
      expect(requestCounts(api)).toEqual(originalReads);
      expect(screen.getByRole("alert")).toHaveTextContent("Before date must be later than From date. Previous results remain visible.");
      expect(from).toHaveAttribute("aria-invalid", "true");
      expect(before).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
      expect(screen.getByText(expense.purpose)).toBeVisible();
      expect(screen.queryByText("No expenses match these filters")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Export CSV" })).not.toHaveAttribute("href");
      expect(screen.getByRole("button", { name: "Edit " + expense.purpose })).toBeDisabled();
      fireEvent.click(filterToggle());
      expect(screen.getByRole("alert")).toBeVisible();
      fireEvent.click(filterToggle());
      fireEvent.change(before, { target: { value: "2026-09-10" } });
      await act(async () => vi.advanceTimersByTime(1000));
      expect(requestCounts(api)).toEqual(originalReads);
      fireEvent.change(before, { target: { value: "2026-09-11" } });
      await act(async () => vi.advanceTimersByTime(300));
      expect(api.expenses).toHaveBeenLastCalledWith({ ...targetQuery(mode), from: "2026-09-10", to: "2026-09-11", limit: 10 }, expect.anything());
      expect(api.expenses).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute("href");
    }
  );

  it("coalesces date and category edits into one final query and cancels a pending query on scope loss", async () => {
    const { api, expense } = fixture();
    const view = render(<LedgerScreen api={api} go={vi.fn()} mode="shared" workspace={workspace()} />);
    await screen.findByText(expense.purpose);
    vi.useFakeTimers();
    fireEvent.click(filterToggle());
    const from = screen.getByLabelText("From date");
    for (const value of ["0002-09-01", "0020-09-01", "0202-09-01", "2026-09-01"]) {
      fireEvent.change(from, { target: { value } });
      await act(async () => vi.advanceTimersByTime(100));
    }
    fireEvent.change(screen.getByLabelText("Before date"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Filter category"), { target: { value: "cat_hosting" } });
    expect(api.expenses).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTime(299));
    expect(api.expenses).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTime(1));
    expect(api.expenses).toHaveBeenCalledTimes(2);
    expect(api.categories).toHaveBeenCalledTimes(2);
    const expected = { target: "shared", from: "2026-09-01", to: "2026-10-01", categoryId: "cat_hosting" };
    expect(api.expenses).toHaveBeenLastCalledWith({ ...expected, limit: 10 }, expect.anything());
    for (const report of [api.reportSummary, api.reportTimeseries, api.reportCategories])
      expect(report).toHaveBeenLastCalledWith(expected, expect.anything());
    fireEvent.change(from, { target: { value: "2026-09-02" } });
    const current = fixture({ purpose: "New workspace records" });
    view.rerender(<LedgerScreen api={current.api} go={vi.fn()} mode="shared" workspace={workspace({ id: "wsp_next" })} />);
    await act(async () => vi.advanceTimersByTime(500));
    expect(api.expenses).toHaveBeenCalledTimes(2);
    expect(current.api.expenses).toHaveBeenCalledExactlyOnceWith({ target: "shared", limit: 10 }, expect.anything());
    expect(screen.getByText("New workspace records")).toBeVisible();
    expect(screen.getByLabelText("From date")).toHaveValue("");
  });

  it("keeps invalid filters correctable when an earlier valid range read fails", async () => {
    const { api, expense } = fixture();
    render(<LedgerScreen api={api} go={vi.fn()} mode="shared" />);
    await screen.findByText(expense.purpose);
    let rejectRead;
    api.expenses.mockImplementationOnce(() => new Promise((_, reject) => { rejectRead = reject; }));
    fireEvent.click(filterToggle());
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-09-10" } });
    await waitFor(() => expect(api.expenses).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText("Before date"), { target: { value: "2026-09-01" } });
    await act(async () => rejectRead({ status: 503 }));
    expect(screen.getByText(expense.purpose)).toBeVisible();
    expect(screen.getByText("Could not update results. Previous results remain visible.")).toBeVisible();
    expect(screen.getByLabelText("Before date")).toBeEnabled();
    expect(screen.getByRole("link", { name: "Export CSV" })).not.toHaveAttribute("href");
    expect(api.expenses).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByLabelText("Before date"), { target: { value: "2026-10-01" } });
    await waitFor(() => expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute("href"));
    expect(api.expenses).toHaveBeenCalledTimes(3);
    expect(api.expenses).toHaveBeenLastCalledWith({ target: "shared", from: "2026-09-10", to: "2026-10-01", limit: 10 }, expect.anything());
    expect(screen.queryByText("Could not update results. Previous results remain visible.")).not.toBeInTheDocument();
  });

  it("blocks old cursors and record actions after a failed filter read until an explicit successful reload", async () => {
    const { api, expense } = fixture();
    api.expenses.mockResolvedValue({ items: [expense], nextCursor: "old-filter-cursor" });
    render(<LedgerScreen api={api} go={vi.fn()} mode="shared" />);
    await screen.findByText(expense.purpose);
    api.expenses.mockRejectedValueOnce({ status: 503 });
    fireEvent.click(filterToggle());
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-09-10" } });
    await screen.findByText("Could not update results. Previous results remain visible.");
    expect(screen.getByText(expense.purpose)).toBeVisible();
    const next = screen.getByRole("button", { name: "Next", exact: true });
    expect(next).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit " + expense.purpose })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove " + expense.purpose })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Expense review" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Export CSV" })).not.toHaveAttribute("href");
    expect(screen.getByLabelText("From date")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    fireEvent.click(next);
    fireEvent.click(screen.getByRole("button", { name: "Expense review" }));
    expect(api.expenses).toHaveBeenCalledTimes(2);
    api.expenses.mockResolvedValueOnce({ items: [{ ...expense, purpose: "Current filtered records" }], nextCursor: "new-filter-cursor" });
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    await screen.findByText("Current filtered records");
    await waitFor(() => expect(screen.getByRole("button", { name: "Next", exact: true })).toBeEnabled());
    expect(screen.queryByText("Could not update results. Previous results remain visible.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute("href");
    expect(api.expenses).toHaveBeenLastCalledWith({ target: "shared", from: "2026-09-10", limit: 10 }, expect.anything());
    api.expenses.mockResolvedValueOnce({ items: [{ ...expense, id: "exp_next", purpose: "Next filtered page" }], nextCursor: null });
    fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }));
    await screen.findByText("Next filtered page");
    expect(api.expenses).toHaveBeenCalledTimes(4);
    expect(api.expenses).toHaveBeenLastCalledWith({ target: "shared", from: "2026-09-10", cursor: "new-filter-cursor", limit: 10 }, expect.anything());
    expect(api.expenses.mock.calls.some(([query]) => query.cursor === "old-filter-cursor")).toBe(false);
  });

  it.each(["shared", "project"])("appends the %s operation log and loads its fixed target only on intent", async (mode) => {
    const { api, expense } = fixture({ mode });
    const readonly = workspace({ permissions: { manageProjects: false, manageCategories: false, writeExpenses: false } });
    render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId="prj_current" workspace={readonly} />);
    await screen.findByText(expense.purpose);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(mode === "project"
      ? ["Expenses", "Reports", "Project settings", "Operation log"]
      : ["Expenses", "Reports", "Operation log"]);
    expect(api.activity).not.toHaveBeenCalled();
    fireEvent.click(filterToggle());
    fireEvent.click(screen.getByRole("tab", { name: "Operation log" }));
    const log = screen.getByRole("tabpanel", { name: "Operation log" });
    expect(await within(log).findByText("No changes in the past 24 hours.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Filters/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Export CSV" })).not.toBeInTheDocument();
    expect(api.activity).toHaveBeenCalledWith({ ...targetQuery(mode), limit: 50 }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
    expect(screen.getByText(expense.purpose)).toBeVisible();
    expect(filterToggle()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Operation log" }));
    expect(api.activity).toHaveBeenCalledOnce();
  });

  it.each(["shared", "project"])(
    "shows %s records first and adds a compact shared-pool total beside Reports",
    async (mode) => {
      const { api, expense } = fixture({ mode });
      const view = render(
        <LedgerScreen
          api={api}
          go={vi.fn()}
          mode={mode}
          projectId="prj_current"
          workspace={workspace()}
        />
      );
      expect(await screen.findByText(expense.purpose)).toBeVisible();
      const records = screen.getByRole("tabpanel", { name: "Expenses" });
      expect(within(records).getByRole("heading", { name: "Recorded expenses" })).toBeVisible();
      expect(records.querySelector(".ledger-stats")).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Totals by currency", hidden: true })
      ).not.toBeInTheDocument();
      expect(api.reportSummary).toHaveBeenCalledTimes(mode === "shared" ? 1 : 0);
      expect(view.container.querySelectorAll(".ledger-view-toolbar")).toHaveLength(1);
      expect(filterToggle()).toHaveAttribute("type", "button");
      expect(filterToggle()).toHaveAttribute("aria-expanded", "false");
      expect(filterStrip()).not.toBeVisible();
      const query = exportQuery();
      expect(query.get("target")).toBe(mode);
      expect(query.get("projectId")).toBe(mode === "project" ? "prj_current" : null);
      expect(query.get("workspaceId")).toBe("wsp_current");
      const counts = requestCounts(api);
      fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
      const reports = screen.getByRole("tabpanel", { name: "Reports" });
      const charts = reports.querySelector(".ledger-reports");
      if (mode === "project") expect(reports.firstElementChild).toBe(charts);
      else expect(within(reports).getByRole("heading", { name: "Shared pool total" })).toBeVisible();
      expect(within(charts).getByRole("heading", { name: "Expenses over time" })).toBeVisible();
      expect(within(charts).getByRole("heading", { name: "Expenses by category" })).toBeVisible();
      expect(
        reports.querySelector(".ledger-report-totals, .ledger-stat, .ledger-stats")
      ).toBeNull();
      expect(filterStrip()).not.toBeVisible();
      expect(requestCounts(api)).toEqual(counts);
      fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
      expect(screen.getByText(expense.purpose)).toBeVisible();
      expect(charts).not.toBeVisible();
      expect(requestCounts(api)).toEqual(counts);
      fireEvent.click(screen.getByRole("button", { name: "Reload" }));
      await waitFor(() => expect(api.expenses).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled());
      expect(api.reportSummary).toHaveBeenCalledTimes(mode === "shared" ? 2 : 0);
    }
  );

  it.each(["shared", "project"])(
    "shares %s filters and fixed-target CSV across tabs while allowing active filters to close",
    async (mode) => {
      const { api, expense } = fixture({ mode });
      const view = render(
        <LedgerScreen
          api={api}
          go={vi.fn()}
          mode={mode}
          projectId="prj_current"
          workspace={workspace()}
        />
      );
      await screen.findByText(expense.purpose);
      const beforeOpen = requestCounts(api);
      fireEvent.click(filterToggle());
      expect(filterStrip()).toBeVisible();
      expect(requestCounts(api)).toEqual(beforeOpen);
      const from = screen.getByLabelText("From date");
      const before = screen.getByLabelText("Before date");
      const category = screen.getByLabelText("Filter category");
      const ids = [from.id, before.id, category.id];
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(3);
      expect(filterStrip().querySelectorAll("input, select")).toHaveLength(3);
      fireEvent.change(from, { target: { value: "2026-09-01" } });
      fireEvent.change(before, { target: { value: "2026-10-01" } });
      fireEvent.change(category, { target: { value: "cat_hosting" } });
      const expected = {
        ...targetQuery(mode),
        from: "2026-09-01",
        to: "2026-10-01",
        categoryId: "cat_hosting",
      };
      await waitFor(() =>
        expect(api.expenses).toHaveBeenLastCalledWith({ ...expected, limit: 10 }, expect.anything())
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled());
      for (const report of [api.reportTimeseries, api.reportCategories])
        expect(report).toHaveBeenLastCalledWith(expected, expect.anything());
      if (mode === "shared") expect(api.reportSummary).toHaveBeenLastCalledWith(expected, expect.anything());
      else expect(api.reportSummary).not.toHaveBeenCalled();
      expect(before).toHaveAttribute("min", "2026-09-01");
      expect(within(filterToggle()).getByText("3")).toHaveClass("ledger-filter-count");
      for (const [key, value] of Object.entries({ ...expected, workspaceId: "wsp_current" }))
        expect(exportQuery().get(key)).toBe(value);
      fireEvent.click(filterToggle());
      expect(filterToggle()).toHaveAttribute("aria-expanded", "false");
      expect(filterStrip()).not.toBeVisible();
      const counts = requestCounts(api);
      fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
      expect(within(filterToggle()).getByText("3")).toBeVisible();
      expect(filterStrip()).not.toBeVisible();
      expect(view.container.querySelectorAll(".ledger-filters")).toHaveLength(1);
      expect(screen.getByLabelText("From date")).toBe(from);
      expect(screen.getByLabelText("Before date")).toBe(before);
      expect(screen.getByLabelText("Filter category")).toBe(category);
      fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
      expect(requestCounts(api)).toEqual(counts);
      expect(exportQuery().get("to")).toBe("2026-10-01");
      fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      await waitFor(() =>
        expect(api.expenses).toHaveBeenLastCalledWith({ ...targetQuery(mode), limit: 10 }, expect.anything())
      );
      expect(filterStrip()).not.toBeVisible();
      expect(from).toHaveValue("");
      expect(before).toHaveValue("");
      expect(category).toHaveValue("");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
      expect(filterToggle().querySelector(".ledger-filter-count")).toBeNull();
      expect(exportQuery().get("from")).toBeNull();
      expect(exportQuery().get("to")).toBeNull();
      expect(exportQuery().get("categoryId")).toBeNull();
      if (mode === "shared") expect(api.reportSummary).toHaveBeenLastCalledWith({ target: "shared" }, expect.anything());
      else expect(api.reportSummary).not.toHaveBeenCalled();
    }
  );

  it("hides tools in Project settings and returns to the same filter state", async () => {
    const { api, expense } = fixture({ mode: "project" });
    render(<LedgerScreen api={api} go={vi.fn()} mode="project" projectId="prj_current" />);
    await screen.findByText(expense.purpose);
    fireEvent.click(filterToggle());
    const from = screen.getByLabelText("From date");
    const strip = filterStrip();
    fireEvent.change(from, { target: { value: "2026-09-01" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled());
    const counts = requestCounts(api);
    fireEvent.click(screen.getByRole("tab", { name: "Project settings" }));
    expect(screen.queryByRole("button", { name: /^Filters/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Export CSV" })).not.toBeInTheDocument();
    expect(strip).not.toBeVisible();
    expect(screen.queryByRole("heading", { name: "Totals by currency" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
    expect(filterToggle()).toHaveAttribute("aria-expanded", "true");
    expect(strip).toBeVisible();
    expect(screen.getByLabelText("From date")).toBe(from);
    expect(from).toHaveValue("2026-09-01");
    expect(exportQuery().get("from")).toBe("2026-09-01");
    expect(requestCounts(api)).toEqual(counts);
  });

  it.each(
    ["shared", "project"].flatMap((mode) =>
      [
        {
          method: "reportTimeseries",
          title: "Expenses over time",
          sibling: "Expenses by category",
        },
        {
          method: "reportCategories",
          title: "Expenses by category",
          sibling: "Expenses over time",
        },
      ].map((report) => ({ mode, ...report }))
    )
  )(
    "keeps $mode records when $method fails and shows the outage only in its report",
    async ({ mode, method, title, sibling }) => {
      const { api, expense } = fixture({ mode });
      api[method].mockRejectedValue({ status: 503, message: "Report offline" });
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId="prj_current" />);
      expect(await screen.findByText(expense.purpose)).toBeVisible();
      expect(screen.getByText(/This report is unavailable/)).not.toBeVisible();
      fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
      const unavailable = screen.getByRole("heading", { name: title }).closest("section");
      const available = screen.getByRole("heading", { name: sibling }).closest("section");
      expect(within(unavailable).getByRole("status")).toHaveTextContent(
        "This report is unavailable. Reload to try again."
      );
      expect(unavailable.querySelector(".financial-value")).toBeNull();
      expect(within(unavailable).queryByText("No expenses in this range.")).not.toBeInTheDocument();
      expect(within(available).getByText("No expenses in this range.")).toBeVisible();
      expect(within(available).queryByRole("status")).not.toBeInTheDocument();
      expect(api.reportSummary).toHaveBeenCalledTimes(mode === "shared" ? 1 : 0);
      fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
      expect(screen.getByText(expense.purpose)).toBeVisible();
    }
  );

  it.each(["shared", "project"])(
    "distinguishes successful empty %s charts from unavailable reports without inventing totals",
    async (mode) => {
      const { api, expense } = fixture({ mode });
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId="prj_current" />);
      await screen.findByText(expense.purpose);
      fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
      const reports = screen.getByRole("tabpanel", { name: "Reports" });
      expect(within(reports).getAllByText("No expenses in this range.")).toHaveLength(2);
      expect(within(reports).queryByRole("status")).not.toBeInTheDocument();
      expect(
        within(reports).queryByText(/Your spending totals will appear/)
      ).not.toBeInTheDocument();
      expect(reports.querySelector(".financial-value, .ledger-report-totals")).toBeNull();
      expect(api.reportSummary).toHaveBeenCalledTimes(mode === "shared" ? 1 : 0);
    }
  );

  it.each([
    { name: "project route", next: { projectId: "prj_next" } },
    { name: "shared route", next: { mode: "shared", projectId: "" } },
    { name: "workspace", next: { workspace: workspace({ id: "wsp_next" }) } },
    { name: "ledger revision", next: { workspace: workspace({ revision: 6 }) } },
    { name: "membership revision", next: { workspace: workspace({ memberRevision: 8 }) } },
    {
      name: "permissions",
      next: {
        workspace: workspace({
          permissions: { manageProjects: false, manageCategories: false, writeExpenses: false },
        }),
      },
    },
    { name: "authorization revision", next: { authorizationRevision: 1 } },
  ])("clears and aborts old filters when the $name scope changes", async ({ next }) => {
    const old = fixture({ mode: "project", purpose: "Original records" });
    const initial = {
      api: old.api,
      go: vi.fn(),
      mode: "project",
      projectId: "prj_current",
      workspace: workspace(),
      authorizationRevision: 0,
    };
    const view = render(<LedgerScreen {...initial} />);
    await screen.findByText(old.expense.purpose);
    let finish;
    old.api.expenses.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    fireEvent.click(filterToggle());
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-09-01" } });
    expect(screen.getByText(/Updating results/)).toBeVisible();
    await waitFor(() => expect(old.api.expenses).toHaveBeenCalledTimes(2));
    const pendingSignal = old.api.expenses.mock.calls.at(-1)[1].signal;
    const mode = next.mode || initial.mode;
    const projectId = next.projectId ?? initial.projectId;
    const current = fixture({ mode, projectId, purpose: "Current scope records" });
    view.rerender(<LedgerScreen {...initial} {...next} api={current.api} />);
    expect(pendingSignal.aborted).toBe(true);
    expect(await screen.findByText(current.expense.purpose)).toBeVisible();
    expect(filterToggle()).toHaveAttribute("aria-expanded", "false");
    expect(filterStrip()).not.toBeVisible();
    expect(screen.getByLabelText("From date")).toHaveValue("");
    expect(screen.getByLabelText("Before date")).toHaveValue("");
    expect(screen.getByLabelText("Filter category")).toHaveValue("");
    expect(current.api.expenses).toHaveBeenCalledWith(
      { ...targetQuery(mode, projectId), limit: 10 },
      expect.anything()
    );
    expect(exportQuery().get("workspaceId")).toBe((next.workspace || initial.workspace).id);
    expect(exportQuery().get("from")).toBeNull();
    await act(async () =>
      finish({ items: [{ ...old.expense, purpose: "Late protected records" }], nextCursor: null })
    );
    expect(screen.queryByText("Late protected records")).not.toBeInTheDocument();
    expect(screen.queryByText(old.expense.purpose)).not.toBeInTheDocument();
    expect(screen.getByText(current.expense.purpose)).toBeVisible();
  });

  it.each(
    ["shared", "project"].flatMap((mode) =>
      ["reportTimeseries", "reportCategories"].map((method) => ({ mode, method }))
    )
  )(
    "clears $mode protected records and toolbar export after a $method permission failure",
    async ({ mode, method }) => {
      const { api, expense } = fixture({ mode });
      const failure = { status: 403, payload: { error: { code: "PROJECT_ACCESS_CHANGED" } } };
      const onAccessChanged = vi.fn();
      render(
        <LedgerScreen
          api={api}
          go={vi.fn()}
          mode={mode}
          projectId="prj_current"
          onAccessChanged={onAccessChanged}
        />
      );
      await screen.findByText(expense.purpose);
      api[method].mockRejectedValueOnce(failure);
      fireEvent.click(filterToggle());
      fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-09-01" } });
      await waitFor(() => expect(onAccessChanged).toHaveBeenCalledExactlyOnceWith(failure));
      expect(screen.queryByText(expense.purpose)).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Export CSV" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Filters/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Totals by currency" })).not.toBeInTheDocument();
      expect(api.reportSummary).toHaveBeenCalledTimes(mode === "shared" ? 2 : 0);
    }
  );
});
