import { useId } from "react";
import { T, useLang } from "../i18n.jsx";
import { scheduleFromStartDate } from "../lib/recurring-schedule.js";
import { TimezonePicker } from "./timezone-picker.jsx";
import "./recurring-schedule-fields.css";

export const recurringFrequencies = () => [
  ["weekly", T("Every week", "每周")],
  ["monthly", T("Every month", "每月")],
  ["quarterly", T("Every quarter", "每季度")],
  ["yearly", T("Every year", "每年")],
];
const weekdays = () => [
  T("Monday"),
  T("Tuesday"),
  T("Wednesday"),
  T("Thursday"),
  T("Friday"),
  T("Saturday"),
  T("Sunday"),
];

export function RecurringScheduleFields({ schedule, onChange, disabled = false }) {
  useLang();
  const id = useId();
  const derived = scheduleFromStartDate(schedule);
  const update = (name, value) => onChange({ ...derived, [name]: value });
  const frequency = schedule.frequency || "monthly";
  return (
    <div className="ledger-fields recurring-schedule-fields">
      <div className="ledger-field">
        <label htmlFor={`${id}-frequency`}>{T("Frequency")}</label>
        <select
          id={`${id}-frequency`}
          value={frequency}
          disabled={disabled}
          onChange={(event) => update("frequency", event.target.value)}
        >
          {recurringFrequencies().map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {frequency === "weekly" && (
        <div className="ledger-field">
          <label htmlFor={`${id}-weekday`}>{T("Weekday")}</label>
          <input
            id={`${id}-weekday`}
            value={derived.weekday ? weekdays()[derived.weekday - 1] : ""}
            disabled={disabled}
            readOnly
          />
        </div>
      )}
      {frequency !== "weekly" && (
        <label>
          {T("Day of month")}
          <input
            type="number"
            min="1"
            max="31"
            required
            value={derived.day}
            disabled={disabled}
            readOnly
          />
        </label>
      )}
      {frequency === "quarterly" && (
        <div className="ledger-field">
          <label htmlFor={`${id}-quarter`}>{T("Month of quarter")}</label>
          <input
            id={`${id}-quarter`}
            value={derived.quarterMonth
              ? [T("First month"), T("Second month"), T("Third month")][derived.quarterMonth - 1]
              : ""}
            disabled={disabled}
            readOnly
          />
        </div>
      )}
      {frequency === "yearly" && (
        <label>
          {T("Month of year")}
          <input
            type="number"
            min="1"
            max="12"
            required
            value={derived.month}
            disabled={disabled}
            readOnly
          />
        </label>
      )}
      <div className="ledger-field">
        <label htmlFor={`${id}-timezone`}>{T("Time zone")}</label>
        <TimezonePicker
          id={`${id}-timezone`}
          label={T("Time zone")}
          value={schedule.timezone || ""}
          required
          disabled={disabled}
          onChange={(value) => update("timezone", value)}
        />
      </div>
      <div className="ledger-field">
        <div className="recurring-end-date-heading">
          <label htmlFor={`${id}-end`}>{T("End date (optional)")}</label>
          <button
            type="button"
            className="btn ghost sm"
            aria-label={T("Clear end date")}
            disabled={disabled || !schedule.endOn}
            onClick={() => update("endOn", null)}
          >
            {T("Clear")}
          </button>
        </div>
        <input
          id={`${id}-end`}
          type="date"
          value={schedule.endOn || ""}
          min={schedule.startOn || undefined}
          disabled={disabled}
          onChange={(event) => update("endOn", event.target.value || null)}
        />
      </div>
    </div>
  );
}
