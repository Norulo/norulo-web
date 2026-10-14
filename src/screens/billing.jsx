import { jevAllowance } from "../lib/jev-allowance.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { noruloApi } from "../api/norulo.js";
import { ConfirmDialog } from "../components/confirm-dialog.jsx";
import { SkeletonLine } from "../components/skeleton.jsx";
import { FinancialValue } from "../components/financial-value.jsx";
import { useErrorNotification } from "../components/notifications.jsx";
import { I } from "../icons.jsx";
import { T, useLang } from "../i18n.jsx";
import { requestErrorText } from "../lib/request-error.js";
import { pathFromScreen, screenLinkProps } from "../lib/navigation.js";
import { formatBillingTimestamp } from "../lib/billing-date.js";
import { safeBillingRedirectUrl } from "../lib/trusted-redirects.js";
import { useModalFocus } from "../lib/modal-focus.js";
import { useModalBackdrop } from "../lib/modal-backdrop.js";
import { BILLING_USAGE_COPY } from "../locales/billing-usage.js";
import { Sidebar, Topbar } from "../shell.jsx";
import { ConsoleLayout } from "../components/console-layout.jsx";
import { PublicFooter, PublicHeader } from "./public-layout.jsx";
import "./billing.css";

const CHECKOUT_PENDING_TIMEOUT_MS = 15 * 1000;
const SUBSCRIPTION_ACTIVITY_PAGE_SIZE = 5;

function billingReturnUrl(kind, screen = "billing") {
  const url = new URL(pathFromScreen(screen), window.location.origin);
  url.searchParams.set("screen", screen);
  url.searchParams.set("billing", kind);
  return url.toString();
}

function planById(payload, id) {
  return (payload?.plans || []).find((plan) => plan.id === id) || null;
}

function priceFor(plan, interval) {
  return plan?.prices?.[interval] || null;
}

function priceLabel(price) {
  if (!price) return T("Price unavailable", "价格暂不可用");
  const amount = priceAmount(price.amount);
  if (amount == null) return T("Price unavailable", "价格暂不可用");
  if (amount === 0) return "$0";
  return `${currencySymbol(price.currency)}${amount}`;
}

function currencySymbol(currency) {
  return String(currency || "USD").toUpperCase() === "USD" ? "$" : `${currency || "USD"} `;
}

function priceAmount(value) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value))
  )
    return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

function normalizedCurrency(price) {
  return String(price?.currency || "USD").toUpperCase();
}

function formattedAmount(value) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function moneyLabel(value, currency) {
  return `${currencySymbol(currency)}${formattedAmount(Math.abs(value))}`;
}

function annualizedPriceAmount(amount, interval) {
  return interval === "year" ? amount : amount * 12;
}

function yearlySavingsLabel(plan) {
  const month = priceFor(plan, "month");
  const year = priceFor(plan, "year");
  const monthly = priceAmount(month?.amount);
  const yearly = priceAmount(year?.amount);
  if (
    !month?.configured ||
    !year?.configured ||
    monthly == null ||
    monthly <= 0 ||
    yearly == null ||
    normalizedCurrency(month) !== normalizedCurrency(year)
  )
    return "";
  const saving = monthly * 12 - yearly;
  if (saving <= 0) return "";
  if (Math.abs(saving - monthly * 2) < 0.000001) return T("2 months free", "免费 2 个月");
  return `${moneyLabel(saving, year.currency)} ${T("less per year", "每年节省")}`;
}

// Listed price difference shown before an upgrade. A cadence switch compares
// annualized listed prices; incomparable prices leave the amount to Creem.
function billingChangeDelta(currentPlan, currentInterval, targetPlan, targetInterval) {
  const currentPrice = priceFor(currentPlan, currentInterval);
  const targetPrice = priceFor(targetPlan, targetInterval);
  const currentAmount = priceAmount(currentPrice?.amount);
  const targetAmount = priceAmount(targetPrice?.amount);
  if (
    currentAmount == null ||
    targetAmount == null ||
    normalizedCurrency(currentPrice) !== normalizedCurrency(targetPrice)
  )
    return null;
  const sameInterval = currentInterval === targetInterval;
  const amount = sameInterval
    ? targetAmount - currentAmount
    : annualizedPriceAmount(targetAmount, targetInterval) -
      annualizedPriceAmount(currentAmount, currentInterval);
  return {
    amount: Math.abs(amount) < 0.000001 ? 0 : amount,
    currency: normalizedCurrency(targetPrice),
    interval: sameInterval ? targetInterval : "year",
  };
}

function planRank(plan) {
  const ranks = { free: 0, pro: 1, max: 2 };
  if (Object.prototype.hasOwnProperty.call(ranks, plan?.id)) return ranks[plan.id];
  return 0;
}

function subscriptionChangeIsUpgrade(currentPlan, currentInterval, targetPlan, targetInterval) {
  const currentRank = planRank(currentPlan);
  const targetRank = planRank(targetPlan);
  if (targetRank > currentRank) {
    return !(currentInterval === "year" && targetInterval === "month");
  }
  return targetRank === currentRank && currentInterval === "month" && targetInterval === "year";
}

function intervalShortLabel(interval) {
  return interval === "year" ? T("per year", "每年") : T("per month", "每月");
}

function BillingChangePrice({ plan, interval }) {
  const price = priceFor(plan, interval);
  const listed = priceAmount(price?.amount) !== null;
  return (
    <span className="billing-change-price">
      <FinancialValue value={priceLabel(price)} numeric={listed} />
      {listed && (
        <>
          {" "}
          <span className="billing-change-period">{intervalShortLabel(interval)}</span>
        </>
      )}
    </span>
  );
}

function BillingChangeDialog({
  details,
  dialogRef,
  closeRef,
  backdropProps,
  busy,
  confirming,
  onClose,
  onConfirm,
}) {
  const { currentPlan, currentInterval, targetPlan, targetInterval, delta } = details;
  const title =
    targetPlan.id === currentPlan.id
      ? T("Switch to yearly billing")
      : T("Upgrade to {plan}").replace("{plan}", planName(targetPlan));
  const saving = delta?.amount < 0;
  const deltaLabel =
    delta && `${delta.amount > 0 ? "+" : ""}${moneyLabel(delta.amount, delta.currency)}`;
  return (
    <div className="modal-back billing-change-back" {...backdropProps}>
      <div
        className="modal billing-change-modal"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="billing-change-title"
        aria-describedby="billing-change-note"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-h">
          <h3 id="billing-change-title">{title}</h3>
          <button
            ref={closeRef}
            className="btn ghost icon"
            type="button"
            aria-label={T("Close billing change confirmation", "Close billing change confirmation")}
            disabled={busy}
            onClick={onClose}
          >
            <I.X size={14} />
          </button>
        </div>
        <div className="modal-body billing-change-body">
          <dl className="billing-change-summary">
            <div className="billing-change-row">
              <dt>{T("Current plan")}</dt>
              <dd>
                <b>{planName(currentPlan)}</b>{" "}
                <BillingChangePrice plan={currentPlan} interval={currentInterval} />
              </dd>
            </div>
            <div className="billing-change-row billing-change-row-target">
              <dt>{T("New plan")}</dt>
              <dd>
                <b>{planName(targetPlan)}</b>{" "}
                <BillingChangePrice plan={targetPlan} interval={targetInterval} />
              </dd>
            </div>
            {delta && (
              <div className="billing-change-row billing-change-row-delta">
                <dt>{saving ? T("You save") : T("Price difference")}</dt>
                <dd>
                  <span className="billing-change-price">
                    <FinancialValue value={deltaLabel} />{" "}
                    <span className="billing-change-period">
                      {intervalShortLabel(delta.interval)}
                    </span>
                  </span>
                </dd>
              </div>
            )}
          </dl>
          <p className="billing-change-note" id="billing-change-note">
            {delta
              ? T(
                  "Creem may charge the prorated difference immediately. Your plan updates after payment confirmation. Final tax and proration are calculated by Creem.",
                  "Creem 可能立即收取按比例计算的差额。支付确认后，套餐才会更新。最终税费与差额由 Creem 计算。"
                )
              : T(
                  "Creem calculates the final charge and tax. Your plan updates after payment confirmation.",
                  "Creem 计算最终扣款与税费。套餐在支付确认后更新。"
                )}
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" type="button" disabled={busy} onClick={onClose}>
            {T("Cancel", "Cancel")}
          </button>
          <button
            className="btn primary billing-change-confirm"
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirming && (
              <span className="spin">
                <I.Refresh size={14} />
              </span>
            )}
            <I.Check size={14} /> {T("Confirm change", "Confirm change")}
          </button>
        </div>
      </div>
    </div>
  );
}

function subscriptionChangeActionKey(targetPlan, targetInterval) {
  return `change-${targetPlan}-${targetInterval}`;
}

function isActiveStatus(status) {
  return ["active", "trialing", "canceling"].includes(String(status || "").toLowerCase());
}

function isRestoredSubscriptionStatus(status) {
  return ["active", "trialing"].includes(String(status || "").toLowerCase());
}

function subscriptionRecords(account) {
  return Array.isArray(account?.subscriptionEvents)
    ? account.subscriptionEvents.filter((record) => record && typeof record === "object")
    : [];
}

function subscriptionRecordKey(record) {
  return (
    record?.eventId ||
    record?.subscriptionId ||
    record?.customerId ||
    T("Subscription", "Subscription")
  );
}

function subscriptionRecordTitle(record) {
  return (
    record?.eventType ||
    record?.subscriptionId ||
    record?.customerId ||
    T("Subscription update", "订阅更新")
  );
}

function subscriptionRecordMeta(record) {
  const subject = record?.subscriptionId || record?.customerId || T("Subscription", "Subscription");
  return [subject, record?.status || "none", record?.interval || "month"]
    .filter(Boolean)
    .join(" - ");
}

function subscriptionEventText(record) {
  const parts = [];
  if (record?.eventId) parts.push(record.eventId);
  if (record?.eventCreated) parts.push(formatBillingTimestamp(record.eventCreated));
  else if (record?.processedAt) parts.push(formatBillingTimestamp(record.processedAt));
  if (record?.stale) parts.push(T("stale", "stale"));
  return parts.join(" - ") || T("billing update", "billing update");
}

function billingAccount(plan) {
  if (plan?.account && typeof plan.account === "object") return plan.account;
  return { status: "none", plan: "free" };
}

function fallbackFreePlan(loading = false) {
  return {
    id: "free",
    name: "Free",
    description: T("Record project and shared expenses.", "记录项目与公共支出。"),
    entitlements: null,
    loading,
    prices: { month: { amount: "0", currency: "USD", interval: "month", configured: true } },
  };
}

function fallbackPaidPlan(id, payload, loading = false) {
  const max = id === "max";
  return {
    id,
    name: max ? "Norulo Max" : payload?.name || "Norulo Pro",
    description:
      payload?.description ||
      (max
        ? T("Norulo project expense ledger for teams.", "面向团队的 Norulo 项目支出账本。")
        : T("Norulo project expense ledger for teams.", "面向团队的 Norulo 项目支出账本。")),
    entitlements: null,
    loading,
    prices: {
      month: {
        amount: null,
        currency: payload?.currency || "USD",
        interval: "month",
        configured: false,
      },
      year: {
        amount: null,
        currency: payload?.currency || "USD",
        interval: "year",
        configured: false,
      },
    },
  };
}

function paidPlansFromPayload(payload) {
  const plans = Array.isArray(payload?.plans) ? payload.plans : [];
  const paid = plans.filter((item) => item && item.id && item.id !== "free");
  return paid.length ? paid : [fallbackPaidPlan("pro", payload)];
}

const PRICING_PLAN_IDS = ["free", "pro", "max"];

function pricingPlanWithFallback(payload, id, loading) {
  const fallback =
    id === "free" ? fallbackFreePlan(loading) : fallbackPaidPlan(id, payload, loading);
  const loaded = planById(payload, id);
  if (!loaded) return fallback;
  return {
    ...fallback,
    ...loaded,
    loading: false,
    prices: {
      ...fallback.prices,
      ...(loaded.prices || {}),
    },
  };
}

function pricingPlansFromPayload(payload, loading = false) {
  return PRICING_PLAN_IDS.map((id) => pricingPlanWithFallback(payload, id, loading));
}

function planName(plan) {
  return plan?.name || T("Plan", "套餐");
}

function planLabel(plan) {
  return String(plan?.id || "").toUpperCase() || T("Plan", "套餐");
}

function usageText(key) {
  return T(...BILLING_USAGE_COPY[key]);
}

function usageMetric(usage, key) {
  if (typeof usage?.workspaceId !== "string" || !usage.workspaceId.trim()) return null;
  const metric = usage[key];
  if (
    !Number.isSafeInteger(metric?.used) ||
    metric.used < 0 ||
    !Number.isSafeInteger(metric?.limit) ||
    metric.limit <= 0
  )
    return null;
  return metric;
}

function jevUsageMetric(usage) {
  if (typeof usage?.workspaceId !== "string" || !usage.workspaceId.trim()) return null;
  const metric = usage.jev;
  if (
    !Number.isSafeInteger(metric?.usedCalls) ||
    metric.usedCalls < 0 ||
    !Number.isSafeInteger(metric.limitCalls) ||
    metric.limitCalls < 0 ||
    !Number.isSafeInteger(metric.remainingCalls) ||
    metric.remainingCalls < 0 ||
    metric.remainingCalls !== Math.max(0, metric.limitCalls - metric.usedCalls) ||
    !(
      (metric.period === "lifetime" && metric.month === null) ||
      (metric.period === "utc-calendar-month" &&
        typeof metric.month === "string" &&
        /^[0-9]{4}-(?:0[1-9]|1[0-2])$/.test(metric.month))
    )
  )
    return null;
  return metric;
}

function BillingUsageMeter({ used, limit, titleId, usedLabel, totalLabel }) {
  // A zero allowance has no defined ratio. Keep its exact values visible,
  // without inventing a denominator or a minimum visible amount of use.
  if (limit === 0) return null;
  return (
    <meter
      className="billing-usage-meter"
      min={0}
      max={limit}
      value={Math.min(used, limit)}
      aria-labelledby={titleId}
      aria-valuetext={`${usageText("used")}: ${usedLabel}; ${usageText("total")}: ${totalLabel}`}
    />
  );
}

function BillingJevUsage({ usage, lang }) {
  const metric = jevUsageMetric(usage);
  const number = (value) => new Intl.NumberFormat(lang).format(value);
  return (
    <section
      className="panel section-split billing-jev-section"
      aria-labelledby="billing-jev-usage-title"
    >
      <div className="section-head">
        <div className="panel-h billing-usage-heading">
          <h2 id="billing-jev-usage-title">{usageText("jevTitle")}</h2>
        </div>
        {metric && (
          <p className="muted billing-usage-meta">
            {metric.period === "lifetime" ? (
              usageText("jevTrial")
            ) : (
              <>
                {usageText("jevMonth")}: <time>{metric.month}</time>
              </>
            )}
          </p>
        )}
      </div>
      <div className="section-body billing-usage-body">
        <div className="billing-usage-grid">
          <article className="billing-usage-row" aria-labelledby="billing-jev-allowance-title">
            <div className="billing-usage-label">
              <I.Activity size={18} aria-hidden="true" />
              <h3 id="billing-jev-allowance-title">{usageText("jevAllowance")}</h3>
            </div>
            {metric ? (
              <>
                <dl className="billing-usage-values">
                  <div className="billing-usage-used">
                    <dt>{usageText("used")}</dt>
                    <dd>
                      <FinancialValue value={number(metric.usedCalls)} />
                    </dd>
                  </div>
                  <div className="billing-usage-total">
                    <dt>{usageText("total")}</dt>
                    <dd>
                      <FinancialValue value={number(metric.limitCalls)} />
                    </dd>
                  </div>
                </dl>
                <p className="muted">
                  {usageText("jevRemaining")}:{" "}
                  <FinancialValue value={number(metric.remainingCalls)} />
                </p>
                <BillingUsageMeter
                  used={metric.usedCalls}
                  limit={metric.limitCalls}
                  titleId="billing-jev-allowance-title"
                  usedLabel={number(metric.usedCalls)}
                  totalLabel={number(metric.limitCalls)}
                />
              </>
            ) : (
              <p className="muted">{usageText("unavailable")}</p>
            )}
          </article>
        </div>
        <p className="muted billing-usage-policy">{usageText("jevPolicy")}</p>
      </div>
    </section>
  );
}

function BillingUsage({ usage, lang, busy, onRefresh }) {
  const number = (value) => new Intl.NumberFormat(lang).format(value);
  return (
    <section
      className="panel section-split billing-ledger-section"
      aria-labelledby="billing-usage-title"
    >
      <div className="section-head">
        <div className="panel-h billing-usage-heading">
          <h2 id="billing-usage-title">{usageText("title")}</h2>
          <button className="btn sm" type="button" disabled={busy} onClick={onRefresh}>
            <I.Refresh size={14} /> {usageText("refresh")}
          </button>
        </div>
        <p className="muted billing-usage-meta">{usageText("scope")}</p>
      </div>
      <div className="section-body billing-usage-body">
        <div className="billing-usage-grid">
          {["projects", "expenseRecords"].map((key) => {
            const metric = usageMetric(usage, key);
            const label = usageText(key);
            const titleId = `billing-usage-${key}`;
            return (
              <article className="billing-usage-row" key={key} aria-labelledby={titleId}>
                <div className="billing-usage-label">
                  {key === "projects" ? (
                    <I.Folder size={18} aria-hidden="true" />
                  ) : (
                    <I.FileCode size={18} aria-hidden="true" />
                  )}
                  <h3 id={titleId}>{label}</h3>
                </div>
                {metric ? (
                  <>
                    <dl className="billing-usage-values">
                      <div className="billing-usage-used">
                        <dt>{usageText("used")}</dt>
                        <dd>
                          <FinancialValue value={number(metric.used)} />
                        </dd>
                      </div>
                      <div className="billing-usage-total">
                        <dt>{usageText("total")}</dt>
                        <dd>
                          <FinancialValue value={number(metric.limit)} />
                        </dd>
                      </div>
                    </dl>
                    <BillingUsageMeter
                      used={metric.used}
                      limit={metric.limit}
                      titleId={titleId}
                      usedLabel={number(metric.used)}
                      totalLabel={number(metric.limit)}
                    />
                  </>
                ) : (
                  <p className="muted">{usageText("unavailable")}</p>
                )}
              </article>
            );
          })}
        </div>
        <p className="muted billing-usage-policy">{usageText("retention")}</p>
      </div>
    </section>
  );
}

function BillingSkeleton() {
  return (
    <div className="set-body billing-body billing-skeleton" aria-busy="true">
      <div className="panel section-split">
        <div className="section-head">
          <SkeletonLine className="sk-line sk-w-34 sk-h-16" />
        </div>
        <div className="section-body">
          <div className="skeleton-stack">
            <SkeletonLine className="sk-line sk-w-34 sk-h-28" />
            <SkeletonLine className="sk-line sk-w-52" />
          </div>
        </div>
      </div>

      <div className="panel section-split billing-ledger-section">
        <div className="section-head">
          <SkeletonLine className="sk-line sk-w-52 sk-h-16" />
          <SkeletonLine className="sk-line" />
          <SkeletonLine className="sk-line sk-w-70" />
        </div>
        <div className="section-body billing-usage-body">
          <div className="billing-usage-grid">
            {["projects", "expenses"].map((key) => (
              <div className="billing-usage-row" key={key}>
                <SkeletonLine className="sk-line sk-w-26" />
                <dl className="billing-usage-values">
                  {["used", "total"].map((field) => (
                    <div key={field} className={`billing-usage-${field}`}>
                      <dt>
                        <SkeletonLine className="sk-line sk-w-70" />
                      </dt>
                      <dd>
                        <SkeletonLine
                          className={`sk-line sk-w-52 ${field === "used" ? "sk-h-40" : "sk-h-28"}`}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel section-split">
        <div className="section-head">
          <SkeletonLine className="sk-line sk-w-52 sk-h-16" />
        </div>
        <div className="section-body">
          <div className="sub-record-list">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="sub-record-row skeleton-row" key={`billing-record-skeleton-${index}`}>
                <div className="sub-record-main">
                  <SkeletonLine className="sk-line sk-w-42 sk-h-16" />
                  <SkeletonLine className="sk-line sk-w-56" />
                </div>
                <SkeletonLine className="sk-line sk-w-16 sk-h-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingLoadError({ error, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <div className="panel-h">
        <I.Lightbulb size={16} />
        <h2>{T("Billing is unavailable", "Billing is unavailable")}</h2>
      </div>
      <p>{error || T("Unable to load billing data.", "Unable to load billing data.")}</p>
      <button type="button" className="btn" onClick={onRetry}>
        <I.Refresh size={14} /> {T("Retry billing", "Retry billing")}
      </button>
    </div>
  );
}

function PricingLoadError({ error, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <div className="panel-h">
        <I.Lightbulb size={18} />
        <h2>{T("Pricing is unavailable", "Pricing is unavailable")}</h2>
      </div>
      <p>{error || T("Unable to load pricing.", "Unable to load pricing.")}</p>
      <button type="button" className="btn primary" onClick={onRetry}>
        <I.Refresh size={14} /> {T("Retry pricing", "Retry pricing")}
      </button>
    </div>
  );
}

export function BillingScreen({ go, navigate = (url) => window.location.assign(url) }) {
  const lang = useLang();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  useErrorNotification(error, {
    title: T("Billing error", "Billing error"),
    key: `billing:${error}`,
  });
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState("");
  const writing = Boolean(pendingAction);
  const [changeDraft, setChangeDraft] = useState(null);
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [activityPage, setActivityPage] = useState({ events: null, index: 0 });
  const billingMutationRef = useRef("");
  const billingReadRef = useRef(false);
  const mountedRef = useRef(true);
  const changeDialogRef = useRef(null);
  const changeCloseRef = useRef(null);
  const billingBackgroundRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      billingMutationRef.current = "";
    };
  }, []);

  const refreshBillingPlan = useCallback(async () => {
    const payload = await noruloApi.billing.getPlan();
    if (!mountedRef.current) return payload;
    setPlan(payload);
    setError("");
    return payload;
  }, []);

  const loadBillingPlan = useCallback(async () => {
    if (billingMutationRef.current || billingReadRef.current) return;
    billingReadRef.current = true;
    setLoading(true);
    setError("");
    try {
      const payload = await noruloApi.billing.getPlan();
      if (!mountedRef.current) return;
      setPlan(payload);
    } catch (err) {
      if (mountedRef.current)
        setError(requestErrorText(err, T("Unable to load billing.", "无法加载账单。")));
    } finally {
      billingReadRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBillingPlan();
  }, [loadBillingPlan]);

  const freePlan = useMemo(() => planById(plan, "free") || fallbackFreePlan(), [plan]);
  const paidPlans = useMemo(() => paidPlansFromPayload(plan), [plan]);
  const paidPlanById = useMemo(
    () => Object.fromEntries(paidPlans.map((paidPlan) => [paidPlan.id, paidPlan])),
    [paidPlans]
  );
  const proPlan = paidPlanById.pro || fallbackPaidPlan("pro", plan);

  const account = billingAccount(plan);
  const accountStatus = account.status || "none";
  const active = isActiveStatus(accountStatus);
  const activePaid = active && account.plan && account.plan !== "free";
  const cancellationScheduled = String(accountStatus).toLowerCase() === "canceling";
  const paymentPending = Boolean(account.pendingChange);
  const subscriptionInterval = account.interval || "month";
  const currentPlan = activePaid ? paidPlanById[account.plan] || proPlan : freePlan;
  const subscriptions = subscriptionRecords(account);
  const billingEnabled = Boolean(plan?.enabled);
  const alternatePaidPlans = paidPlans.filter(
    (paidPlan) =>
      !cancellationScheduled &&
      priceFor(paidPlan, subscriptionInterval)?.configured &&
      subscriptionChangeIsUpgrade(currentPlan, subscriptionInterval, paidPlan, subscriptionInterval)
  );
  const activityPageCount = Math.ceil(subscriptions.length / SUBSCRIPTION_ACTIVITY_PAGE_SIZE);
  // Paging is local to the loaded events (newest first). A fresh Server read
  // returns a new list and starts again from its newest page.
  const activityPageIndex =
    activityPage.events === account.subscriptionEvents
      ? Math.min(activityPage.index, Math.max(0, activityPageCount - 1))
      : 0;
  const visibleSubscriptions = subscriptions.slice(
    activityPageIndex * SUBSCRIPTION_ACTIVITY_PAGE_SIZE,
    (activityPageIndex + 1) * SUBSCRIPTION_ACTIVITY_PAGE_SIZE
  );
  const showActivityPage = (index) =>
    setActivityPage({ events: account.subscriptionEvents, index });
  const changeDetails = useMemo(() => {
    if (!changeDraft) return null;
    const targetPlan = paidPlanById[changeDraft.targetPlan] || currentPlan;
    const targetInterval = changeDraft.targetInterval || subscriptionInterval;
    if (
      !subscriptionChangeIsUpgrade(currentPlan, subscriptionInterval, targetPlan, targetInterval)
    ) {
      return null;
    }
    return {
      currentPlan,
      currentInterval: subscriptionInterval,
      targetPlan,
      targetInterval,
      delta: billingChangeDelta(currentPlan, subscriptionInterval, targetPlan, targetInterval),
      actionKey: subscriptionChangeActionKey(targetPlan.id, targetInterval),
    };
  }, [changeDraft, currentPlan, paidPlanById, subscriptionInterval]);

  const changeSubscription = async ({
    targetPlan = account.plan,
    targetInterval = subscriptionInterval,
  }) => {
    const requestedPlan = paidPlanById[targetPlan] || currentPlan;
    if (
      !subscriptionChangeIsUpgrade(currentPlan, subscriptionInterval, requestedPlan, targetInterval)
    ) {
      setError("This subscription change is not supported from Norulo.");
      setChangeDraft(null);
      return;
    }
    const actionKey = subscriptionChangeActionKey(targetPlan, targetInterval);
    if (billingMutationRef.current) return;
    billingMutationRef.current = actionKey;
    setPendingAction(actionKey);
    setError("");
    try {
      const result = await noruloApi.billing.changeSubscriptionInterval({
        plan: targetPlan,
        interval: targetInterval,
        returnUrl: billingReturnUrl("return"),
      });
      if (!mountedRef.current) return;
      if (result?.url) {
        navigate(safeBillingRedirectUrl(result.url, "billing interval URL"));
        return;
      }
      if (result?.pending)
        setPlan((current) => ({
          ...current,
          account: {
            ...billingAccount(current),
            pendingChange: { plan: targetPlan, interval: targetInterval },
          },
        }));
      setChangeDraft(null);
      await refreshBillingPlan();
      if (!mountedRef.current) return;
      setChangeDraft(null);
    } catch (err) {
      if (mountedRef.current)
        setError(requestErrorText(err, T("Unable to change subscription.", "无法更改订阅。")));
    } finally {
      if (billingMutationRef.current === actionKey) billingMutationRef.current = "";
      if (mountedRef.current) {
        setPendingAction((current) => (current === actionKey ? "" : current));
      }
    }
  };

  const requestSubscriptionChange = ({
    targetPlan = account.plan,
    targetInterval = subscriptionInterval,
  }) => {
    if (billingMutationRef.current) return;
    setError("");
    const requestedPlan = paidPlanById[targetPlan] || currentPlan;
    if (
      !subscriptionChangeIsUpgrade(currentPlan, subscriptionInterval, requestedPlan, targetInterval)
    ) {
      setError("This subscription change is not supported from Norulo.");
      setChangeDraft(null);
      return;
    }
    setChangeDraft({
      targetPlan,
      targetInterval,
    });
  };

  const closeChangeConfirmation = () => {
    if (!billingMutationRef.current) setChangeDraft(null);
  };
  const changeBackdropProps = useModalBackdrop({
    open: Boolean(changeDetails),
    onClose: closeChangeConfirmation,
    busy: Boolean(pendingAction),
  });

  useModalFocus({
    open: Boolean(changeDetails),
    dialogRef: changeDialogRef,
    initialFocusRef: changeCloseRef,
    backgroundRef: billingBackgroundRef,
    onClose: closeChangeConfirmation,
    busy: Boolean(pendingAction),
  });

  const confirmSubscriptionChange = () => {
    if (!changeDetails) return;
    changeSubscription({
      targetPlan: changeDetails.targetPlan.id,
      targetInterval: changeDetails.targetInterval,
    });
  };

  const cancelSubscription = async () => {
    const actionKey = "cancel";
    if (billingMutationRef.current) return;
    billingMutationRef.current = actionKey;
    setPendingAction(actionKey);
    setError("");
    try {
      const result = await noruloApi.billing.cancelSubscription({
        mode: "scheduled",
        returnUrl: billingReturnUrl("return"),
      });
      if (!mountedRef.current) return;
      setPlan((current) => ({
        ...current,
        account: {
          ...(billingAccount(current) || {}),
          status: result?.status || "canceling",
          cancelAtPeriodEnd: result?.cancelAtPeriodEnd ?? true,
        },
      }));
      await refreshBillingPlan();
    } catch (err) {
      if (mountedRef.current)
        setError(requestErrorText(err, T("Unable to cancel subscription.", "无法取消订阅。")));
    } finally {
      if (billingMutationRef.current === actionKey) billingMutationRef.current = "";
      if (mountedRef.current) {
        setPendingAction((current) => (current === actionKey ? "" : current));
        setCancelConfirmationOpen(false);
      }
    }
  };

  const requestCancelSubscription = () => {
    if (!billingMutationRef.current && !pendingAction) setCancelConfirmationOpen(true);
  };

  const resumeSubscription = async () => {
    const actionKey = "resume";
    if (billingMutationRef.current) return;
    billingMutationRef.current = actionKey;
    setPendingAction(actionKey);
    setError("");
    try {
      const result = await noruloApi.billing.resumeSubscription({
        returnUrl: billingReturnUrl("return"),
      });
      if (!mountedRef.current) return;
      const nextStatus = result?.status || "active";
      const restoredSubscription = isRestoredSubscriptionStatus(nextStatus);
      setPlan((current) => ({
        ...current,
        account: {
          ...(billingAccount(current) || {}),
          plan: result?.plan || billingAccount(current)?.plan,
          interval: result?.interval || billingAccount(current)?.interval,
          status: nextStatus,
          cancelAtPeriodEnd:
            typeof result?.cancelAtPeriodEnd === "boolean"
              ? result.cancelAtPeriodEnd
              : restoredSubscription
                ? false
                : billingAccount(current)?.cancelAtPeriodEnd,
          canceledAt:
            result && Object.prototype.hasOwnProperty.call(result, "canceledAt")
              ? result.canceledAt
              : restoredSubscription
                ? null
                : billingAccount(current)?.canceledAt,
        },
      }));
      await refreshBillingPlan();
    } catch (err) {
      if (mountedRef.current)
        setError(requestErrorText(err, T("Unable to resume subscription.", "无法恢复订阅。")));
    } finally {
      if (billingMutationRef.current === actionKey) billingMutationRef.current = "";
      if (mountedRef.current) {
        setPendingAction((current) => (current === actionKey ? "" : current));
      }
    }
  };

  return (
    <div className="app fade-in">
      <div ref={billingBackgroundRef} className="billing-background">
        <Topbar
          go={go}
          breadcrumbs={[{ label: T("Billing", "Billing") }]}
          loading={loading || writing}
          navigationDisabled={writing}
        />
        <ConsoleLayout>
          <Sidebar section="billing" go={go} navigationDisabled={writing} />
          <main id="main-content" tabIndex={-1} className="main" aria-busy={writing}>
            <div className="page-h">
              <div>
                <h1>{T("Billing", "Billing")}</h1>
                <div className="sub">
                  {T(
                    "Norulo platform subscription and payment history. Your project expenses are recorded separately in the ledger.",
                    "这里显示 Norulo 平台订阅和支付历史。项目支出在账本中单独记录。"
                  )}
                </div>
              </div>
              <div className="actions">
                <a className="btn" {...screenLinkProps(go, "pricing", {}, writing)}>
                  <I.Trend size={14} /> {T("View pricing", "查看价格")}
                </a>
              </div>
            </div>

            <div className="set-shell">
              <aside className="set-side">
                <button className="set-side-i active">
                  <I.Package size={14} />
                  <span>{T("Plan", "Plan")}</span>
                </button>
                <a className="set-side-i" {...screenLinkProps(go, "terms", {}, writing)}>
                  <I.FileCode size={14} />
                  <span>{T("Terms", "Terms")}</span>
                </a>
                <a className="set-side-i" {...screenLinkProps(go, "privacy", {}, writing)}>
                  <I.Lock size={14} />
                  <span>{T("Privacy", "Privacy")}</span>
                </a>
              </aside>

              {loading ? (
                <BillingSkeleton />
              ) : error && !plan ? (
                <BillingLoadError error={error} onRetry={loadBillingPlan} />
              ) : (
                <div className="set-body billing-body">
                  <section className="panel section-split billing-plan-section">
                    <h2>{T("Plan", "Plan")}</h2>
                    <div className="section-body">
                      <div className="billing-summary">
                        <div className="billing-summary-main">
                          <div>
                            <b>{planName(currentPlan) || T("Free", "免费")}</b>
                            <div className="muted">
                              {accountStatus} -{" "}
                              {activePaid
                                ? T(
                                    `Billed ${subscriptionInterval}`,
                                    `按 ${subscriptionInterval} 计费`
                                  )
                                : T("Upgrade from Pricing", "前往价格页升级")}
                            </div>
                          </div>
                        </div>
                        {activePaid && (
                          <div className="billing-actions">
                            {alternatePaidPlans.map((paidPlan) => (
                              <button
                                key={paidPlan.id}
                                className="btn primary"
                                disabled={
                                  !billingEnabled || paymentPending || Boolean(pendingAction)
                                }
                                onClick={() =>
                                  requestSubscriptionChange({
                                    targetPlan: paidPlan.id,
                                    targetInterval: subscriptionInterval,
                                  })
                                }
                              >
                                {pendingAction ===
                                  `change-${paidPlan.id}-${subscriptionInterval}` && (
                                  <span className="spin">
                                    <I.Refresh size={14} />
                                  </span>
                                )}
                                <I.Trend size={14} />{" "}
                                {T(
                                  `Switch to ${planLabel(paidPlan)}`,
                                  `切换到 ${planLabel(paidPlan)}`
                                )}
                              </button>
                            ))}
                            {subscriptionInterval === "month" &&
                              !cancellationScheduled &&
                              priceFor(currentPlan, "year")?.configured && (
                                <button
                                  className="btn"
                                  disabled={
                                    !billingEnabled || paymentPending || Boolean(pendingAction)
                                  }
                                  onClick={() =>
                                    requestSubscriptionChange({ targetInterval: "year" })
                                  }
                                >
                                  {pendingAction === `change-${account.plan}-year` && (
                                    <span className="spin">
                                      <I.Refresh size={14} />
                                    </span>
                                  )}
                                  <I.Package size={14} /> {T("Switch to yearly", "切换为按年")}
                                </button>
                              )}
                            {cancellationScheduled ? (
                              <button
                                className="btn"
                                disabled={
                                  !billingEnabled || paymentPending || Boolean(pendingAction)
                                }
                                onClick={resumeSubscription}
                              >
                                {pendingAction === "resume" && (
                                  <span className="spin">
                                    <I.Refresh size={14} />
                                  </span>
                                )}
                                <I.Refresh size={14} /> {T("Resume renewal", "Resume renewal")}
                              </button>
                            ) : (
                              <button
                                className="btn"
                                disabled={
                                  !billingEnabled || paymentPending || Boolean(pendingAction)
                                }
                                onClick={requestCancelSubscription}
                                aria-busy={pendingAction === "cancel"}
                              >
                                {pendingAction === "cancel" && (
                                  <span className="spin">
                                    <I.Refresh size={14} />
                                  </span>
                                )}
                                <I.X size={14} /> {T("Cancel renewal", "取消续订")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="billing-usage-layout">
                    <BillingUsage
                      usage={plan?.ledgerUsage}
                      lang={lang}
                      busy={loading || writing}
                      onRefresh={loadBillingPlan}
                    />
                    {["free", "pro", "max"].includes(account.plan) && (
                      <BillingJevUsage usage={plan?.ledgerUsage} lang={lang} />
                    )}
                  </div>

                  {(paymentPending ||
                    new URLSearchParams(window.location.search).get("billing") === "success") && (
                    <div className="notice" role="status">
                      <div>
                        <b>
                          {paymentPending || !activePaid
                            ? T("Awaiting payment confirmation", "正在等待支付确认")
                            : T("Subscription confirmed", "订阅已确认")}
                        </b>
                        <p>
                          {T(
                            "Your plan follows verified payment updates. Refresh billing to check the latest status.",
                            "套餐以验证后的支付更新为准。刷新账单以查看最新状态。"
                          )}
                        </p>
                        <button
                          className="btn"
                          disabled={loading || Boolean(pendingAction)}
                          onClick={loadBillingPlan}
                        >
                          <I.Refresh size={14} /> {T("Refresh billing", "刷新账单")}
                        </button>
                      </div>
                    </div>
                  )}

                  {subscriptions.length > 0 && (
                    <section className="panel section-split">
                      <h2>{T("Subscription activity", "订阅动态")}</h2>
                      <div className="section-body">
                        <div className="sub-record-list">
                          {visibleSubscriptions.map((record, index) => (
                            <div
                              className="sub-record-row"
                              key={`${subscriptionRecordKey(record)}-${
                                activityPageIndex * SUBSCRIPTION_ACTIVITY_PAGE_SIZE + index
                              }`}
                            >
                              <div className="sub-record-main">
                                <b>{subscriptionRecordTitle(record)}</b>
                                <div className="muted">{subscriptionRecordMeta(record)}</div>
                                <div className="muted">{subscriptionEventText(record)}</div>
                              </div>
                              <span className="tag">{record?.plan || account.plan || "free"}</span>
                            </div>
                          ))}
                        </div>
                        {activityPageCount > 1 && (
                          <nav
                            className="billing-activity-pagination panel-actions"
                            aria-label={T("Subscription activity pagination")}
                          >
                            <button
                              className="btn"
                              type="button"
                              disabled={activityPageIndex === 0}
                              onClick={() => showActivityPage(activityPageIndex - 1)}
                            >
                              {T("Previous")}
                            </button>
                            <span
                              className="billing-activity-page"
                              aria-live="polite"
                              aria-atomic="true"
                            >
                              {T("Page {page} of {count}")
                                .replace("{page}", String(activityPageIndex + 1))
                                .replace("{count}", String(activityPageCount))}
                            </span>
                            <button
                              className="btn"
                              type="button"
                              disabled={activityPageIndex >= activityPageCount - 1}
                              onClick={() => showActivityPage(activityPageIndex + 1)}
                            >
                              {T("Next")}
                            </button>
                          </nav>
                        )}
                      </div>
                    </section>
                  )}

                  {!billingEnabled && !error && (
                    <div className="muted">
                      {T(
                        "Free is available. Paid subscriptions are not open yet.",
                        "Free 套餐可用，付费订阅尚未开放。"
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </ConsoleLayout>
      </div>
      {changeDetails && (
        <BillingChangeDialog
          details={changeDetails}
          dialogRef={changeDialogRef}
          closeRef={changeCloseRef}
          backdropProps={changeBackdropProps}
          busy={Boolean(pendingAction)}
          confirming={pendingAction === changeDetails.actionKey}
          onClose={closeChangeConfirmation}
          onConfirm={confirmSubscriptionChange}
        />
      )}
      <ConfirmDialog
        open={cancelConfirmationOpen}
        title={T("Cancel subscription renewal?", "Cancel subscription renewal?")}
        description={T(
          "Renewal will be canceled at the end of the current billing period. You can resume renewal later.",
          "Renewal will be canceled at the end of the current billing period. You can resume renewal later."
        )}
        confirmLabel={T("Confirm cancellation", "Confirm cancellation")}
        cancelLabel={T("Cancel", "Cancel")}
        onCancel={() => {
          if (!billingMutationRef.current) setCancelConfirmationOpen(false);
        }}
        onConfirm={cancelSubscription}
        busy={pendingAction === "cancel"}
        danger
        backgroundRef={billingBackgroundRef}
        dialogId="cancel-subscription"
      />
    </div>
  );
}

export function PricingScreen({
  go,
  auth = null,
  navigate = (url) => window.location.assign(url),
}) {
  useLang();
  const [plan, setPlan] = useState(null);
  const [interval, setInterval] = useState("month");
  const [error, setError] = useState("");
  useErrorNotification(error, {
    title: T("Pricing error", "Pricing error"),
    key: `pricing:${error}`,
  });
  const [pendingAction, setPendingAction] = useState("");
  const signedIn = Boolean(auth?.authenticated);
  const checkoutPendingRef = useRef(false);
  const checkoutTimeoutRef = useRef(null);
  const checkoutRequestRef = useRef(0);
  const checkoutAbortRef = useRef(null);

  const clearCheckoutTimeout = useCallback(() => {
    if (checkoutTimeoutRef.current == null) return;
    window.clearTimeout(checkoutTimeoutRef.current);
    checkoutTimeoutRef.current = null;
  }, []);

  const abortCheckoutRequest = useCallback(() => {
    if (checkoutAbortRef.current == null) return;
    checkoutAbortRef.current.abort();
    checkoutAbortRef.current = null;
  }, []);

  const invalidateCheckoutRequest = useCallback(() => {
    checkoutRequestRef.current += 1;
    abortCheckoutRequest();
    clearCheckoutTimeout();
  }, [abortCheckoutRequest, clearCheckoutTimeout]);

  const resetCheckoutPending = useCallback(() => {
    checkoutPendingRef.current = false;
    invalidateCheckoutRequest();
    setPendingAction("");
  }, [invalidateCheckoutRequest]);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) resetCheckoutPending();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      invalidateCheckoutRequest();
    };
  }, [invalidateCheckoutRequest, resetCheckoutPending]);

  const loadPricingPlan = useCallback(async () => {
    setError("");
    try {
      const payload = await noruloApi.billing.getPlan();
      setPlan(payload);
      const billingInterval = payload?.account?.interval || "";
      if (billingInterval === "year") setInterval("year");
    } catch (err) {
      setError(requestErrorText(err, T("Unable to load pricing.", "无法加载价格。")));
    }
  }, []);

  useEffect(() => {
    void loadPricingPlan();
  }, [loadPricingPlan]);

  const pricingLoading = plan === null;
  const pricingPlans = useMemo(
    () => pricingPlansFromPayload(plan, pricingLoading),
    [plan, pricingLoading]
  );
  const [freePlan, ...paidPlans] = pricingPlans;

  const account = billingAccount(plan);
  const activePaid = isActiveStatus(account.status) && account.plan && account.plan !== "free";
  const billingEnabled = Boolean(plan?.enabled);
  const checkoutPendingTimeoutMs =
    Number(plan?.checkoutTimeoutMs) > 0
      ? Number(plan.checkoutTimeoutMs)
      : CHECKOUT_PENDING_TIMEOUT_MS;
  const startCheckout = async (targetPlan) => {
    if (checkoutPendingRef.current) return;
    if (!signedIn) {
      go("login");
      return;
    }
    checkoutPendingRef.current = true;
    checkoutRequestRef.current += 1;
    abortCheckoutRequest();
    const requestId = checkoutRequestRef.current;
    const checkoutController = new AbortController();
    checkoutAbortRef.current = checkoutController;
    clearCheckoutTimeout();
    setPendingAction(`checkout-${targetPlan.id}`);
    setError("");
    checkoutTimeoutRef.current = window.setTimeout(() => {
      if (checkoutRequestRef.current !== requestId) return;
      setError(
        T(
          "Checkout is taking longer than expected. Please try again.",
          "Checkout is taking longer than expected. Please try again."
        )
      );
      resetCheckoutPending();
    }, checkoutPendingTimeoutMs);
    try {
      const session = await noruloApi.billing.createCheckoutSession(
        {
          plan: targetPlan.id,
          interval,
          successUrl: billingReturnUrl("success", "billing"),
          cancelUrl: billingReturnUrl("cancel", "pricing"),
        },
        { signal: checkoutController.signal }
      );
      if (checkoutRequestRef.current !== requestId) return;
      if (!session?.url) throw new Error("Billing provider did not return a checkout URL.");
      const checkoutUrl = safeBillingRedirectUrl(session.url, "billing checkout URL");
      clearCheckoutTimeout();
      checkoutPendingRef.current = false;
      setPendingAction("");
      navigate(checkoutUrl);
    } catch (err) {
      if (checkoutRequestRef.current !== requestId) return;
      setError(requestErrorText(err, T("Unable to start checkout.", "无法发起结账。")));
      checkoutPendingRef.current = false;
      setPendingAction("");
    } finally {
      if (checkoutRequestRef.current === requestId) {
        clearCheckoutTimeout();
        if (checkoutAbortRef.current === checkoutController) checkoutAbortRef.current = null;
      }
    }
  };

  return (
    <div className="landing fade-in">
      <PublicHeader go={go} current="pricing" auth={auth} />
      <main id="main-content" tabIndex={-1}>
        <section className="pricing-hero">
          <div className="lp-hero-tag">
            <span className="dot pricing-hero-dot" />
            <span>{T("Account plans", "Account plans")}</span>
          </div>
          <h1 className="lp-title">{T("Pricing", "Pricing")}</h1>
          <p className="lp-sub">
            {T(
              "Compare Norulo platform subscriptions. Expenses you record in the ledger are separate from these charges.",
              "比较 Norulo 平台订阅。你在账本中录入的支出与这些费用分开。"
            )}
          </p>
          <div
            className="pricing-toggle"
            role="group"
            aria-label={T("Billing interval", "计费周期")}
          >
            <button
              className={"seg-i" + (interval === "month" ? " active" : "")}
              disabled={Boolean(pendingAction)}
              onClick={() => {
                if (!checkoutPendingRef.current) setInterval("month");
              }}
            >
              <I.Clock size={13} /> {T("Monthly", "按月")}
            </button>
            <button
              className={"seg-i" + (interval === "year" ? " active" : "")}
              disabled={Boolean(pendingAction)}
              onClick={() => {
                if (!checkoutPendingRef.current) setInterval("year");
              }}
            >
              <I.Package size={13} /> {T("Yearly", "按年")}{" "}
            </button>
          </div>
        </section>

        {error && !plan ? (
          <section className="pricing-tiers">
            <PricingLoadError error={error} onRetry={loadPricingPlan} />
          </section>
        ) : (
          <section className="pricing-tiers">
            <PlanCard
              plan={freePlan}
              price={priceFor(freePlan, "month")}
              interval="month"
              active={account.plan === "free" || !activePaid}
              featured={false}
              cta={
                <a className="btn" {...screenLinkProps(go, signedIn ? "ledgerProjects" : "login")}>
                  <I.Check size={14} />{" "}
                  {signedIn ? T("Open projects", "打开项目") : T("Start free", "免费开始")}
                </a>
              }
            />

            {paidPlans.map((paidPlan) => {
              const selectedPrice = priceFor(paidPlan, interval);
              const activePlan = activePaid && account.plan === paidPlan.id;
              const canStartPlan =
                billingEnabled && Boolean(selectedPrice?.configured) && !activePaid;
              const hasMax = paidPlans.some((candidate) => candidate.id === "max");
              return (
                <PlanCard
                  key={paidPlan.id}
                  plan={paidPlan}
                  price={selectedPrice}
                  interval={interval}
                  active={activePlan}
                  featured={hasMax ? paidPlan.id === "max" : paidPlan.id === "pro"}
                  cta={
                    <div className="billing-actions">
                      {activePaid ? (
                        <a className="btn" {...screenLinkProps(go, "billing")}>
                          <I.Settings size={14} /> {T("Open billing", "打开账单")}
                        </a>
                      ) : (
                        <button
                          className="btn primary"
                          disabled={!canStartPlan || Boolean(pendingAction)}
                          onClick={() => startCheckout(paidPlan)}
                        >
                          {pendingAction === `checkout-${paidPlan.id}` && (
                            <span className="spin">
                              <I.Refresh size={14} />
                            </span>
                          )}
                          <I.Package size={14} />{" "}
                          {!pricingLoading && plan?.enabled === false
                            ? T("Not open yet", "尚未开放")
                            : signedIn
                              ? T(`Start ${planLabel(paidPlan)}`, `升级 ${planLabel(paidPlan)}`)
                              : T("Sign in to subscribe", "登录后订阅")}
                        </button>
                      )}
                    </div>
                  }
                />
              );
            })}
          </section>
        )}

        {!pricingLoading && !error && (
          <div className="pricing-faq pricing-policy">
            <p className="muted">{usageText("policy")}</p>
            <p className="muted">
              {T(
                "Free includes 20 one-time Jev trial calls. Pro and Max calls reset each UTC month, including annual subscriptions, without rollover.",
                "Free 提供一次性 20 次 Jev 试用。Pro 和 Max 的次数按 UTC 自然月重置，年订阅也一样，不结转。"
              )}
            </p>
            {!billingEnabled && (
              <p className="muted">
                {T(
                  "Free is available. Paid subscriptions are not open yet.",
                  "Free 套餐可用，付费订阅尚未开放。"
                )}
              </p>
            )}
          </div>
        )}
      </main>
      <PublicFooter go={go} current="pricing" />
    </div>
  );
}

function PricingSkeletonLine({ className = "" }) {
  return <SkeletonLine className={["pricing-skeleton", className].filter(Boolean).join(" ")} />;
}

function PlanCard({ plan, price, interval, active, featured, cta }) {
  const loading = Boolean(plan?.loading);
  const yearlySavings = interval === "year" ? yearlySavingsLabel(plan) : "";
  const limits = plan?.entitlements?.limits;
  const jev = plan?.entitlements?.jev;
  const projects =
    Number.isSafeInteger(limits?.projects) && limits.projects > 0 ? limits.projects : null;
  const records =
    Number.isSafeInteger(limits?.expenseRecords) && limits.expenseRecords > 0
      ? limits.expenseRecords
      : null;
  const allowance = jev?.eligible === true ? jevAllowance(jev) : null;
  return (
    <div className={"pricing-card" + (featured ? " featured" : "")}>
      {featured && <div className="pricing-badge">{planLabel(plan)}</div>}
      <div className="pricing-card-h">
        <h3>{plan?.name || T("Plan", "套餐")}</h3>
        <div className="pricing-tag">
          {loading ? (
            <PricingSkeletonLine className="pricing-skeleton-desc" />
          ) : (
            plan?.description || ""
          )}
        </div>
      </div>
      <div className="pricing-price">
        <div className="pricing-num">
          {loading ? (
            <>
              <PricingSkeletonLine className="pricing-skeleton-price" />
              <PricingSkeletonLine className="pricing-skeleton-per" />
            </>
          ) : (
            <>
              <FinancialValue
                value={priceLabel(price)}
                numeric={priceAmount(price?.amount) !== null}
              />
              <span className="pricing-per">/{interval}</span>
            </>
          )}
        </div>
        {!loading && yearlySavings && <div className="pricing-billed">{yearlySavings}</div>}
        {active && (
          <div className="pricing-billed">{T("Current account plan", "当前账户套餐")}</div>
        )}
      </div>
      <ul className="pricing-feats">
        {!loading && projects !== null && (
          <li>
            <I.Check size={13} />
            <span>
              {T("Projects", "项目")}: <FinancialValue value={projects.toLocaleString("en-US")} />
            </span>
          </li>
        )}
        {!loading && records !== null && (
          <li>
            <I.Check size={13} />
            <span>
              {T("Expense records", "支出记录")}:{" "}
              <FinancialValue value={records.toLocaleString("en-US")} />
            </span>
          </li>
        )}
        {!loading && jev?.eligible === false && (
          <li>
            <I.Check size={13} /> {T("Jev: not included", "不含 Jev")}
          </li>
        )}
        {!loading && allowance !== null && (
          <>
            <li>
              <I.Check size={13} />{" "}
              {T("Automatic Jev assistance when saving expenses", "保存支出时自动享受 Jev 加持")}
            </li>
            <li>
              <I.Check size={13} />{" "}
              {T(
                "Automatic categorization and expense advice · Web + REST API",
                "自动分类与支出建议 · 网页及 REST API"
              )}
            </li>
            <li>
              <I.Check size={13} />
              <span>
                {T("Jev assistance allowance", "Jev 辅助额度")}:{" "}
                <FinancialValue value={allowance.calls.toLocaleString("en-US")} />{" "}
                {T("calls", "次")} ·{" "}
                {allowance.period === "lifetime"
                  ? T("One-time trial", "一次性试用")
                  : T("per month", "每月")}
              </span>
            </li>
            <li>
              <I.Check size={13} />{" "}
              {jev.available === true
                ? allowance.period === "lifetime"
                  ? T("One-time trial · no reset", "一次性试用 · 不重置")
                  : T("Monthly UTC calls · no rollover", "UTC 自然月次数 · 不结转")
                : T("Activation pending · no rollover", "待启用 · 不结转")}
            </li>
            {allowance.period === "utc-calendar-month" && (
              <li>
                <I.Check size={13} />{" "}
                {T(
                  "Annual subscriptions keep the same monthly Jev calls",
                  "年订阅也按同样的月度 Jev 预算计算"
                )}
              </li>
            )}
          </>
        )}
        <li>
          <I.Check size={13} />{" "}
          {loading ? (
            <PricingSkeletonLine className="pricing-skeleton-feature" />
          ) : (
            T("Project and shared expense ledger", "项目与公共支出账本")
          )}
        </li>
        <li>
          <I.Check size={13} />{" "}
          {loading ? (
            <PricingSkeletonLine className="pricing-skeleton-feature" />
          ) : (
            T("Per-currency reports and REST API", "逐币报表与 REST API")
          )}
        </li>
        <li>
          <I.Check size={13} />{" "}
          {T("Platform charges stay separate from ledger expenses", "平台收费与账本支出分开")}
        </li>
        {plan?.id && plan.id !== "free" && (
          <li>
            <I.Check size={13} /> {T("Cancel renewal from Billing", "从账单页取消续订")}
          </li>
        )}
      </ul>
      {cta}
    </div>
  );
}
