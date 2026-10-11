// Dynamic phrases for this locale; placeholders preserve source values.
export const DYNAMIC_PHRASE_TRANSLATIONS = [
  { match: /^Contact (.+) to request access, export, correction or deletion of account data\. We may verify your identity and consider applicable law and other ledger members' rights before acting\. You can export authorized expenses as CSV, manage members and GitHub access according to your permissions, and revoke your API keys in the product\.$/, translation: "请联系 $1 请求访问、导出、更正或删除账户数据。处理前我们可能核实身份，并考虑适用法律及其他账本成员的权利。你可以导出有权访问的支出 CSV、按权限管理成员与 GitHub 授权，并在产品中撤销自己的 API 密钥。" },
  { match: /^Contact (.+) with privacy or security questions\.$/, translation: "隐私或安全问题请联系 $1。" },
  { match: /^For questions, contact (.+)\.$/, translation: "如有问题，请联系 $1。" },
  { match: /^([\d,]+) repositories$/, translation: "$1 个仓库" },
  { match: /^Last verified by @(.+)$/, translation: "最近由 @$1 验证" },
  { match: /^Needs a GitHub account with access to (.+)$/, translation: "需要有权访问 $1 的 GitHub 账户" },
  { match: /^Manage (.+) GitHub App installation$/, translation: "管理 $1 的 GitHub App 安装" },
  { match: /^(.+) more per (.+)$/, translation: "每 $2 多 $1" },
  { match: /^(.+) less per (.+)$/, translation: "每 $2 少 $1" },
  { match: /^Billed (.+)$/, translation: "按 $1 计费" },
  { match: /^Switch to (.+)$/, translation: "切换到 $1" },
  { match: /^Start (.+)$/, translation: "升级 $1" },
  { match: /^(.+) repositories authorized(.*)$/, translation: "$1 个仓库已授权$2" },
  { match: /^Questions\? Email (.+)\.$/, translation: "如有问题，请联系 $1。" },
  { match: /^Go to (.+)$/, translation: "前往 $1" },
];
