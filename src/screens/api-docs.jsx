import "./docs.css";
import { useEffect, useId, useRef, useState } from "react";
import { ApiIntegrationGuide, integrationMarkdown } from "./api-guide.jsx";
import { ApiReference, referenceMarkdown } from "./api-reference.jsx";
import { agentMarkdown } from "./api-agent.js";
import { ApiDocsCopyButton } from "./api-docs-copy-button.jsx";
import { API_GUIDE_COPY } from "../locales/api-guide.js";
import { AGENT_GUIDE } from "../locales/agent-guide.js";
import { DOCS_NAV_COPY } from "../locales/docs-nav.js";
import { AgentSetupGuide, agentSetupMarkdown } from "./agent-setup.jsx";
import { DocsCode, DocsSideNav } from "./docs-layout.jsx";
import { env } from "../config/env.js";
import { T, useLang } from "../i18n.jsx";
import { screenLinkProps } from "../lib/navigation.js";
import { PublicFooter, PublicHeader } from "./public-layout.jsx";

function baseUrl() {
  const configured = String(env.VITE_PUBLIC_API_BASE_URL || env.VITE_API_BASE_URL || "").trim();
  if (!configured) return "https://api.norulo.com";
  if (/^[a-z][a-z0-9+.-]*:/i.test(configured)) return configured.replace(/\/$/, "");
  return configured.startsWith("/") && typeof window !== "undefined"
    ? new URL(configured, window.location.origin).href.replace(/\/$/, "")
    : "https://api.norulo.com";
}

function apiUrl(path, base) {
  // A same-origin /api base is the Web proxy prefix; Server still expects /api/v1.
  return `${base}/${path.replace(/^\/+/, "")}`;
}

const PROJECT_CREATION =
  'Create a standalone project with POST /api/v1/projects and a nonempty name, for example {"name":"Website launch"}. description is optional. Omit githubRepoIds or send []; omit githubOrganizationId or use null. Standalone projects work without installing the GitHub App on a repository. Authenticate normally.';
const PROJECT_BINDINGS =
  "To link GitHub, send githubRepoIds with 1–30 distinct numeric IDs authorized to the acting user. A non-null githubOrganizationId requires at least one repository and current access to that organization. GitHub organization access does not grant ledger membership.";
const PROJECT_UPDATES =
  "PATCH /api/v1/projects/{id} requires If-Match. Omit githubRepoIds to keep the current links; send [] to remove every repository and automatically clear the organization. A project with no repositories must have a nonempty name; include name in the same PATCH if needed. Later links and removals preserve the project ID and expense history.";
const PROJECT_STATE =
  'Standalone responses have githubRepoId: null, githubRepoIds: [], repositories: [] and githubAccess: "not_linked". Active standalone projects can record expenses under the usual role, scope and plan limits.';

const MAX_ASSISTANCE =
  "Jev assists expense saves in Web and REST API when enabled, available and within the Owner’s call allowance: Free 20 one-time trials, Pro 1,089/month, Max 4,358/month. Members and API keys share it. Automatic categorization only selects a confident active category; explicit category, target, amount and currency stay unchanged. Otherwise choose a category and retry. Recurring setup supports Automatic; background posting reuses the saved category. Ordinary writes need no suggestions:use scope. Normal expenses:write and target permissions apply.";
const CATEGORY_BEHAVIOR =
  "On POST/PATCH /api/v1/expenses, omit categoryId for Automatic while the Owner has Jev calls and enabled, available Jev. Free shares 20 one-time trials; Pro and Max have monthly calls. Explicit category, target, amount and currency stay unchanged. If no confident category is found, 422 CATEGORY_REQUIRED leaves input unsaved; choose a category and retry. Creates need a new Idempotency-Key; edits need the loaded If-Match revision and explicit reload after conflict. Recurring setup supports the same option; background posting uses the saved category.";
const ASSISTANCE_RESPONSE =
  "Successful writes return the expense with an assistance object: status, categorySource (jev or user), suggestions and optional reason/modelVersion/questionVersion. Duplicate advice never blocks saving. Identical create requests with the same Idempotency-Key return the cached result without another model call. Reads do not invoke Jev.";
const EXPENSE_REVIEW =
  "POST /api/v1/expenses/{id}/review requires {}, If-Match of the loaded revision, expenses:write and normal role/target authority. Expense review loads up to 100 filtered expenses separately from the normal page. Only Start review sends one check at a time. Model checks share the Owner’s Free lifetime trial or paid monthly calls; each admitted attempt consumes one call, including failures. Stop ends queued work without refunding started checks. Reviews never edit expenses or advance revisions. Local duplicate checks remain available for paid ledgers with Jev off. Uncertain or unavailable is not a clear result; Edit reloads saved values without applying advice. No automatic retries or Idempotency-Key replay.";
const REVIEW_RESPONSE =
  "A review returns expenseId, revision, questionVersion, modelVersion, optional suggestionId and checks. Category and target checks use checked, issue, uncertain or unavailable, with current values and optional suggested values and confidence. Jev returns only predefined choices and scores. Optional reason values are fixed codes: disabled, provider_unavailable, no_categories or invalid_context. Duplicate checks use local rules on other expenses with the same authorized target, occurredOn date, currency and exact amount. Purpose does not need to match. The duplicate status is checked or issue; an issue may include candidate {id, revision}, without expense details. Local duplicate checks can remain available when the model is unavailable. Uncertain or unavailable does not mean a clear result. To edit, first GET the current expense with expenses:read, then explicitly PATCH it with expenses:write and the fresh If-Match revision.";
const EXACT_TOTALS =
  "Single expense amountMinor values are safe integers. Aggregate amountMinor totals are numbers up to 9007199254740991 and exact decimal integer strings above that boundary; parse large totals with BigInt or decimal arithmetic.";
const ACCOUNT_JEV =
  "GET/PATCH /api/v1/account/jev use the signed-in cookie account’s own preference; workspace selection and API keys grant no access to another Owner’s settings. Free can also toggle Jev. Responses expose enabled, revision, eligible, available, monthlyCalls, trialCalls and period; monthlyBudgetUsd is deprecated compatibility data. PATCH accepts only {enabled: boolean} and requires If-Match with the preference revision. After 412, explicitly GET before another choice. No model checks, expense changes or call refunds occur. Members inherit the ledger Owner’s preference.";

function markdown(base, example, createExample, projectExample, reviewExample) {
  return [
    "# Norulo ledger REST API",
    "",
    "Use a Bearer key with the required ledger scopes and project/shared restrictions.",
    "",
    "Ledger expenses and Norulo platform billing are separate. Totals stay separate by currency; no currency conversion is performed.",
    "",
    "Keys are bound to one workspace and intersect the issuing member's current role. Team membership revision changes invalidate the key. X-Norulo-Workspace cannot override that binding. Cookie requests may select a ledger with X-Norulo-Workspace; native CSV links use workspaceId. Conflicting selectors are rejected. Members share the ledger Owner's plan and monthly model allowance.",
    "",
    "## Projects",
    "",
    PROJECT_CREATION,
    "",
    PROJECT_BINDINGS,
    "",
    PROJECT_UPDATES,
    "",
    PROJECT_STATE,
    "",
    "```sh",
    projectExample,
    "```",
    "",
    "## Base URL",
    "",
    base,
    "",
    agentSetupMarkdown(),
    integrationMarkdown(base),
    "",
    referenceMarkdown(),
    "## Example",
    "",
    "```sh",
    example,
    "```",
    "",
    "## Automatic Jev assistance",
    "",
    MAX_ASSISTANCE,
    "",
    CATEGORY_BEHAVIOR,
    "",
    ASSISTANCE_RESPONSE,
    "",
    "## Jev settings",
    "",
    ACCOUNT_JEV,
    "",
    "```sh",
    createExample,
    "```",
    "",
    "## Review saved expenses",
    "",
    EXPENSE_REVIEW,
    "",
    REVIEW_RESPONSE,
    "",
    "```sh",
    reviewExample,
    "```",
    "",
    EXACT_TOTALS,
    "",
    "Filters: target, projectId, categoryId, from (inclusive), to (exclusive), currency. Lists also support limit and cursor.",
    "Writes to versioned records require If-Match. Expense creation requires Idempotency-Key.",
  ].join("\n");
}

export function ApiDocsScreen({ go, auth }) {
  const language = useLang();
  const [copyState, setCopyState] = useState("idle");
  const [copyMode, setCopyMode] = useState("agent");
  const [manualMarkdown, setManualMarkdown] = useState("");
  const copyRequestRef = useRef(null);
  const manualCopyRef = useRef(null);
  const manualCopyId = useId();
  useEffect(() => {
    setCopyState("idle");
    setManualMarkdown("");
    return () => {
      copyRequestRef.current = null;
    };
  }, [language]);
  useEffect(() => {
    if (copyState !== "failed") return;
    manualCopyRef.current?.focus({ preventScroll: true });
    manualCopyRef.current?.select();
  }, [copyState]);
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;
    const frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);
  const base = baseUrl();
  const example = `curl '${apiUrl("/api/v1/expenses?target=shared&from=2026-09-01&to=2026-10-01", base)}' \\\n  -H "Authorization: Bearer $NORULO_API_KEY"`;
  const createExample = [
    `curl -X POST '${apiUrl("/api/v1/expenses", base)}'`,
    '  -H "Authorization: Bearer $NORULO_API_KEY"',
    "  -H 'Content-Type: application/json'",
    "  -H 'Idempotency-Key: hosting-2026-09-unique'",
    `  --data '{"target":{"kind":"shared"},"occurredOn":"2026-09-27","amount":"12.00","currency":"USD","purpose":"September hosting"}'`,
  ].join(" \\\n");
  const projectExample = [
    `curl -X POST '${apiUrl("/api/v1/projects", base)}'`,
    '  -H "Authorization: Bearer $NORULO_API_KEY"',
    "  -H 'Content-Type: application/json'",
    `  --data '{"name":"Website launch"}'`,
  ].join(" \\\n");
  const reviewExample = [
    `curl -X POST '${apiUrl("/api/v1/expenses/exp_example/review", base)}'`,
    '  -H "Authorization: Bearer $NORULO_API_KEY"',
    "  -H 'Content-Type: application/json'",
    `  -H 'If-Match: "7"'`,
    "  --data '{}'",
  ].join(" \\\n");
  // Groups follow the page order so the current-section marker moves steadily.
  const navGroups = [
    [
      "getStarted",
      [
        ["overview", "Overview"],
        ["agent-setup", AGENT_GUIDE.title[0]],
        ["quickstart", "Quickstart: save your first expense"],
        ["environments", "Environments and request URLs"],
        ["authentication", "Authentication"],
        ["permissions", "Scopes, roles and ledger boundaries"],
      ],
    ],
    [
      "guides",
      [
        ["projects", "Projects"],
        ["writes", "Editing, retries, pagination and money"],
        ["project-management", "Project and category management"],
        ["recurring", "Project and shared recurring expenses"],
        ["members", "Invitations and member management"],
        ["activity", "Operation history"],
        ["expense-retention", API_GUIDE_COPY.retentionTitle[0]],
        ["filters", "Filters and writes"],
      ],
    ],
    [
      "jev",
      [
        ["max-assistance", "Automatic Jev assistance"],
        ["jev-settings", "Jev settings"],
        ["expense-review", "Review saved expenses"],
      ],
    ],
    [
      "reference",
      [
        ["troubleshooting", "Error responses and recovery"],
        ["reference", "Complete API reference"],
      ],
    ],
  ];
  function selectCopyMode(mode) {
    if (copyRequestRef.current) return;
    setCopyMode(mode);
    setCopyState("idle");
    setManualMarkdown("");
  }
  async function copyDocumentation() {
    if (copyRequestRef.current) return;
    const request = {};
    copyRequestRef.current = request;
    const content =
      copyMode === "agent"
        ? agentMarkdown(base)
        : markdown(base, example, createExample, projectExample, reviewExample);
    setCopyState("pending");
    try {
      if (typeof navigator.clipboard?.writeText !== "function")
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(content);
      if (copyRequestRef.current !== request) return;
      setCopyState("copied");
      setManualMarkdown("");
    } catch {
      if (copyRequestRef.current !== request) return;
      setManualMarkdown(content);
      setCopyState("failed");
    } finally {
      if (copyRequestRef.current === request) copyRequestRef.current = null;
    }
  }
  return (
    <div className="landing fade-in product-api-docs">
      <PublicHeader go={go} current="api" auth={auth} />
      <div className="docs-shell">
        <DocsSideNav
          label={T(...DOCS_NAV_COPY.apiSections)}
          groups={navGroups.map(([key, items]) => ({
            key,
            label: key === "jev" ? "Jev" : T(...DOCS_NAV_COPY[key]),
            items: items.map(([id, label]) => ({
              id,
              label: T(
                label,
                id === "agent-setup"
                  ? AGENT_GUIDE.title[1]
                  : label === "Complete API reference"
                    ? {
                        zh: "完整 API 参考",
                        ja: "API リファレンス全体",
                        ko: "전체 API 참조",
                        fr: "Référence API complète",
                        es: "Referencia completa de la API",
                      }
                    : Object.values(API_GUIDE_COPY).find(([english]) => english === label)?.[1]
              ),
            })),
          }))}
        />
        <main id="main-content" tabIndex={-1} className="docs-main">
          <div className="docs-crumbs">
            <a className="auth-link" {...screenLinkProps(go, "landing")}>
              Norulo
            </a>
            <span className="sep">/</span>
            <span className="now">API</span>
          </div>
          <div className="docs-page-head">
            <h1 id="overview" className="docs-h1">
              {T("Norulo ledger REST API")}
            </h1>
            <ApiDocsCopyButton
              mode={copyMode}
              onModeChange={selectCopyMode}
              onCopy={copyDocumentation}
              copyState={copyState}
            />
          </div>
          {manualMarkdown && (
            <div className="notice notice-error" data-copy-exclude>
              <p role="alert">
                {copyMode === "page"
                  ? T("Unable to copy this page. Select and copy the Markdown below.")
                  : T("Unable to copy agent documentation. Select and copy the Markdown below.")}
              </p>
              <label htmlFor={manualCopyId}>
                {copyMode === "page" ? T("Page Markdown") : T("Agent Markdown")}
              </label>
              <div className="auth-input">
                <textarea
                  ref={manualCopyRef}
                  id={manualCopyId}
                  readOnly
                  rows={8}
                  value={manualMarkdown}
                  onFocus={(event) => event.target.select()}
                />
              </div>
            </div>
          )}
          <p className="docs-lede">
            {T(
              "Record project and shared expenses, then read totals by currency. Platform billing is a separate account service.",
              "记录项目和公共池支出，按币种读取汇总。平台账单是独立的账户服务。"
            )}
          </p>
          <AgentSetupGuide />
          <ApiIntegrationGuide base={base} ids={["quickstart", "environments"]} />
          <h2 id="authentication" className="docs-h2">
            {T("Authentication", "认证")}
          </h2>
          <p>
            {T(
              "Create a key in API Keys with only the scopes needed. Project allowlists do not grant shared-pool access; enable that separately. A revoked key cannot read or write.",
              "在 API Keys 中仅授予所需权限。项目白名单不会自动授予公共池权限；需要时单独启用。撤销的密钥不能读写。"
            )}
          </p>
          <DocsCode title={T("Base URL", "基础地址")}>{base}</DocsCode>
          <DocsCode title={T("Authorization", "认证请求头")}>
            Authorization: Bearer nrk_example
          </DocsCode>
          <p>
            {T(
              "Each key is bound to one ledger and cannot exceed its issuer's current member role. A member revision change invalidates team keys. Cookie clients can select a ledger with X-Norulo-Workspace; CSV links use workspaceId, and conflicting selectors are rejected. All members share the ledger Owner's plan and model allowance.",
              "每个密钥绑定一个账本，不能超出发行成员的当前角色权限。成员权限版本变化后，团队密钥会失效。Cookie 客户端通过 X-Norulo-Workspace 选择账本，CSV 链接使用 workspaceId；冲突的选择器会被拒绝。所有成员共用账本 Owner 的套餐和模型额度。"
            )}
          </p>
          <ApiIntegrationGuide base={base} ids={["permissions"]} />
          <h2 id="projects" className="docs-h2">
            {T("Projects", "项目")}
          </h2>
          <p>
            {T(
              PROJECT_CREATION,
              '通过 POST /api/v1/projects 和非空 name 创建独立项目，例如 {"name":"Website launch"}。description 可选。省略 githubRepoIds 或传入 []，省略 githubOrganizationId 或传入 null。独立项目无需为仓库安装 GitHub App，仍需正常认证。'
            )}
          </p>
          <p>
            {T(
              PROJECT_BINDINGS,
              "关联 GitHub 时，githubRepoIds 使用 1–30 个不重复且当前操作用户已授权的数字仓库 ID。非空 githubOrganizationId 必须同时有关联仓库，并验证当前组织访问权。GitHub 组织访问权不会自动授予账本成员资格。"
            )}
          </p>
          <p>
            {T(
              PROJECT_UPDATES,
              "PATCH /api/v1/projects/{id} 需要 If-Match。省略 githubRepoIds 保留当前关联，传入 [] 解除所有仓库关联并自动清除组织。没有关联仓库的项目必须有非空 name，可在同一次 PATCH 中填写。后续关联或解除关联会保留项目 ID 和历史支出。"
            )}
          </p>
          <p>
            {T(
              PROJECT_STATE,
              '独立项目响应为 githubRepoId: null、githubRepoIds: []、repositories: [] 和 githubAccess: "not_linked"。启用的独立项目可按原有角色、权限范围及套餐限额记录支出。'
            )}
          </p>
          <DocsCode title={T("Create a standalone project", "创建独立项目")}>
            {projectExample}
          </DocsCode>
          <ApiIntegrationGuide
            base={base}
            ids={[
              "writes",
              "project-management",
              "recurring",
              "members",
              "activity",
              "expense-retention",
            ]}
          />
          <h2 id="filters" className="docs-h2">
            {T("Filters and writes", "筛选与写入")}
          </h2>
          <p>
            {T(
              "Expense lists and reports share target, projectId, categoryId, from (inclusive), to (exclusive) and currency filters. Lists also use limit and cursor. Amounts are decimal strings on writes and minor units in totals. Currencies are never combined.",
              "支出列表与报表共用目标、项目、类别、起始日期（含）、结束日期（不含）及币种筛选。列表还支持 limit 和 cursor。写入金额是十进制字符串，汇总使用最小货币单位，不跨币种相加。"
            )}
          </p>
          <p>
            {T(
              "Use Idempotency-Key when creating an expense and If-Match with the latest revision when editing or removing one.",
              "创建支出使用 Idempotency-Key；修改或移除时使用最新版本的 If-Match。"
            )}
          </p>
          <DocsCode title={T("Read shared expenses", "读取公共池支出")}>{example}</DocsCode>
          <p>
            {T(
              EXACT_TOTALS,
              "单笔支出的 amountMinor 是安全整数。汇总 amountMinor 在 9007199254740991 以内为数字，超过后为精确十进制整数字符串；请使用 BigInt 或十进制运算处理大额汇总。"
            )}
          </p>
          <h2 id="max-assistance" className="docs-h2">
            {T("Automatic Jev assistance", "Jev 自动辅助")}
          </h2>
          <p>
            {T(
              MAX_ASSISTANCE,
              "Jev 开启、可用且账本 Owner 的次数充足时，网页及 REST API 保存支出可使用辅助：Free 一次性试用 20 次，Pro 每月 1,089 次，Max 每月 4,358 次，成员及 API 密钥共用。自动分类只选择有把握的启用类别；明确填写的类别、目标、金额和币种保持不变，否则请选择类别重试。周期计划设置支持自动分类，后台生成沿用保存的类别。普通写入无需 suggestions:use，仍须具备 expenses:write 和目标权限。"
            )}
          </p>
          <p>
            {T(
              CATEGORY_BEHAVIOR,
              "POST/PATCH /api/v1/expenses 可在 Owner 有次数且 Jev 开启、可用时省略 categoryId 自动分类。Free 共享一次性 20 次试用，Pro 和 Max 使用月度次数。明确的类别、目标、金额及币种不变；无法确定类别时返回 422 CATEGORY_REQUIRED，输入不保存，请手动选类别重试。创建须使用新的 Idempotency-Key；编辑须带当前版本 If-Match，冲突后主动重读。周期计划设置支持相同选项，后台生成沿用保存类别。"
            )}
          </p>
          <p>
            {T(
              ASSISTANCE_RESPONSE,
              "成功写入会返回支出和 assistance 对象，包括 status、categorySource（jev 或 user）、suggestions，以及可选的 reason/modelVersion/questionVersion。重复记录提示不阻止保存。使用相同 Idempotency-Key 的相同创建请求重放返回缓存结果，不会再次调用模型。读取不会调用 Jev。"
            )}
          </p>
          <DocsCode
            title={T(
              "Create with automatic categorization (Pro and Max)",
              "使用自动分类创建支出（Pro 和 Max）"
            )}
          >
            {createExample}
          </DocsCode>
          <h2 id="jev-settings" className="docs-h2">
            {T("Jev settings", "Jev 设置")}
          </h2>
          <p>
            {T(
              ACCOUNT_JEV,
              "GET/PATCH /api/v1/account/jev 使用 Cookie 登录账户自己的偏好；选中工作区或 API 密钥不能访问其他 Owner 的设置。Free 也可开关 Jev。响应提供 enabled、revision、eligible、available、monthlyCalls、trialCalls 和 period；monthlyBudgetUsd 仅为已弃用的兼容字段。PATCH 只接受 {enabled: boolean}，须用偏好 revision 传入 If-Match；412 后先主动 GET 再选择。接口不调用模型、不修改支出、不退还次数，成员继承账本 Owner 的偏好。"
            )}
          </p>
          <h2 id="expense-review" className="docs-h2">
            {T("Review saved expenses", "检查已保存支出")}
          </h2>
          <p>
            {T(
              EXPENSE_REVIEW,
              "支出巡检单独加载最多 100 条符合筛选的记录，只有开始巡检才逐条发送检查。模型检查共享 Owner 的 Free 一次性试用或付费月度次数，每次获准尝试（包括失败）消耗 1 次；停止不退还已开始的检查。巡检不修改支出或版本；付费账本关闭 Jev 后仍有本地重复检查。不确定或不可用不代表无问题；编辑重新加载原值，不自动应用建议。API 巡检需 {}、当前版本的 If-Match、expenses:write 及角色/目标权限，不自动重试或使用幂等回放。"
            )}
          </p>
          <p>
            {T(
              REVIEW_RESPONSE,
              "巡检返回 expenseId、revision、questionVersion、modelVersion、可选的 suggestionId 及 checks。类别和目标检查的状态为 checked、issue、uncertain 或 unavailable，包含 current 值，以及可选的 suggested 值和 confidence。Jev 只返回预定义选项和评分。可选 reason 是固定代码：disabled、provider_unavailable、no_categories 或 invalid_context。重复检查通过本地规则，匹配同一获准目标下 occurredOn 日期、币种和精确金额相同的其他支出，无需用途相同。重复状态为 checked 或 issue；issue 可包含 candidate {id, revision}，不包含支出详情。模型不可用时，本地重复检查仍可能有结果。不确定或不可用不代表没有问题。修改前先使用 expenses:read GET 当前支出，再主动使用 expenses:write 和新的 If-Match 版本 PATCH。"
            )}
          </p>
          <DocsCode title={T("Review one saved expense", "检查一笔已保存支出")}>
            {reviewExample}
          </DocsCode>
          <ApiIntegrationGuide base={base} ids={["troubleshooting"]} />
          <ApiReference />
          <div className="docs-foot-actions">
            <a className="btn" {...screenLinkProps(go, "docs")}>
              {T("Guide", "指南")}
            </a>
            <a className="btn primary" {...screenLinkProps(go, "apiKeys")}>
              {T("API Keys", "API 密钥")}
            </a>
          </div>
        </main>
      </div>
      <PublicFooter go={go} current="api" />
    </div>
  );
}
