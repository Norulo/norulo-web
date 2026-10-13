import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LedgerScreen } from "./ledger.jsx";

const dateHelp =
  "Repeat dates follow the start date. Each calendar period adds one expense; shorter months use their last day.";

function deferred() {
  let resolve;
  const promise = new Promise((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function fixture(mode) {
  const projectId = "prj_dates";
  const target = mode === "project" ? { kind: "project", projectId } : { kind: "shared" };
  const project = {
    id: projectId,
    name: "Monthly services",
    status: "active",
    revision: 3,
    githubAccess: "not_linked",
    githubRepoIds: [],
    repositories: [],
    canCreateExpense: true,
    totals: [],
  };
  const rule = {
    id: "rul_dates",
    target,
    amount: "200.00",
    currency: "USD",
    categoryId: "cat_dates",
    purpose: "Monthly hosting",
    note: null,
    quantity: null,
    unit: null,
    status: "active",
    revision: 7,
    schedule: {
      frequency: "monthly",
      day: 9,
      startOn: "2026-10-09",
      endOn: null,
      timezone: "Asia/Shanghai",
    },
    nextOccurrenceOn: "2026-10-09",
    nextRunAt: 1791475200,
  };
  const write = deferred();
  const api = {
    project: vi.fn().mockResolvedValue(project),
    projects: vi.fn().mockResolvedValue({ items: [project], nextCursor: null }),
    categories: vi.fn().mockResolvedValue([{ id: "cat_dates", name: "Hosting", archivedAt: null }]),
    expenses: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    recurringRules: vi.fn().mockResolvedValue({ items: [rule], nextCursor: null }),
    updateRecurringRule: vi.fn().mockReturnValue(write.promise),
    createRecurringRule: vi.fn(),
    updateExpense: vi.fn(),
    createExpense: vi.fn(),
    reportTimeseries: vi.fn().mockResolvedValue({ groups: [] }),
    reportCategories: vi.fn().mockResolvedValue({ groups: [] }),
    repositories: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  };
  const reads = () =>
    [api.project, api.projects, api.categories, api.expenses, api.recurringRules].map(
      (method) => method.mock.calls.length
    );
  return { api, projectId, rule, write, reads };
}

describe("Recurring start dates in the shared expense editor", () => {
  it.each(["project", "shared"])(
    "derives the %s monthly day from the start date and displays the server's next date",
    async (mode) => {
      const user = userEvent.setup();
      const { api, projectId, rule, write, reads } = fixture(mode);
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId={projectId} />);
      const row = (await screen.findByRole("heading", { name: rule.purpose })).closest("article");
      const readCounts = reads();
      await user.click(within(row).getByRole("button", { name: "Edit schedule" }));

      const startDate = screen.getByLabelText("Start date");
      const repeatDay = screen.getByLabelText("Day of month");
      expect(startDate).toHaveValue("2026-10-09");
      expect(repeatDay).toHaveValue(9);
      expect(repeatDay).toHaveAttribute("readonly");
      expect(document.getElementById(startDate.getAttribute("aria-describedby"))).toHaveTextContent(
        dateHelp
      );

      fireEvent.change(startDate, { target: { value: "2026-10-10" } });
      expect(startDate).toHaveValue("2026-10-10");
      expect(repeatDay).toHaveValue(10);
      expect(screen.getByLabelText("Time zone")).toHaveTextContent("Asia/Shanghai");
      expect(within(row).getByText("2026-10-09", { selector: "time" })).toBeVisible();
      expect(api.updateRecurringRule).not.toHaveBeenCalled();
      expect(reads()).toEqual(readCounts);

      await user.click(screen.getByRole("button", { name: "Save schedule" }));
      expect(api.updateRecurringRule).toHaveBeenCalledExactlyOnceWith(
        rule.id,
        rule.revision,
        {
          target: rule.target,
          amount: "200.00",
          currency: "USD",
          categoryId: "cat_dates",
          purpose: rule.purpose,
          note: null,
          quantity: null,
          unit: null,
          schedule: { ...rule.schedule, day: 10, startOn: "2026-10-10" },
        },
        { signal: expect.any(AbortSignal) }
      );
      expect(within(row).getByText("2026-10-09", { selector: "time" })).toBeVisible();
      expect(startDate).toBeDisabled();

      const saved = {
        ...rule,
        revision: 8,
        schedule: { ...rule.schedule, day: 10, startOn: "2026-10-10" },
        nextOccurrenceOn: "2026-11-10",
        nextRunAt: 1794240000,
      };
      await act(async () => write.resolve(saved));
      await waitFor(() => expect(screen.queryByLabelText("Start date")).toBeNull());
      expect(within(row).getByText("2026-11-10", { selector: "time" })).toBeVisible();
      expect(reads()).toEqual(readCounts);
      expect(api.createRecurringRule).not.toHaveBeenCalled();
      expect(api.createExpense).not.toHaveBeenCalled();
      expect(api.updateExpense).not.toHaveBeenCalled();

      await user.click(within(row).getByRole("button", { name: "Edit schedule" }));
      expect(screen.getByLabelText("Start date")).toHaveValue("2026-10-10");
      expect(screen.getByLabelText("Day of month")).toHaveValue(10);
      expect(screen.getByLabelText("Time zone")).toHaveTextContent("Asia/Shanghai");
      expect(reads()).toEqual(readCounts);
    }
  );

  it.each(["project", "shared"])(
    "normalizes a historical %s schedule only when the edit is explicitly saved",
    async (mode) => {
      const user = userEvent.setup();
      const { api, projectId, rule, write, reads } = fixture(mode);
      rule.schedule = { ...rule.schedule, day: 13, startOn: "2026-10-05" };
      rule.nextOccurrenceOn = "2026-11-13";
      const originalSchedule = { ...rule.schedule };
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId={projectId} />);
      const row = (await screen.findByRole("heading", { name: rule.purpose })).closest("article");
      const readCounts = reads();
      await user.click(within(row).getByRole("button", { name: "Edit schedule" }));
      expect(screen.getByLabelText("Start date")).toHaveValue("2026-10-05");
      expect(screen.getByLabelText("Day of month")).toHaveValue(5);
      expect(screen.getByLabelText("Day of month")).toHaveAttribute("readonly");
      expect(within(row).getByText("2026-11-13", { selector: "time" })).toBeVisible();
      expect(rule.schedule).toEqual(originalSchedule);
      expect(api.updateRecurringRule).not.toHaveBeenCalled();
      expect(reads()).toEqual(readCounts);

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(api.updateRecurringRule).not.toHaveBeenCalled();
      expect(rule.schedule).toEqual(originalSchedule);
      await user.click(within(row).getByRole("button", { name: "Edit schedule" }));
      await user.click(screen.getByRole("button", { name: "Save schedule" }));
      expect(api.updateRecurringRule).toHaveBeenCalledExactlyOnceWith(
        rule.id,
        rule.revision,
        expect.objectContaining({ schedule: { ...originalSchedule, day: 5 } }),
        { signal: expect.any(AbortSignal) }
      );
      expect(within(row).getByText("2026-11-13", { selector: "time" })).toBeVisible();
      const saved = {
        ...rule,
        revision: rule.revision + 1,
        schedule: { ...originalSchedule, day: 5 },
        nextOccurrenceOn: "2026-11-05",
      };
      await act(async () => write.resolve(saved));
      await waitFor(() => expect(screen.queryByLabelText("Start date")).toBeNull());
      expect(within(row).getByText("2026-11-05", { selector: "time" })).toBeVisible();
      expect(rule.schedule).toEqual(originalSchedule);
      expect(api.createExpense).not.toHaveBeenCalled();
      expect(api.updateExpense).not.toHaveBeenCalled();
      expect(api.createRecurringRule).not.toHaveBeenCalled();
    }
  );

  it.each(["project", "shared"])(
    "keeps %s edit frequency fields linked to the start date and clears the optional end date",
    async (mode) => {
      const user = userEvent.setup();
      const { api, projectId, rule, write } = fixture(mode);
      rule.schedule = { ...rule.schedule, endOn: "2027-12-31" };
      render(<LedgerScreen api={api} go={vi.fn()} mode={mode} projectId={projectId} />);
      const row = (await screen.findByRole("heading", { name: rule.purpose })).closest("article");
      await user.click(within(row).getByRole("button", { name: "Edit schedule" }));
      fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-11-08" } });
      fireEvent.change(screen.getByLabelText("Frequency"), { target: { value: "weekly" } });
      expect(screen.getByLabelText("Weekday")).toHaveValue("Sunday");
      expect(screen.getByLabelText("Weekday")).toHaveAttribute("readonly");
      fireEvent.change(screen.getByLabelText("Frequency"), { target: { value: "yearly" } });
      expect(screen.getByLabelText("Day of month")).toHaveValue(8);
      expect(screen.getByLabelText("Month of year")).toHaveValue(11);
      expect(screen.getByLabelText("Month of year")).toHaveAttribute("readonly");
      fireEvent.change(screen.getByLabelText("Frequency"), { target: { value: "quarterly" } });
      expect(screen.getByLabelText("Month of quarter")).toHaveValue("Second month");
      expect(screen.getByLabelText("Month of quarter")).toHaveAttribute("readonly");
      const endDate = screen.getByLabelText("End date (optional)");
      expect(endDate).toHaveValue("2027-12-31");
      await user.click(screen.getByRole("button", { name: "Clear end date" }));
      expect(endDate).toHaveValue("");
      expect(endDate).not.toBeRequired();
      expect(screen.getByRole("button", { name: "Clear end date" })).toBeDisabled();
      expect(screen.getByLabelText("Start date")).toHaveValue("2026-11-08");
      expect(api.updateRecurringRule).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Save schedule" }));
      const savedSchedule = {
        frequency: "quarterly",
        day: 8,
        quarterMonth: 2,
        timezone: "Asia/Shanghai",
        startOn: "2026-11-08",
        endOn: null,
      };
      expect(api.updateRecurringRule).toHaveBeenCalledExactlyOnceWith(
        rule.id,
        rule.revision,
        expect.objectContaining({ schedule: savedSchedule }),
        { signal: expect.any(AbortSignal) }
      );
      await act(async () => write.resolve({
        ...rule,
        revision: rule.revision + 1,
        schedule: savedSchedule,
        nextOccurrenceOn: "2027-02-08",
      }));
      await waitFor(() => expect(screen.queryByLabelText("Start date")).toBeNull());
      expect(within(row).getByText("2027-02-08", { selector: "time" })).toBeVisible();
      expect(api.createExpense).not.toHaveBeenCalled();
      expect(api.updateExpense).not.toHaveBeenCalled();
    }
  );
});
