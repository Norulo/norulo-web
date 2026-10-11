import { useId } from "react";
import { T, useLang } from "../i18n.jsx";

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
  const update = (name, value) => onChange({ ...schedule, [name]: value });
  const number = (event) => (event.target.value === "" ? "" : Number(event.target.value));
  const frequency = schedule.frequency || "monthly";
  return (
    <div className="ledger-fields recurring-schedule-fields">
      <div className="ledger-field">
        <label htmlFor={`${id}-frequency`}>{T("Frequency")}</label>
        <select
          id={`${id}-frequency`}
          value={frequency}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...schedule,
              frequency: event.target.value,
              weekday: schedule.weekday ?? 1,
              day: schedule.day ?? 1,
              quarterMonth: schedule.quarterMonth ?? 1,
              month: schedule.month ?? 1,
            })
          }
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
          <select
            id={`${id}-weekday`}
            value={schedule.weekday ?? 1}
            disabled={disabled}
            onChange={(event) => update("weekday", Number(event.target.value))}
          >
            {weekdays().map((label, index) => (
              <option key={index + 1} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
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
            value={schedule.day ?? 1}
            disabled={disabled}
            onChange={(event) => update("day", number(event))}
          />
        </label>
      )}
      {frequency === "quarterly" && (
        <div className="ledger-field">
          <label htmlFor={`${id}-quarter`}>{T("Month of quarter")}</label>
          <select
            id={`${id}-quarter`}
            value={schedule.quarterMonth ?? 1}
            disabled={disabled}
            onChange={(event) => update("quarterMonth", Number(event.target.value))}
          >
            {[T("First month"), T("Second month"), T("Third month")].map((label, index) => (
              <option key={index + 1} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
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
            value={schedule.month ?? 1}
            disabled={disabled}
            onChange={(event) => update("month", number(event))}
          />
        </label>
      )}
      <label>
        {T("Time zone")}
        <input
          value={schedule.timezone || ""}
          required
          maxLength={100}
          disabled={disabled}
          placeholder={T("e.g. Europe/Paris")}
          onChange={(event) => update("timezone", event.target.value)}
        />
      </label>
      <label>
        {T("End date (optional)")}
        <input
          type="date"
          value={schedule.endOn || ""}
          min={schedule.startOn || undefined}
          disabled={disabled}
          onChange={(event) => update("endOn", event.target.value || null)}
        />
      </label>
    </div>
  );
}
