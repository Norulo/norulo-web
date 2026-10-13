import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimezonePicker } from "./timezone-picker.jsx";
import { TIMEZONE_PICKER_COPY } from "../locales/timezone-picker.js";
import { setLang } from "../i18n.jsx";
import { installAnimationFrameMock } from "../test/animation-frame.js";

afterEach(async () => {
  vi.restoreAllMocks();
  await act(async () => setLang("en"));
});

function harness(props = {}) {
  const onChange = props.onChange || vi.fn();
  function Example() {
    const [value, setValue] = useState(props.value ?? "Asia/Shanghai");
    return (
      <>
        <label htmlFor="fixture-timezone">Time zone</label>
        <TimezonePicker
          id="fixture-timezone"
          label="Time zone"
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
          disabled={props.disabled}
          required
        />
        <button type="button">Outside action</button>
        <output aria-label="Parent time zone">{value}</output>
      </>
    );
  }
  return { ...render(<Example />), onChange };
}

const trigger = () => screen.getByRole("combobox", { name: "Time zone", exact: true });
const search = () => screen.getByRole("searchbox", { name: "Search time zones" });
function custom(value) {
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("option", { name: "Custom", exact: true }));
  const input = screen.getByRole("textbox", { name: "Custom time zone" });
  if (value !== undefined) fireEvent.change(input, { target: { value } });
  return input;
}

describe("TimezonePicker", () => {
  it.each(["en", "zh", "ja", "ko", "fr", "es"])("localizes search and the final custom choice in %s", async (locale) => {
    await act(async () => setLang(locale));
    const { onChange } = harness();
    expect(screen.getByLabelText("Time zone")).toBe(trigger());
    expect(trigger()).toHaveAttribute("aria-required", "true");
    expect(trigger()).toHaveTextContent(/^Asia\/Shanghai$/);
    fireEvent.click(trigger());
    const localized = (key) => locale === "en" ? TIMEZONE_PICKER_COPY[key][0] : TIMEZONE_PICKER_COPY[key][1][locale];
    expect(screen.getByRole("searchbox", { name: localized("search") })).toHaveFocus();
    const options = within(screen.getByRole("listbox", { name: "Time zone" })).getAllByRole("option");
    expect(options.length).toBeGreaterThan(100);
    expect(options[0]).toHaveTextContent(/^UTC$/);
    expect(options.at(-1)).toHaveTextContent(localized("custom"));
    expect(screen.getByRole("option", { name: "Asia/Shanghai", exact: true })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("searches hundreds of options and commits a selection with restored focus", async () => {
    const user = userEvent.setup();
    const { onChange } = harness();
    await user.click(trigger());
    await user.type(search(), "paris");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getAllByRole("option").at(-1)).toHaveTextContent(/^Custom$/);
    await user.click(screen.getByRole("option", { name: "Europe/Paris", exact: true }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Europe/Paris");
    expect(trigger()).toHaveTextContent(/^Europe\/Paris$/);
    expect(trigger()).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps Custom reachable when search has no matches", () => {
    const { onChange } = harness();
    fireEvent.click(trigger());
    fireEvent.change(search(), { target: { value: "does not exist" } });
    expect(screen.getByText("No matching time zones. Choose Custom to enter one.")).toHaveAttribute("role", "status");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(screen.getByRole("textbox", { name: "Custom time zone" })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("confirms a custom value explicitly and normalizes its capitalization", () => {
    const { onChange } = harness();
    const input = custom("not-a-zone");
    const confirm = screen.getByRole("button", { name: "Use time zone" });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("maxlength", "100");
    expect(input).toHaveAttribute("pattern", "[A-Za-z0-9_+./-]+");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(confirm).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Parent time zone")).toHaveTextContent(/^Asia\/Shanghai$/);
    fireEvent.change(input, { target: { value: " europe/paris " } });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Europe/Paris");
    expect(trigger()).toHaveFocus();
  });

  it("keeps an existing alias or a zone newer than the browser intact", () => {
    const { onChange, rerender } = harness({ value: "US/Eastern" });
    expect(trigger()).toHaveTextContent(/^US\/Eastern$/);
    fireEvent.click(trigger());
    expect(screen.getByRole("option", { name: "US/Eastern", exact: true })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(search(), { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    rerender(<TimezonePicker id="fixture-timezone" label="Time zone" value="Future/Server_Zone" onChange={onChange} />);
    expect(trigger()).toHaveTextContent(/^Future\/Server_Zone$/);
    fireEvent.click(trigger());
    expect(screen.getByRole("option", { name: "Future/Server_Zone", exact: true })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(search(), { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports keyboard selection and custom confirmation without submitting the form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TimezonePicker id="keyboard-timezone" label="Time zone" value="Asia/Shanghai" onChange={onChange} />
        <button type="submit">Save schedule</button>
      </form>
    );
    trigger().focus();
    await user.keyboard("{ArrowDown}{Home}");
    expect(search()).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[0].id);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("UTC");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}{End}{Enter}");
    const input = screen.getByRole("textbox", { name: "Custom time zone" });
    await user.clear(input);
    await user.type(input, "Europe/Paris{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("Europe/Paris");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not commit an IME composition Enter", () => {
    const { onChange } = harness();
    const input = custom("Europe/Paris");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });

  it("discards search/custom drafts on Escape, outside click, and focus leaving the picker", async () => {
    const user = userEvent.setup();
    const { onChange } = harness();
    const input = custom("Europe/Paris");
    await user.keyboard("{Escape}");
    expect(input).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    custom("Europe/London");
    const outside = screen.getByRole("button", { name: "Outside action" });
    await user.click(outside);
    expect(outside).toHaveFocus();
    expect(screen.queryByRole("textbox", { name: "Custom time zone" })).not.toBeInTheDocument();
    await user.click(trigger());
    await user.type(search(), "Tokyo");
    fireEvent.blur(search(), { relatedTarget: outside });
    outside.focus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(trigger());
    expect(search()).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("returns from custom entry to the searched options", () => {
    harness();
    fireEvent.click(trigger());
    fireEvent.change(search(), { target: { value: "Tokyo" } });
    fireEvent.click(screen.getByRole("option", { name: "Custom", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Back to time zones" }));
    expect(search()).toHaveFocus();
    expect(search()).toHaveValue("Tokyo");
    expect(screen.getByRole("option", { name: "Asia/Tokyo", exact: true })).toBeVisible();
  });

  it("closes custom entry when disabled and never starts selection while busy", () => {
    const onChange = vi.fn();
    const view = render(<TimezonePicker id="busy-zone" label="Time zone" value="UTC" onChange={onChange} />);
    custom("Europe/Paris");
    view.rerender(<TimezonePicker id="busy-zone" label="Time zone" value="UTC" onChange={onChange} disabled />);
    expect(trigger()).toBeDisabled();
    expect(screen.queryByRole("textbox", { name: "Custom time zone" })).not.toBeInTheDocument();
    fireEvent.click(trigger());
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("offers common choices when the enumeration API is unavailable", () => {
    vi.spyOn(Intl, "supportedValuesOf").mockImplementation(() => { throw new RangeError("Unsupported key"); });
    harness({ value: "US/Eastern" });
    fireEvent.click(trigger());
    expect(screen.getByRole("option", { name: "UTC", exact: true })).toBeVisible();
    expect(screen.getByRole("option", { name: "Asia/Shanghai", exact: true })).toBeVisible();
    expect(screen.getByRole("option", { name: "US/Eastern", exact: true })).toBeVisible();
    expect(screen.getAllByRole("option").at(-1)).toHaveTextContent(/^Custom$/);
  });

  it.each(["close", "unmount"])("cancels queued viewport repositioning on %s", (completion) => {
    const frames = installAnimationFrameMock();
    const observers = [];
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("visualViewport", undefined);
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback) {
        this.notify = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }
      observe() {}
    });
    let top = 100;
    const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
      top, bottom: top + 44, left: 0, right: 240, width: 240, height: 44, x: 0, y: top, toJSON() {},
    }));
    let view;
    try {
      view = harness();
      fireEvent.click(trigger());
      const popover = screen.getByRole("listbox").closest(".timezone-picker-popover");
      expect(popover).toHaveAttribute("data-side", "bottom");
      const observer = observers.at(-1);
      top = 650;
      act(() => {
        observer.notify();
        frames.flush();
      });
      expect(popover).toHaveAttribute("data-side", "top");
      act(() => observer.notify());
      const pendingFrame = frames.request.mock.results.at(-1).value;
      bounds.mockClear();
      if (completion === "close") fireEvent.keyDown(search(), { key: "Escape" });
      else view.unmount();
      expect(observer.disconnect).toHaveBeenCalledOnce();
      expect(frames.cancel).toHaveBeenCalledWith(pendingFrame);
      act(() => {
        observer.notify();
        frames.flush();
      });
      expect(bounds).not.toHaveBeenCalled();
      expect(view.onChange).not.toHaveBeenCalled();
    } finally {
      view?.unmount();
      bounds.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
