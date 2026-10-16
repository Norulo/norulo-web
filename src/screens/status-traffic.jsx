import { useEffect, useState } from "react";
import { T, useLang } from "../i18n.jsx";
import { STATUS_TRAFFIC_COPY as COPY } from "../locales/status-traffic.js";

const HOUR_MS = 3600 * 1000;
const SERVICE_IDS = ["web", "api", "mcp"];

function text(key) {
  return T(...COPY[key]);
}

function validTraffic(payload) {
  if (!payload || typeof payload !== "object" || payload.version !== 1) return null;
  return payload;
}

// Loads the public activity summary once per refresh; never polls or retries.
export function useStatusTraffic(revision) {
  const [state, setState] = useState({ loading: true, data: null, failed: false });
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const response = await fetch("/status/traffic.json", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const data = response.ok ? validTraffic(await response.json()) : null;
        if (!cancelled) setState({ loading: false, data, failed: !data });
      } catch {
        if (!cancelled) setState({ loading: false, data: null, failed: true });
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [revision]);
  return state;
}

function clampLevel(value, max) {
  return Number.isInteger(value) && value >= 0 && value <= max ? value : 0;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

// Lays the rolling 168-hour window onto UTC calendar days x hour-of-day.
export function heatmapRows(service, windowStart, lang) {
  const start = Date.parse(windowStart);
  if (!Number.isFinite(start) || !Array.isArray(service?.levels)) return [];
  const dayFormat = new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", timeZone: "UTC" });
  const rows = new Map();
  service.levels.forEach((rawLevel, index) => {
    const at = new Date(start + index * HOUR_MS);
    const key = at.toISOString().slice(0, 10);
    if (!rows.has(key)) rows.set(key, { key, label: dayFormat.format(at), cells: new Array(24).fill(null) });
    rows.get(key).cells[at.getUTCHours()] = {
      index,
      hour: at.getUTCHours(),
      level: clampLevel(rawLevel, 4),
      errors: clampLevel(service.errors?.[index], 2),
    };
  });
  return [...rows.values()];
}

// Hour of day (UTC) with the highest average level, or -1 when always idle.
export function busiestHour(service, windowStart) {
  const start = Date.parse(windowStart);
  if (!Number.isFinite(start)) return -1;
  const firstHour = new Date(start).getUTCHours();
  const totals = new Array(24).fill(0);
  const counts = new Array(24).fill(0);
  (service?.levels || []).forEach((level, index) => {
    const hour = (firstHour + index) % 24;
    totals[hour] += clampLevel(level, 4);
    counts[hour] += 1;
  });
  let best = -1;
  let bestAverage = 0;
  totals.forEach((total, hour) => {
    const average = counts[hour] ? total / counts[hour] : 0;
    if (average > bestAverage) {
      best = hour;
      bestAverage = average;
    }
  });
  return best;
}

function serviceSummary(service, windowStart) {
  const levels = service.levels || [];
  const lastComplete = clampLevel(levels[levels.length - 2], 4);
  const errorHours = (service.errors || []).filter((level) => level > 0).length;
  return { lastComplete, errorHours, busiest: busiestHour(service, windowStart) };
}

function ServiceHeatmap({ service, windowStart, lang }) {
  const rows = heatmapRows(service, windowStart, lang);
  const currentIndex = (service.levels?.length || 0) - 1;
  const { lastComplete, errorHours, busiest } = serviceSummary(service, windowStart);
  const name = T(...COPY.services[service.id]);
  const levelName = (level) => T(...COPY.levels[level]);
  const busiestLabel = busiest >= 0 ? `${pad(busiest)}:00 UTC` : "";
  return (
    <div className="traffic-service">
      <div className="traffic-service-h">
        <div>
          <h3>{name}</h3>
          <span className="traffic-host">{COPY.serviceHosts[service.id]}</span>
        </div>
        <div className="traffic-now">
          <span className="traffic-now-label">{text("lastHour")}</span>
          <span className={"traffic-badge lvl-" + lastComplete}>{levelName(lastComplete)}</span>
        </div>
      </div>
      <div
        className="traffic-grid"
        role="img"
        aria-label={`${name}: ${text("heatmapLabel")}. ${text("lastHour")}: ${levelName(lastComplete)}.${
          busiestLabel ? ` ${text("usuallyBusiest")} ${busiestLabel}.` : ""
        }`}
      >
        <div className="traffic-row traffic-axis" aria-hidden="true">
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour}>{hour % 6 === 0 ? pad(hour) : ""}</span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.key} className="traffic-row" aria-hidden="true">
            <span className="traffic-day">{row.label}</span>
            {row.cells.map((cell, hour) =>
              cell ? (
                <span
                  key={hour}
                  className={
                    `traffic-cell lvl-${cell.level}` +
                    (cell.errors ? ` err-${cell.errors}` : "") +
                    (cell.index === currentIndex ? " current" : "")
                  }
                  title={`${row.label} ${pad(cell.hour)}:00 UTC · ${levelName(cell.level)}${
                    cell.errors === 2
                      ? ` · ${text("legendElevatedErrors")}`
                      : cell.errors === 1
                        ? ` · ${text("legendSomeErrors")}`
                        : ""
                  }`}
                />
              ) : (
                <span key={hour} className="traffic-cell traffic-blank" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="traffic-service-f">
        {busiestLabel && (
          <span>
            {text("usuallyBusiest")} <b>{busiestLabel}</b>
          </span>
        )}
        <span className={errorHours ? "traffic-errors" : ""}>
          {errorHours ? (
            <>
              {text("errorsSome")}: <b>{errorHours}</b>
            </>
          ) : (
            text("errorsNone")
          )}
        </span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="traffic-legend" aria-hidden="true">
      <span>{text("legendLess")}</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span key={level} className={`traffic-cell lvl-${level}`} title={T(...COPY.levels[level])} />
      ))}
      <span>{text("legendMore")}</span>
      <span className="traffic-legend-gap" />
      <span className="traffic-cell lvl-2 err-1" />
      <span>{text("legendSomeErrors")}</span>
      <span className="traffic-cell lvl-2 err-2" />
      <span>{text("legendElevatedErrors")}</span>
      <span className="traffic-cell lvl-2 current" />
      <span>{text("legendCurrent")}</span>
    </div>
  );
}

export function StatusActivity({ traffic }) {
  const lang = useLang();
  const { loading, data } = traffic;
  const services = SERVICE_IDS.map((id) => data?.services?.find((service) => service?.id === id)).filter(
    (service) => Array.isArray(service?.levels) && service.levels.length > 0
  );
  const updated = data?.generatedAt ? new Date(data.generatedAt) : null;
  return (
    <div className="status-card card traffic-card">
      <div className="status-card-h">
        <h2>{text("title")}</h2>
        <span className="muted">{text("timesUtc")}</span>
      </div>
      <p className="traffic-intro">{text("subtitle")}</p>
      {loading && !data ? (
        <p className="traffic-message" role="status">
          {text("loading")}
        </p>
      ) : data?.available && services.length ? (
        <>
          <Legend />
          <div className="traffic-services">
            {services.map((service) => (
              <ServiceHeatmap
                key={service.id}
                service={service}
                windowStart={data.windowStart}
                lang={lang}
              />
            ))}
          </div>
          <p className="traffic-foot">
            {updated && Number.isFinite(updated.getTime()) && (
              <>
                {text("updated")} {updated.toISOString().slice(11, 16)} UTC ·{" "}
              </>
            )}
            {text("refreshNote")}
          </p>
        </>
      ) : (
        <p className="traffic-message" role="status">
          {data?.reason === "not_configured" ? text("notConfigured") : text("unavailable")}
        </p>
      )}
    </div>
  );
}
