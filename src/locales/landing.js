// Homepage copy for the illustrative example ledger. Sample rows describe the
// product's shape only; they are not account data or Norulo prices.
export const LANDING_COPY = {
  example: [
    "Example ledger",
    { zh: "账本示例", ja: "台帳の例", ko: "원장 예시", fr: "Exemple de registre", es: "Libro de ejemplo" },
  ],
  project: [
    "Website launch",
    {
      zh: "网站上线",
      ja: "Web サイト公開",
      ko: "웹사이트 출시",
      fr: "Lancement du site",
      es: "Lanzamiento web",
    },
  ],
  hosting: [
    "Hosting",
    { zh: "主机托管", ja: "ホスティング", ko: "호스팅", fr: "Hébergement", es: "Alojamiento" },
  ],
  domain: [
    "Domain renewal",
    {
      zh: "域名续费",
      ja: "ドメイン更新",
      ko: "도메인 갱신",
      fr: "Renouvellement du domaine",
      es: "Renovación de dominio",
    },
  ],
  design: [
    "Design assets",
    {
      zh: "设计素材",
      ja: "デザイン素材",
      ko: "디자인 에셋",
      fr: "Ressources graphiques",
      es: "Recursos de diseño",
    },
  ],
  ci: [
    "CI minutes",
    { zh: "CI 时长", ja: "CI 実行時間", ko: "CI 사용 시간", fr: "Minutes de CI", es: "Minutos de CI" },
  ],
  separate: [
    "Each currency keeps its own total. No conversion.",
    {
      zh: "每种币种单独合计，不做换算。",
      ja: "通貨ごとに個別に合計し、換算はしません。",
      ko: "통화마다 합계를 따로 두며 환산하지 않습니다.",
      fr: "Chaque devise garde son propre total, sans conversion.",
      es: "Cada moneda tiene su propio total, sin conversión.",
    },
  ],
};

const copy = (en, zh, ja, ko, fr, es) => [en, { zh, ja, ko, fr, es }];

// Homepage section labels and the MCP connector spotlight. The conversation is
// illustrative and reuses the example ledger's figures; it is not account data.
export const LANDING_SECTIONS = {
  ledgerKicker: copy("How it works", "使用方式", "使い方", "사용 방법", "Fonctionnement", "Cómo funciona"),
  alsoIncluded: copy("Also included", "同样包含", "その他の機能", "함께 제공", "Également inclus", "También incluye"),
  developersKicker: copy("For developers", "面向开发者", "開発者向け", "개발자용", "Pour les développeurs", "Para desarrolladores"),
  mcpKicker: copy("MCP connector · OAuth", "MCP 连接器 · OAuth", "MCP コネクター · OAuth", "MCP 커넥터 · OAuth", "Connecteur MCP · OAuth", "Conector MCP · OAuth"),
  mcpPoints: [
    {
      title: copy("Ask in plain language", "用自然语言提问", "普段の言葉で質問", "평소 말투로 질문", "Posez vos questions simplement", "Pregunta con tus palabras"),
      text: copy(
        "Get totals, category breakdowns and exports from a conversation, with every currency kept separate.",
        "在对话中获取汇总、类别明细和导出结果，各币种始终分开统计。",
        "会話から合計、カテゴリー別の内訳、エクスポートを取得できます。通貨は常に分けて集計します。",
        "대화로 합계, 카테고리별 내역, 내보내기를 받을 수 있으며 통화는 항상 따로 집계됩니다.",
        "Obtenez totaux, ventilations par catégorie et exports depuis une conversation, chaque devise restant séparée.",
        "Obtén totales, desgloses por categoría y exportaciones desde una conversación, con cada moneda por separado."
      ),
    },
    {
      title: copy("You decide what it can access", "访问范围由你决定", "アクセス範囲は自分で決める", "접근 범위는 직접 결정", "Vous choisissez ce qu’il voit", "Tú decides a qué accede"),
      text: copy(
        "Pick the ledger, projects and read or write permissions when you connect. Your ledger role still applies.",
        "连接时选择账本、项目以及读取或写入权限。你的账本角色限制依然有效。",
        "接続時に帳簿、プロジェクト、読み取り・書き込み権限を選びます。帳簿のロール制限は引き続き適用されます。",
        "연결할 때 장부, 프로젝트, 읽기 또는 쓰기 권한을 선택합니다. 장부 역할 제한은 계속 적용됩니다.",
        "Choisissez le registre, les projets et les autorisations de lecture ou d’écriture à la connexion. Votre rôle dans le registre s’applique toujours.",
        "Elige el libro, los proyectos y los permisos de lectura o escritura al conectar. Tu rol en el libro sigue aplicándose."
      ),
    },
    {
      title: copy("No API key to copy", "无需复制 API 密钥", "API キーのコピー不要", "API 키 복사 불필요", "Aucune clé API à copier", "Sin claves API que copiar"),
      text: copy(
        "Connect with OAuth in a few clicks and revoke access anytime from API Keys.",
        "通过 OAuth 几步即可连接，并可随时在 API Keys 中撤销访问。",
        "OAuth で数クリックで接続でき、API Keys からいつでもアクセスを取り消せます。",
        "OAuth로 몇 번의 클릭만에 연결하고 API Keys에서 언제든 접근을 취소할 수 있습니다.",
        "Connectez-vous en quelques clics avec OAuth et révoquez l’accès à tout moment depuis API Keys.",
        "Conéctate con OAuth en unos clics y revoca el acceso cuando quieras desde API Keys."
      ),
    },
  ],
  worksWith: copy("Works with", "支持", "対応アプリ", "지원 앱", "Compatible avec", "Compatible con"),
  anyClient: copy("any MCP client", "任意 MCP 客户端", "その他の MCP クライアント", "기타 MCP 클라이언트", "tout client MCP", "cualquier cliente MCP"),
  claudeSetup: copy("Claude setup", "Claude 配置步骤", "Claude の設定手順", "Claude 설정 방법", "Configuration Claude", "Configuración en Claude"),
  chatgptSetup: copy("ChatGPT setup", "ChatGPT 配置步骤", "ChatGPT の設定手順", "ChatGPT 설정 방법", "Configuration ChatGPT", "Configuración en ChatGPT"),
  chatTitle: copy("Example conversation", "对话示例", "会話の例", "대화 예시", "Exemple de conversation", "Conversación de ejemplo"),
  connected: copy("Norulo connected", "Norulo 已连接", "Norulo 接続済み", "Norulo 연결됨", "Norulo connecté", "Norulo conectado"),
  chatPrompt: copy(
    "Summarize my project spending this month, keeping each currency separate.",
    "汇总我本月的项目支出，各币种分别统计。",
    "今月のプロジェクト支出を通貨ごとに分けて要約して。",
    "이번 달 프로젝트 지출을 통화별로 나눠 요약해 줘.",
    "Résume mes dépenses de projet ce mois-ci, en séparant chaque devise.",
    "Resume el gasto de mis proyectos este mes, separando cada moneda."
  ),
  chatTool: copy("Norulo tool", "Norulo 工具", "Norulo ツール", "Norulo 도구", "Outil Norulo", "Herramienta de Norulo"),
  chatReply: copy(
    "This month’s spending, with each currency kept separate:",
    "本月支出如下，各币种分别统计：",
    "今月の支出を通貨ごとに分けて集計しました。",
    "이번 달 지출을 통화별로 나눠 집계했습니다.",
    "Voici les dépenses de ce mois-ci, chaque devise séparée :",
    "Este es el gasto de este mes, con cada moneda por separado:"
  ),
  chatFollowUp: copy(
    "Design assets (EUR 49.00) is the largest single cost.",
    "设计素材（EUR 49.00）是单笔最大支出。",
    "最も大きな支出はデザイン素材（EUR 49.00）です。",
    "가장 큰 단일 지출은 디자인 에셋(EUR 49.00)입니다.",
    "Les ressources graphiques (EUR 49.00) sont la dépense la plus élevée.",
    "Los recursos de diseño (EUR 49.00) son el mayor gasto individual."
  ),
  serverUrl: copy("MCP server URL", "MCP 服务器 URL", "MCP サーバー URL", "MCP 서버 URL", "URL du serveur MCP", "URL del servidor MCP"),
  copyUrl: copy("Copy", "复制", "コピー", "복사", "Copier", "Copiar"),
  copiedUrl: copy("Copied", "已复制", "コピーしました", "복사됨", "Copié", "Copiado"),
  copyUrlLabel: copy("Copy the MCP server URL", "复制 MCP 服务器 URL", "MCP サーバー URL をコピー", "MCP 서버 URL 복사", "Copier l’URL du serveur MCP", "Copiar la URL del servidor MCP"),
};
