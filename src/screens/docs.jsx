import "./docs.css";
import { useEffect } from "react";
import { I } from "../icons.jsx";
import { T, useLang } from "../i18n.jsx";
import { screenLinkProps } from "../lib/navigation.js";
import { DOCS_GUIDE } from "../locales/docs-guide.js";
import { AGENT_GUIDE } from "../locales/agent-guide.js";
import { EXPENSE_CAPACITY_COPY } from "../locales/expense-capacity.js";
import { DOCS_NAV_COPY } from "../locales/docs-nav.js";
import { AgentSetupGuide } from "./agent-setup.jsx";
import { DocsSideNav } from "./docs-layout.jsx";
import { PublicFooter, PublicHeader } from "./public-layout.jsx";

const SECTIONS = [
  {
    id: "sign-in",
    title: ["Sign in or create an account", "登录或创建账户"],
    text: [
      "Enter your email and verify the 6-digit code to sign in. Your first successful verification creates your account automatically; no password is needed. GitHub sign-in is also available. If you already use GitHub, sign in first and link an email from Settings to keep the same account and ledgers. A matching GitHub profile email never links or merges accounts.",
      "输入邮箱并验证 6 位验证码即可登录，首次验证成功会自动创建账户，无需密码。也可以使用 GitHub 登录。如果你已有 GitHub 登录账户，请先登录，再到设置中验证并绑定邮箱，以保留同一个账户和账本。GitHub 资料中的相同邮箱不会自动绑定或合并账户。",
    ],
  },
  {
    id: "connect",
    title: ["Create a project", "创建项目"],
    text: DOCS_GUIDE.projectSetup,
  },
  DOCS_GUIDE.projectSettings,
  {
    id: "categories",
    title: ["Create categories", "创建类别"],
    text: DOCS_GUIDE.categories,
  },
  {
    id: "project-removal",
    title: ["Permanently remove a project", "永久移除项目"],
    text: [
      "Only the ledger Owner can permanently remove a project from Project settings. Confirming deletes the project, expenses currently assigned to it, all its recurring schedules in every state and related business history. Existing expenses already moved to another project or the shared pool remain. This cannot be undone. Archive is a separate action that preserves the project and its records.",
      "只有账本 Owner 可以在项目设置中永久移除项目。确认后会删除项目、当前归属于它的支出、所有状态的周期计划及相关业务历史。已移到其他项目或公共池的现存支出保留。此操作无法撤销。归档是独立操作，会保留项目和账目。",
    ],
  },
  {
    id: "expenses",
    title: ["Record expenses", "记录支出"],
    text: DOCS_GUIDE.expenses,
  },
  DOCS_GUIDE.recurring,
  DOCS_GUIDE.expenseRetention,
  {
    id: "max-assistance",
    title: ["Automatic Jev assistance", "Jev 自动辅助"],
    text: [
      "Jev assists expense saves in Web and REST API when enabled, available and within the Owner’s call allowance: Free 20 one-time trials, Pro 1,000/month, Max 4,000/month. Members and API keys share it. Automatic categorization only selects a confident active category; explicit category, target, amount and currency stay unchanged. Otherwise choose a category and retry. Recurring setup supports Automatic; background posting reuses the saved category. Ordinary writes need no suggestions:use scope.",
      "Jev 开启、可用且账本 Owner 的次数充足时，网页及 REST API 保存支出可使用辅助：Free 一次性试用 20 次，Pro 每月 1,000 次，Max 每月 4,000 次，成员及 API 密钥共用。自动分类只选择有把握的启用类别；明确填写的类别、目标、金额和币种保持不变，否则请选择类别重试。周期计划设置支持自动分类，后台生成沿用保存的类别。普通写入无需 suggestions:use，仍须具备 expenses:write 和目标权限。",
    ],
  },
  {
    id: "jev-settings",
    title: ["Jev settings", "Jev 设置"],
    text: [
      "Free, Pro and Max owners can enable or disable Jev for their own ledger and members in Settings. The selected shared ledger follows its own Owner’s preference. Turning Jev off, changing plans or changing months never renews Free’s one-time 20 trials. Turning it off preserves expenses and consumed calls; paid local duplicate checks remain available. A saved On preference remains On during service unavailability. Reload after a conflict or refresh failure before choosing again.",
      "Free、Pro 和 Max 所有者均可在设置中为自己的账本及成员开关 Jev。选中的共享账本遵循其 Owner 的偏好。关闭 Jev、换套餐或换月都不会重新发放 Free 一次性 20 次试用。关闭不会修改支出或退还次数，付费账本仍可进行本地疑似重复检查。服务暂不可用时，保存的开启偏好保持开启；冲突或刷新失败后请重新加载再选择。",
    ],
  },
  {
    id: "expense-review",
    title: ["Review saved expenses", "检查已保存支出"],
    text: [
      "Expense review loads up to 100 filtered expenses separately from the normal page. Only Start review sends one check at a time. Model checks share the Owner’s Free lifetime trial or paid monthly calls; each admitted attempt consumes one call, including failures. Stop ends queued work without refunding started checks. Reviews never edit expenses or advance revisions. Local duplicate checks remain available for paid ledgers with Jev off. Uncertain or unavailable is not a clear result; Edit reloads saved values without applying advice.",
      "支出巡检单独加载最多 100 条符合筛选的记录，只有开始巡检才逐条发送检查。模型检查共享 Owner 的 Free 一次性试用或付费月度次数，每次获准尝试（包括失败）消耗 1 次；停止不退还已开始的检查。巡检不修改支出或版本；付费账本关闭 Jev 后仍有本地重复检查。不确定或不可用不代表无问题；编辑重新加载原值，不自动应用建议。API 巡检需 {}、当前版本的 If-Match、expenses:write 及角色/目标权限，不自动重试或使用幂等回放。",
    ],
  },
  {
    id: "reports",
    title: ["Review reports", "查看报表"],
    text: [
      "Filter detail and charts by date and category. Totals stay separate by currency; Norulo does not convert currencies. All ledger members can read reports and export CSV; Owner, Admin and Editor can edit and remove entries.",
      "按日期和类别筛选明细及图表。总额按币种分开，Norulo 不进行货币转换。账本成员可以查看报表和导出 CSV；Owner、Admin 和 Editor 可以修改和移除记录。",
    ],
  },
  DOCS_GUIDE.activity,
  {
    id: "keys",
    title: ["Use API keys", "使用 API 密钥"],
    text: DOCS_GUIDE.keys,
  },
  {
    id: "members",
    title: ["Share a ledger", "共享账本"],
    text: [
      "In Members, choose a role and create an invitation link without naming a recipient. Anyone signed in to a Norulo account, including an email-only account, can request to join. Only the original inviter can approve or reject requests while their original permissions remain valid. Opening the link or sending a request grants no ledger access. Links expire after 24 hours and close when one person is approved. Legacy invitations to a specific GitHub account still check that identity. Owner manages Admins; Admin manages Editors and Viewers. Approved members can access existing and future ledger data according to their role and share the Owner's plan and allowances. Joining a ledger never grants GitHub repository access.",
      "在成员页面选择角色并生成邀请链接，无需指定接收人。任何已登录的 Norulo 账户（包括仅使用邮箱的账户）都可以申请加入。只有原邀请人在原有权限仍有效时可以批准或拒绝申请。打开链接或提交申请不会授予账本访问权。链接 24 小时后失效，一人获批后即关闭。旧版指定 GitHub 账户的邀请仍校验该身份。Owner 管理 Admin，Admin 管理 Editor 和 Viewer。获批成员按角色访问当前及未来账本数据，共同使用 Owner 的套餐和额度。加入账本不会授予 GitHub 仓库访问权。",
    ],
    detail: DOCS_GUIDE.membersManagement,
  },
];

// Sidebar groups follow the page order so the current-section marker moves
// steadily down the list.
const NAV_GROUPS = [
  ["getStarted", ["agent-setup", "sign-in"]],
  ["projects", ["connect", "project-settings", "categories", "project-removal"]],
  ["expenses", ["expenses", "recurring", "expense-retention"]],
  ["jev", ["max-assistance", "jev-settings", "expense-review"]],
  ["reportsAccess", ["reports", "activity", "keys", "members"]],
];

function sectionTitle(id) {
  if (id === "agent-setup") return T(...AGENT_GUIDE.title);
  return T(...SECTIONS.find((section) => section.id === id).title);
}

export function DocsScreen({ go, auth }) {
  useLang();
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;
    const frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="landing fade-in">
      <PublicHeader go={go} current="docs" auth={auth} />
      <div className="docs-shell">
        <DocsSideNav
          label={T(...DOCS_NAV_COPY.docsSections)}
          groups={NAV_GROUPS.map(([key, ids]) => ({
            key,
            label: key === "jev" ? "Jev" : T(...DOCS_NAV_COPY[key]),
            items: ids.map((id) => ({ id, label: sectionTitle(id) })),
          }))}
        />
        <main id="main-content" tabIndex={-1} className="docs-main">
          <div className="docs-crumbs">
            <a className="auth-link" {...screenLinkProps(go, "landing")}>
              Norulo
            </a>
            <span className="sep">/</span>
            <span className="now">{T("Docs", "文档")}</span>
          </div>
          <h1 className="docs-h1">{T("Project expense ledger", "项目支出账本")}</h1>
          <p className="docs-lede">
            {T(
              "Record project and shared costs, then review per-currency totals.",
              "记录项目及公共支出，查看逐币汇总。"
            )}
          </p>
          <AgentSetupGuide />
          <div className="docs-callout">
            <I.Shield size={16} />
            <div>
              <b>{T("Your ledger", "你的账本")}</b>
              <p>
                {T(
                  "GitHub access controls new repository bindings. Existing history stays in the original ledger when repository access changes, with access governed by member roles.",
                  "GitHub 授权控制新仓库绑定；仓库权限变化后，已有账目历史仍保留在原账本，按成员角色开放访问。"
                )}
              </p>
            </div>
          </div>
          {SECTIONS.map((section) => (
            <section key={section.id} className="docs-section">
              <h2 id={section.id} className="docs-h2">
                {T(...section.title)}
              </h2>
              {section.id === "expense-retention" && <p>{T(...EXPENSE_CAPACITY_COPY.defaults)}</p>}
              <p>{T(...section.text)}</p>
              {section.detail && <p>{T(...section.detail)}</p>}
              {section.id === "keys" && (
                <a className="auth-link" href="/developers/api#quickstart">
                  {T(...DOCS_GUIDE.quickstartLink)}
                </a>
              )}
            </section>
          ))}
          <div className="docs-foot-actions">
            <a className="btn primary" {...screenLinkProps(go, "ledgerProjects")}>
              {T("Open projects", "打开项目")}
            </a>
            <a className="btn" {...screenLinkProps(go, "api")}>
              {T("API contract", "API 接口")}
            </a>
          </div>
        </main>
      </div>
      <PublicFooter go={go} current="docs" />
    </div>
  );
}
