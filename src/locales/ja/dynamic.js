// Dynamic phrases for this locale; placeholders preserve source values.
export const DYNAMIC_PHRASE_TRANSLATIONS = [
  { match: /^Contact (.+) to request access, export, correction or deletion of account data\. We may verify your identity and consider applicable law and other ledger members' rights before acting\. You can export authorized expenses as CSV, manage members and GitHub access according to your permissions, and revoke your API keys in the product\.$/, translation: "アカウントデータへのアクセス、エクスポート、訂正、削除を請求するには、$1 までご連絡ください。対応に先立ち、本人確認を行い、適用される法律や他の台帳メンバーの権利を考慮する場合があります。製品内では、アクセス権のある支出を CSV でエクスポートし、権限に応じてメンバーと GitHub アクセス権を管理し、ご自身の API キーを取り消すことができます。" },
  { match: /^Contact (.+) with privacy or security questions\.$/, translation: "プライバシーやセキュリティに関する質問は $1 までお問い合わせください。" },
  { match: /^For questions, contact (.+)\.$/, translation: "ご質問は $1 までお問い合わせください。" },
  { match: /^([\d,]+) repositories$/, translation: "$1 件のリポジトリ" },
  { match: /^Last verified by @(.+)$/, translation: "最終確認: @$1" },
  { match: /^Needs a GitHub account with access to (.+)$/, translation: "$1 にアクセスできる GitHub アカウントが必要です" },
  { match: /^Manage (.+) GitHub App installation$/, translation: "$1 の GitHub App インストールを管理" },
  { match: /^(.+) more per (.+)$/, translation: "$2 あたり $1 増" },
  { match: /^(.+) less per (.+)$/, translation: "$2 あたり $1 減" },
  { match: /^Billed (.+)$/, translation: "$1 請求" },
  { match: /^Switch to (.+)$/, translation: "$1 に切り替え" },
  { match: /^Start (.+)$/, translation: "$1 を開始" },
  { match: /^(.+) repositories authorized(.*)$/, translation: "$1 件のリポジトリ認可済み$2" },
  { match: /^Questions\? Email (.+)\.$/, translation: "質問は $1 までメールしてください。" },
  { match: /^Go to (.+)$/, translation: "$1 へ移動" },
];
