// Public AI-agent setup guide served at /plugins. Configuration steps only:
// ChatGPT and Claude both use Norulo's native OAuth MCP flow, with no download.
const copy = (en, zh, ja, ko, fr, es) => [en, { zh, ja, ko, fr, es }];

export const MCP_SERVER_URL = "https://mcp.norulo.com/mcp";
export const SUPPORT_EMAIL = "contact@norulo.com";
export const CLAUDE_CONNECTORS_URL = "https://claude.ai/settings/connectors";

// Host field labels stay in English so they match each client's interface.
export const CHATGPT_CONNECTION_DETAILS = [
  "Name: Norulo",
  `MCP server URL: ${MCP_SERVER_URL}`,
  "Authentication: OAuth",
].join("\n");
export const CLAUDE_CONNECTION_DETAILS = [
  "Name: Norulo",
  `Remote MCP server URL: ${MCP_SERVER_URL}`,
].join("\n");
export const CLAUDE_CODE_COMMAND = `claude mcp add --transport http norulo ${MCP_SERVER_URL}`;

const signInStep = (id) => ({
  id,
  title: copy("Sign in to Norulo", "登录 Norulo", "Norulo にログイン", "Norulo에 로그인", "Se connecter à Norulo", "Iniciar sesión en Norulo"),
  text: [
    copy(
      "Visit https://norulo.com and sign in to the account containing your ledger.",
      "访问 https://norulo.com，登录包含你账本的账户。",
      "https://norulo.com にアクセスし、帳簿があるアカウントにログインします。",
      "https://norulo.com에 접속해 장부가 있는 계정으로 로그인하세요.",
      "Rendez-vous sur https://norulo.com et connectez-vous au compte qui contient votre registre.",
      "Visita https://norulo.com e inicia sesión en la cuenta que contiene tu libro."
    ),
  ],
});

const examplePrompts = [
  copy("Summarize my project spending this month, keeping each currency separate.", "汇总我本月的项目支出，各币种分别统计。", "今月のプロジェクト支出を通貨ごとに分けて要約して。", "이번 달 프로젝트 지출을 통화별로 나눠 요약해 줘.", "Résume mes dépenses de projet ce mois-ci, en séparant chaque devise.", "Resume el gasto de mis proyectos este mes, separando cada moneda."),
  copy("Show spending by category for my project last month.", "按类别显示我的项目上个月的支出。", "先月のプロジェクト支出をカテゴリー別に表示して。", "지난달 내 프로젝트 지출을 카테고리별로 보여 줘.", "Affiche les dépenses par catégorie de mon projet le mois dernier.", "Muestra el gasto por categoría de mi proyecto el mes pasado."),
  copy("List my active recurring expense rules.", "列出我当前启用的周期支出规则。", "有効な定期支出ルールを一覧表示して。", "활성화된 반복 지출 규칙을 보여 줘.", "Liste mes règles de dépenses récurrentes actives.", "Enumera mis reglas de gastos recurrentes activas."),
  copy("Help me record a project expense.", "帮我记录一笔项目支出。", "プロジェクトの支出を記録するのを手伝って。", "프로젝트 지출 기록을 도와줘.", "Aide-moi à enregistrer une dépense de projet.", "Ayúdame a registrar un gasto de proyecto."),
];

const apiKeysLink = copy("Open API Keys", "打开 API Keys", "API Keys を開く", "API Keys 열기", "Ouvrir API Keys", "Abrir API Keys");

export const PLUGINS_GUIDE = {
  nav: copy("Plugins", "插件", "プラグイン", "플러그인", "Plugins", "Plugins"),
  sections: copy("Plugins sections", "插件章节", "プラグインのセクション", "플러그인 섹션", "Sections Plugins", "Secciones de Plugins"),
  groupChatGPT: copy("Set up in ChatGPT", "在 ChatGPT 中配置", "ChatGPT で設定", "ChatGPT에서 설정", "Configurer dans ChatGPT", "Configurar en ChatGPT"),
  groupClaude: copy("Set up in Claude", "在 Claude 中配置", "Claude で設定", "Claude에서 설정", "Configurer dans Claude", "Configurar en Claude"),
  groupHelp: copy("Help", "帮助", "ヘルプ", "도움말", "Aide", "Ayuda"),
  title: copy("Use Norulo with AI agents", "在 AI 智能体中使用 Norulo", "AI エージェントで Norulo を使う", "AI 에이전트에서 Norulo 사용", "Utiliser Norulo avec des agents IA", "Usar Norulo con agentes de IA"),
  intro: copy(
    "Connect Norulo to Claude or ChatGPT to view project expenses, analyze spending, export records and manage bookkeeping through conversation. Choose which ledger, projects and permissions the AI agent can access.",
    "将 Norulo 连接到 Claude 或 ChatGPT，即可通过对话查看项目支出、分析花费、导出记录并管理记账。你可以选择 AI 智能体能访问的账本、项目和权限。",
    "Norulo を Claude または ChatGPT に接続すると、会話でプロジェクトの支出確認、支出分析、記録のエクスポート、記帳の管理ができます。AI エージェントがアクセスできる帳簿、プロジェクト、権限は自分で選べます。",
    "Norulo를 Claude 또는 ChatGPT에 연결하면 대화로 프로젝트 지출을 조회하고, 지출을 분석하고, 기록을 내보내고, 장부를 관리할 수 있습니다. AI 에이전트가 접근할 장부, 프로젝트, 권한은 직접 선택합니다.",
    "Connectez Norulo à Claude ou à ChatGPT pour consulter les dépenses de projet, analyser les coûts, exporter les enregistrements et gérer la comptabilité par la conversation. Choisissez le registre, les projets et les autorisations auxquels l’agent IA peut accéder.",
    "Conecta Norulo a Claude o ChatGPT para consultar gastos de proyectos, analizar costes, exportar registros y gestionar la contabilidad mediante la conversación. Elige a qué libro, proyectos y permisos puede acceder el agente de IA."
  ),
  interfaceNote: copy(
    "Claude and ChatGPT menus change over time. The labels below describe the current interfaces and may differ in your account, workspace or client version; choose the closest matching option.",
    "Claude 和 ChatGPT 的菜单会随时间调整。以下名称对应当前界面，可能因账户、工作区或客户端版本而不同，请选择最接近的选项。",
    "Claude と ChatGPT のメニューは随時変わります。以下の名称は現在の画面に基づくもので、アカウント、ワークスペース、クライアントのバージョンによって異なる場合があります。最も近い項目を選んでください。",
    "Claude와 ChatGPT 메뉴는 수시로 바뀝니다. 아래 명칭은 현재 화면 기준이며 계정, 워크스페이스, 클라이언트 버전에 따라 다를 수 있으니 가장 가까운 항목을 선택하세요.",
    "Les menus de Claude et de ChatGPT évoluent. Les libellés ci-dessous décrivent les interfaces actuelles et peuvent différer selon votre compte, votre espace de travail ou la version du client ; choisissez l’option la plus proche.",
    "Los menús de Claude y ChatGPT cambian con el tiempo. Las etiquetas siguientes describen las interfaces actuales y pueden variar según tu cuenta, espacio de trabajo o versión del cliente; elige la opción más parecida."
  ),
  noDownloadTitle: copy("No download needed", "无需下载", "ダウンロード不要", "다운로드 불필요", "Aucun téléchargement", "Sin descargas"),
  noDownload: copy(
    "Claude and ChatGPT both connect to Norulo through the same native OAuth flow. You do not download or upload a plugin ZIP, and you never copy an API key or client secret into the AI app.",
    "Claude 和 ChatGPT 都通过同一套原生 OAuth 流程连接 Norulo。无需下载或上传插件 ZIP，也无需把 API 密钥或客户端密钥复制到 AI 应用中。",
    "Claude と ChatGPT はどちらも同じネイティブ OAuth フローで Norulo に接続します。プラグイン ZIP のダウンロードやアップロードは不要で、API キーやクライアントシークレットを AI アプリにコピーすることもありません。",
    "Claude와 ChatGPT 모두 동일한 기본 OAuth 흐름으로 Norulo에 연결합니다. 플러그인 ZIP을 내려받거나 업로드할 필요가 없으며 API 키나 클라이언트 시크릿을 AI 앱에 복사하지 않습니다.",
    "Claude et ChatGPT se connectent tous deux à Norulo via le même flux OAuth natif. Aucun fichier ZIP de plugin à télécharger ou importer, et aucune clé API ni secret client à copier dans l’application IA.",
    "Claude y ChatGPT se conectan a Norulo mediante el mismo flujo OAuth nativo. No descargas ni subes ningún ZIP de plugin y nunca copias una clave API ni un secreto de cliente en la aplicación de IA."
  ),
  detailsTitle: copy("Connection details", "连接信息", "接続情報", "연결 정보", "Informations de connexion", "Datos de conexión"),
  chatgptSteps: [
    signInStep("sign-in"),
    {
      id: "open-plugins",
      title: copy("Open ChatGPT Plugins", "打开 ChatGPT 插件", "ChatGPT のプラグインを開く", "ChatGPT 플러그인 열기", "Ouvrir les Plugins ChatGPT", "Abrir Plugins de ChatGPT"),
      text: [
        copy(
          "Visit https://chatgpt.com/plugins and select “Add custom MCP server” from the available creation menu. Enable Developer mode if required by the current interface.",
          "访问 https://chatgpt.com/plugins，在可用的创建菜单中选择“Add custom MCP server”（添加自定义 MCP 服务器）。如当前界面要求，请先启用 Developer mode（开发者模式）。",
          "https://chatgpt.com/plugins にアクセスし、作成メニューから「Add custom MCP server」（カスタム MCP サーバーを追加）を選びます。現在の画面で必要な場合は Developer mode（開発者モード）を有効にします。",
          "https://chatgpt.com/plugins에 접속해 생성 메뉴에서 “Add custom MCP server”(사용자 지정 MCP 서버 추가)를 선택하세요. 현재 화면에서 요구하면 Developer mode(개발자 모드)를 켜세요.",
          "Rendez-vous sur https://chatgpt.com/plugins et choisissez « Add custom MCP server » (ajouter un serveur MCP personnalisé) dans le menu de création disponible. Activez Developer mode (mode développeur) si l’interface actuelle l’exige.",
          "Visita https://chatgpt.com/plugins y elige «Add custom MCP server» (añadir servidor MCP personalizado) en el menú de creación disponible. Activa Developer mode (modo desarrollador) si la interfaz actual lo requiere."
        ),
      ],
    },
    {
      id: "details",
      title: copy("Enter the connection details", "填写连接信息", "接続情報を入力", "연결 정보 입력", "Saisir les informations de connexion", "Introducir los datos de conexión"),
      text: [
        copy(
          "Enter these values exactly. OAuth does not need a client secret or API key from you.",
          "按原样填写以下内容。OAuth 无需你提供客户端密钥或 API 密钥。",
          "以下の値をそのまま入力します。OAuth ではクライアントシークレットや API キーは不要です。",
          "아래 값을 그대로 입력하세요. OAuth에는 클라이언트 시크릿이나 API 키가 필요하지 않습니다.",
          "Saisissez ces valeurs telles quelles. OAuth ne vous demande ni secret client ni clé API.",
          "Introduce estos valores tal cual. OAuth no necesita que aportes un secreto de cliente ni una clave API."
        ),
      ],
      details: CHATGPT_CONNECTION_DETAILS,
    },
    {
      id: "create",
      title: copy("Create the connection", "创建连接", "接続を作成", "연결 만들기", "Créer la connexion", "Crear la conexión"),
      text: [
        copy(
          "Save the configuration. Select “Create as a plugin” if that option appears.",
          "保存配置。如果出现“Create as a plugin”（创建为插件）选项，请选择它。",
          "設定を保存します。「Create as a plugin」（プラグインとして作成）が表示された場合は選択します。",
          "설정을 저장하세요. “Create as a plugin”(플러그인으로 만들기) 옵션이 보이면 선택하세요.",
          "Enregistrez la configuration. Choisissez « Create as a plugin » (créer en tant que plugin) si cette option apparaît.",
          "Guarda la configuración. Elige «Create as a plugin» (crear como plugin) si aparece esa opción."
        ),
      ],
    },
    {
      id: "authorize",
      title: copy("Connect your Norulo account", "连接你的 Norulo 账户", "Norulo アカウントを接続", "Norulo 계정 연결", "Connecter votre compte Norulo", "Conectar tu cuenta de Norulo"),
      text: [
        copy(
          "Click “Connect” and complete authorization on Norulo. Select the intended ledger, projects, shared-expense access and permissions.",
          "点击“Connect”（连接），在 Norulo 完成授权。选择目标账本、项目、公共支出访问范围和权限。",
          "「Connect」（接続）をクリックし、Norulo で認可を完了します。対象の帳簿、プロジェクト、共有経費へのアクセス、権限を選択します。",
          "“Connect”(연결)를 클릭하고 Norulo에서 인증을 완료하세요. 대상 장부, 프로젝트, 공유 경비 접근 범위와 권한을 선택하세요.",
          "Cliquez sur « Connect » (connecter) et terminez l’autorisation sur Norulo. Sélectionnez le registre, les projets, l’accès aux dépenses partagées et les autorisations voulus.",
          "Pulsa «Connect» (conectar) y completa la autorización en Norulo. Selecciona el libro, los proyectos, el acceso a gastos compartidos y los permisos que necesitas."
        ),
        copy(
          "Read permissions (profile:read, projects:read, categories:read, expenses:read and reports:read) support queries, reports and exports. Grant the corresponding write permissions, such as expenses:write, only when ChatGPT needs to create or edit records; your ledger role still applies.",
          "读取权限（profile:read、projects:read、categories:read、expenses:read 和 reports:read）用于查询、报表和导出。只有需要 ChatGPT 创建或修改记录时，才授予相应写入权限（如 expenses:write）；你的账本角色限制依然有效。",
          "読み取り権限（profile:read、projects:read、categories:read、expenses:read、reports:read）で照会、レポート、エクスポートができます。ChatGPT に記録の作成や編集をさせる場合のみ、expenses:write などの対応する書き込み権限を付与します。帳簿のロール制限は引き続き適用されます。",
          "읽기 권한(profile:read, projects:read, categories:read, expenses:read, reports:read)으로 조회, 보고서, 내보내기를 할 수 있습니다. ChatGPT가 기록을 만들거나 수정해야 할 때만 expenses:write 등 해당 쓰기 권한을 부여하세요. 장부 역할 제한은 계속 적용됩니다.",
          "Les autorisations de lecture (profile:read, projects:read, categories:read, expenses:read et reports:read) permettent requêtes, rapports et exports. N’accordez les autorisations d’écriture correspondantes, comme expenses:write, que si ChatGPT doit créer ou modifier des enregistrements ; votre rôle dans le registre s’applique toujours.",
          "Los permisos de lectura (profile:read, projects:read, categories:read, expenses:read y reports:read) permiten consultas, informes y exportaciones. Concede los permisos de escritura correspondientes, como expenses:write, solo cuando ChatGPT deba crear o editar registros; tu rol en el libro sigue aplicándose."
        ),
        copy(
          "Complete authorization and return to ChatGPT.",
          "完成授权后返回 ChatGPT。",
          "認可を完了して ChatGPT に戻ります。",
          "인증을 완료하고 ChatGPT로 돌아가세요.",
          "Terminez l’autorisation et revenez dans ChatGPT.",
          "Completa la autorización y vuelve a ChatGPT."
        ),
      ],
    },
    {
      id: "start",
      title: copy("Start using Norulo", "开始使用 Norulo", "Norulo を使い始める", "Norulo 사용 시작", "Commencer à utiliser Norulo", "Empezar a usar Norulo"),
      text: [
        copy(
          "Start a new conversation and select Norulo through ChatGPT’s available plugin or tool selector. Try one of these prompts:",
          "新建对话，并通过 ChatGPT 提供的插件或工具选择器选择 Norulo。可以试试以下指令：",
          "新しい会話を開始し、ChatGPT のプラグインまたはツール選択から Norulo を選びます。次のような指示を試してください。",
          "새 대화를 시작하고 ChatGPT의 플러그인 또는 도구 선택기에서 Norulo를 선택하세요. 다음 요청을 시도해 보세요.",
          "Ouvrez une nouvelle conversation et sélectionnez Norulo via le sélecteur de plugins ou d’outils de ChatGPT. Essayez par exemple :",
          "Inicia una conversación nueva y selecciona Norulo en el selector de plugins o herramientas de ChatGPT. Prueba con estas instrucciones:"
        ),
      ],
      examples: examplePrompts,
    },
    {
      id: "manage",
      title: copy("Manage access", "管理访问", "アクセスを管理", "접근 관리", "Gérer l’accès", "Gestionar el acceso"),
      text: [
        copy(
          "To reconnect or disconnect, open Norulo in ChatGPT’s plugin settings and choose the reconnect or disconnect action. Reconnect to change the ledger, projects or permissions you granted.",
          "如需重新连接或断开，请在 ChatGPT 的插件设置中打开 Norulo，选择重新连接或断开连接。要更改已授予的账本、项目或权限，请重新连接。",
          "再接続や切断は、ChatGPT のプラグイン設定で Norulo を開き、再接続または切断を選びます。付与した帳簿、プロジェクト、権限を変更するには再接続します。",
          "다시 연결하거나 연결을 해제하려면 ChatGPT 플러그인 설정에서 Norulo를 열고 다시 연결 또는 연결 해제를 선택하세요. 부여한 장부, 프로젝트, 권한을 바꾸려면 다시 연결하세요.",
          "Pour reconnecter ou déconnecter, ouvrez Norulo dans les paramètres des plugins de ChatGPT et choisissez l’action correspondante. Reconnectez-vous pour modifier le registre, les projets ou les autorisations accordés.",
          "Para reconectar o desconectar, abre Norulo en la configuración de plugins de ChatGPT y elige la acción correspondiente. Vuelve a conectar para cambiar el libro, los proyectos o los permisos concedidos."
        ),
        copy(
          "To revoke authorization on the Norulo side, sign in to Norulo, open API Keys and revoke the OAuth key created for the ChatGPT connection. Revoking stops its access but does not delete ledger history or recall data already shared in a conversation.",
          "如需在 Norulo 端撤销授权，请登录 Norulo，打开 API Keys，撤销为 ChatGPT 连接创建的 OAuth 密钥。撤销会停止其访问，但不会删除账本历史，也无法收回已在对话中分享的数据。",
          "Norulo 側で認可を取り消すには、Norulo にログインして API Keys を開き、ChatGPT 接続用に作成された OAuth キーを失効させます。失効するとアクセスは止まりますが、帳簿の履歴は削除されず、会話で共有済みのデータも回収されません。",
          "Norulo 측에서 인증을 취소하려면 Norulo에 로그인해 API Keys를 열고 ChatGPT 연결용으로 생성된 OAuth 키를 폐기하세요. 폐기하면 접근이 중단되지만 장부 기록은 삭제되지 않으며 대화에서 이미 공유된 데이터도 회수되지 않습니다.",
          "Pour révoquer l’autorisation côté Norulo, connectez-vous, ouvrez API Keys et révoquez la clé OAuth créée pour la connexion ChatGPT. La révocation coupe l’accès sans supprimer l’historique du registre ni rappeler les données déjà partagées dans une conversation.",
          "Para revocar la autorización en Norulo, inicia sesión, abre API Keys y revoca la clave OAuth creada para la conexión de ChatGPT. Revocarla detiene su acceso, pero no borra el historial del libro ni recupera datos ya compartidos en una conversación."
        ),
        copy(
          "Signing in to another Norulo account in your browser does not switch an existing ChatGPT connection. To use a different account or ledger, disconnect in ChatGPT, then connect again and authorize with the intended account.",
          "在浏览器中登录另一个 Norulo 账户，不会自动切换已有的 ChatGPT 连接。如需使用其他账户或账本，请先在 ChatGPT 中断开连接，再重新连接并使用目标账户授权。",
          "ブラウザーで別の Norulo アカウントにログインしても、既存の ChatGPT 接続は切り替わりません。別のアカウントや帳簿を使うには、ChatGPT で切断してから再接続し、目的のアカウントで認可します。",
          "브라우저에서 다른 Norulo 계정으로 로그인해도 기존 ChatGPT 연결은 바뀌지 않습니다. 다른 계정이나 장부를 사용하려면 ChatGPT에서 연결을 해제한 뒤 다시 연결해 원하는 계정으로 인증하세요.",
          "Se connecter à un autre compte Norulo dans le navigateur ne change pas une connexion ChatGPT existante. Pour utiliser un autre compte ou registre, déconnectez-vous dans ChatGPT, puis reconnectez-vous et autorisez avec le compte voulu.",
          "Iniciar sesión en otra cuenta de Norulo en el navegador no cambia una conexión de ChatGPT existente. Para usar otra cuenta o libro, desconecta en ChatGPT, vuelve a conectar y autoriza con la cuenta deseada."
        ),
      ],
      apiKeysLink,
    },
  ],
  claudeSteps: [
    signInStep("claude-sign-in"),
    {
      id: "claude-open-connectors",
      title: copy("Open Claude connector settings", "打开 Claude 连接器设置", "Claude のコネクター設定を開く", "Claude 커넥터 설정 열기", "Ouvrir les paramètres des connecteurs Claude", "Abrir la configuración de conectores de Claude"),
      text: [
        copy(
          "Visit https://claude.ai/settings/connectors, or open Settings and choose Connectors. Custom connectors are available on Claude Free, Pro, Max, Team and Enterprise plans; Free accounts can add one custom connector.",
          "访问 https://claude.ai/settings/connectors，或打开 Settings（设置）并选择 Connectors（连接器）。Claude Free、Pro、Max、Team 和 Enterprise 套餐均可使用自定义连接器；Free 账户可添加一个自定义连接器。",
          "https://claude.ai/settings/connectors にアクセスするか、Settings（設定）を開いて Connectors（コネクター）を選びます。カスタムコネクターは Claude の Free、Pro、Max、Team、Enterprise プランで利用でき、Free アカウントは 1 つまで追加できます。",
          "https://claude.ai/settings/connectors에 접속하거나 Settings(설정)를 열고 Connectors(커넥터)를 선택하세요. 사용자 지정 커넥터는 Claude Free, Pro, Max, Team, Enterprise 요금제에서 사용할 수 있으며 Free 계정은 하나까지 추가할 수 있습니다.",
          "Rendez-vous sur https://claude.ai/settings/connectors, ou ouvrez Settings (paramètres) et choisissez Connectors (connecteurs). Les connecteurs personnalisés sont disponibles avec les offres Claude Free, Pro, Max, Team et Enterprise ; un compte Free peut en ajouter un.",
          "Visita https://claude.ai/settings/connectors o abre Settings (configuración) y elige Connectors (conectores). Los conectores personalizados están disponibles en los planes Claude Free, Pro, Max, Team y Enterprise; las cuentas Free pueden añadir uno."
        ),
        copy(
          "On Team and Enterprise plans, an Owner first adds Norulo under Organization settings → Connectors. Members then find Norulo in their own Connectors settings and connect their own Norulo account in step 4.",
          "在 Team 和 Enterprise 套餐中，需由 Owner 先在 Organization settings → Connectors（组织设置 → 连接器）中添加 Norulo。成员随后在自己的连接器设置中找到 Norulo，并在第 4 步连接自己的 Norulo 账户。",
          "Team と Enterprise プランでは、まず Owner が Organization settings → Connectors（組織設定 → コネクター）で Norulo を追加します。メンバーは自分のコネクター設定で Norulo を見つけ、手順 4 で自分の Norulo アカウントを接続します。",
          "Team 및 Enterprise 요금제에서는 Owner가 먼저 Organization settings → Connectors(조직 설정 → 커넥터)에서 Norulo를 추가합니다. 그다음 멤버가 자신의 커넥터 설정에서 Norulo를 찾아 4단계에서 자신의 Norulo 계정을 연결합니다.",
          "Avec les offres Team et Enterprise, un Owner ajoute d’abord Norulo dans Organization settings → Connectors (paramètres de l’organisation → connecteurs). Chaque membre retrouve ensuite Norulo dans ses propres paramètres de connecteurs et connecte son propre compte Norulo à l’étape 4.",
          "En los planes Team y Enterprise, un Owner añade primero Norulo en Organization settings → Connectors (configuración de la organización → conectores). Después, cada miembro encuentra Norulo en su propia configuración de conectores y conecta su propia cuenta de Norulo en el paso 4."
        ),
      ],
    },
    {
      id: "claude-add-connector",
      title: copy("Add Norulo as a custom connector", "将 Norulo 添加为自定义连接器", "Norulo をカスタムコネクターとして追加", "Norulo를 사용자 지정 커넥터로 추가", "Ajouter Norulo comme connecteur personnalisé", "Añadir Norulo como conector personalizado"),
      text: [
        copy(
          "Click “Add custom connector” and enter these values exactly. Leave the OAuth Client ID and OAuth Client Secret fields under “Advanced settings” empty: Claude registers itself with Norulo automatically. Then click “Add”.",
          "点击“Add custom connector”（添加自定义连接器），按原样填写以下内容。“Advanced settings”（高级设置）中的 OAuth Client ID 和 OAuth Client Secret 请留空：Claude 会自动向 Norulo 注册。然后点击“Add”（添加）。",
          "「Add custom connector」（カスタムコネクターを追加）をクリックし、以下の値をそのまま入力します。「Advanced settings」（詳細設定）の OAuth Client ID と OAuth Client Secret は空欄のままにします。Claude が自動で Norulo に登録されます。最後に「Add」（追加）をクリックします。",
          "“Add custom connector”(사용자 지정 커넥터 추가)를 클릭하고 아래 값을 그대로 입력하세요. “Advanced settings”(고급 설정)의 OAuth Client ID와 OAuth Client Secret은 비워 두세요. Claude가 Norulo에 자동으로 등록됩니다. 그런 다음 “Add”(추가)를 클릭하세요.",
          "Cliquez sur « Add custom connector » (ajouter un connecteur personnalisé) et saisissez ces valeurs telles quelles. Laissez vides les champs OAuth Client ID et OAuth Client Secret sous « Advanced settings » (paramètres avancés) : Claude s’enregistre automatiquement auprès de Norulo. Cliquez ensuite sur « Add » (ajouter).",
          "Pulsa «Add custom connector» (añadir conector personalizado) e introduce estos valores tal cual. Deja vacíos los campos OAuth Client ID y OAuth Client Secret de «Advanced settings» (configuración avanzada): Claude se registra automáticamente en Norulo. Después pulsa «Add» (añadir)."
        ),
      ],
      details: CLAUDE_CONNECTION_DETAILS,
    },
    {
      id: "claude-authorize",
      title: copy("Connect your Norulo account", "连接你的 Norulo 账户", "Norulo アカウントを接続", "Norulo 계정 연결", "Connecter votre compte Norulo", "Conectar tu cuenta de Norulo"),
      text: [
        copy(
          "Click “Connect” next to Norulo. A Norulo authorization page opens: sign in if asked, then select the intended ledger, projects, shared-expense access and permissions, and approve.",
          "点击 Norulo 旁的“Connect”（连接）。系统会打开 Norulo 授权页面：如有提示请先登录，然后选择目标账本、项目、公共支出访问范围和权限，并确认授权。",
          "Norulo の横にある「Connect」（接続）をクリックします。Norulo の認可ページが開くので、必要に応じてログインし、対象の帳簿、プロジェクト、共有経費へのアクセス、権限を選んで承認します。",
          "Norulo 옆의 “Connect”(연결)를 클릭하세요. Norulo 인증 페이지가 열리면 필요 시 로그인한 뒤 대상 장부, 프로젝트, 공유 경비 접근 범위와 권한을 선택하고 승인하세요.",
          "Cliquez sur « Connect » (connecter) à côté de Norulo. Une page d’autorisation Norulo s’ouvre : connectez-vous si nécessaire, sélectionnez le registre, les projets, l’accès aux dépenses partagées et les autorisations voulus, puis approuvez.",
          "Pulsa «Connect» (conectar) junto a Norulo. Se abre una página de autorización de Norulo: inicia sesión si se te pide, selecciona el libro, los proyectos, el acceso a gastos compartidos y los permisos que necesitas, y aprueba."
        ),
        copy(
          "Read permissions (profile:read, projects:read, categories:read, expenses:read and reports:read) support queries, reports and exports. Grant the corresponding write permissions, such as expenses:write, only when Claude needs to create or edit records; your ledger role still applies.",
          "读取权限（profile:read、projects:read、categories:read、expenses:read 和 reports:read）用于查询、报表和导出。只有需要 Claude 创建或修改记录时，才授予相应写入权限（如 expenses:write）；你的账本角色限制依然有效。",
          "読み取り権限（profile:read、projects:read、categories:read、expenses:read、reports:read）で照会、レポート、エクスポートができます。Claude に記録の作成や編集をさせる場合のみ、expenses:write などの対応する書き込み権限を付与します。帳簿のロール制限は引き続き適用されます。",
          "읽기 권한(profile:read, projects:read, categories:read, expenses:read, reports:read)으로 조회, 보고서, 내보내기를 할 수 있습니다. Claude가 기록을 만들거나 수정해야 할 때만 expenses:write 등 해당 쓰기 권한을 부여하세요. 장부 역할 제한은 계속 적용됩니다.",
          "Les autorisations de lecture (profile:read, projects:read, categories:read, expenses:read et reports:read) permettent requêtes, rapports et exports. N’accordez les autorisations d’écriture correspondantes, comme expenses:write, que si Claude doit créer ou modifier des enregistrements ; votre rôle dans le registre s’applique toujours.",
          "Los permisos de lectura (profile:read, projects:read, categories:read, expenses:read y reports:read) permiten consultas, informes y exportaciones. Concede los permisos de escritura correspondientes, como expenses:write, solo cuando Claude deba crear o editar registros; tu rol en el libro sigue aplicándose."
        ),
        copy(
          "After you approve, you return to Claude and Norulo is shown as connected.",
          "确认授权后会返回 Claude，Norulo 将显示为已连接。",
          "承認すると Claude に戻り、Norulo が接続済みと表示されます。",
          "승인하면 Claude로 돌아가며 Norulo가 연결됨으로 표시됩니다.",
          "Après approbation, vous revenez dans Claude et Norulo apparaît comme connecté.",
          "Tras aprobar, vuelves a Claude y Norulo aparece como conectado."
        ),
      ],
    },
    {
      id: "claude-start",
      title: copy("Use Norulo in a chat", "在对话中使用 Norulo", "チャットで Norulo を使う", "채팅에서 Norulo 사용", "Utiliser Norulo dans une conversation", "Usar Norulo en un chat"),
      text: [
        copy(
          "Start a new chat, open the “+” menu below the message box, choose Connectors and make sure Norulo is turned on. Claude asks for your approval before using a Norulo tool unless you change that tool’s permission in the connector settings. Try one of these prompts:",
          "新建对话，打开输入框下方的“+”菜单，选择 Connectors（连接器），并确认 Norulo 已开启。除非你在连接器设置中修改了某个工具的权限，Claude 在使用 Norulo 工具前会先征求你的同意。可以试试以下指令：",
          "新しいチャットを開始し、入力欄の下にある「+」メニューから Connectors（コネクター）を選び、Norulo がオンになっていることを確認します。コネクター設定でツールの権限を変更しない限り、Claude は Norulo のツールを使う前に承認を求めます。次のような指示を試してください。",
          "새 채팅을 시작하고 입력창 아래의 “+” 메뉴에서 Connectors(커넥터)를 선택한 뒤 Norulo가 켜져 있는지 확인하세요. 커넥터 설정에서 도구 권한을 바꾸지 않는 한 Claude는 Norulo 도구를 사용하기 전에 승인을 요청합니다. 다음 요청을 시도해 보세요.",
          "Ouvrez une nouvelle conversation, ouvrez le menu « + » sous la zone de saisie, choisissez Connectors (connecteurs) et vérifiez que Norulo est activé. Claude vous demande votre accord avant d’utiliser un outil Norulo, sauf si vous modifiez l’autorisation de cet outil dans les paramètres du connecteur. Essayez par exemple :",
          "Inicia un chat nuevo, abre el menú «+» bajo el cuadro de mensaje, elige Connectors (conectores) y comprueba que Norulo está activado. Claude te pide aprobación antes de usar una herramienta de Norulo, salvo que cambies el permiso de esa herramienta en la configuración del conector. Prueba con estas instrucciones:"
        ),
      ],
      examples: examplePrompts,
      after: [
        copy(
          "Connectors added on claude.ai are also available in the Claude desktop and mobile apps signed in to the same account.",
          "在 claude.ai 上添加的连接器，也可在登录同一账户的 Claude 桌面版和移动版应用中使用。",
          "claude.ai で追加したコネクターは、同じアカウントでログインした Claude のデスクトップアプリやモバイルアプリでも使えます。",
          "claude.ai에서 추가한 커넥터는 같은 계정으로 로그인한 Claude 데스크톱 및 모바일 앱에서도 사용할 수 있습니다.",
          "Les connecteurs ajoutés sur claude.ai sont aussi disponibles dans les applications Claude pour ordinateur et mobile connectées au même compte.",
          "Los conectores añadidos en claude.ai también están disponibles en las aplicaciones de Claude para escritorio y móvil con la misma cuenta."
        ),
      ],
    },
    {
      id: "claude-code",
      title: copy("Optional: use Norulo in Claude Code", "可选：在 Claude Code 中使用 Norulo", "任意：Claude Code で Norulo を使う", "선택 사항: Claude Code에서 Norulo 사용", "Facultatif : utiliser Norulo dans Claude Code", "Opcional: usar Norulo en Claude Code"),
      text: [
        copy(
          "In a terminal, add Norulo with the command below. Then run /mcp inside Claude Code, select norulo and choose Authenticate to complete the same Norulo authorization in your browser.",
          "在终端中运行下面的命令添加 Norulo。然后在 Claude Code 中运行 /mcp，选择 norulo 并选择 Authenticate（认证），在浏览器中完成同样的 Norulo 授权。",
          "ターミナルで次のコマンドを実行して Norulo を追加します。続いて Claude Code で /mcp を実行し、norulo を選んで Authenticate（認証）を選択すると、ブラウザーで同じ Norulo の認可を完了できます。",
          "터미널에서 아래 명령으로 Norulo를 추가하세요. 그런 다음 Claude Code에서 /mcp를 실행하고 norulo를 선택한 뒤 Authenticate(인증)를 선택해 브라우저에서 동일한 Norulo 인증을 완료하세요.",
          "Dans un terminal, ajoutez Norulo avec la commande ci-dessous. Lancez ensuite /mcp dans Claude Code, sélectionnez norulo et choisissez Authenticate (s’authentifier) pour terminer la même autorisation Norulo dans votre navigateur.",
          "En una terminal, añade Norulo con el comando siguiente. Después ejecuta /mcp en Claude Code, selecciona norulo y elige Authenticate (autenticar) para completar la misma autorización de Norulo en tu navegador."
        ),
      ],
      command: CLAUDE_CODE_COMMAND,
    },
    {
      id: "claude-manage",
      title: copy("Manage access", "管理访问", "アクセスを管理", "접근 관리", "Gérer l’accès", "Gestionar el acceso"),
      text: [
        copy(
          "To disconnect or reconnect, open https://claude.ai/settings/connectors, select Norulo and choose Disconnect, or remove the connector. Reconnect to change the ledger, projects or permissions you granted.",
          "如需断开或重新连接，请打开 https://claude.ai/settings/connectors，选择 Norulo 后点击 Disconnect（断开连接），或移除该连接器。要更改已授予的账本、项目或权限，请重新连接。",
          "切断や再接続は、https://claude.ai/settings/connectors を開いて Norulo を選び、Disconnect（切断）を選ぶか、コネクターを削除します。付与した帳簿、プロジェクト、権限を変更するには再接続します。",
          "연결을 해제하거나 다시 연결하려면 https://claude.ai/settings/connectors를 열고 Norulo를 선택한 뒤 Disconnect(연결 해제)를 선택하거나 커넥터를 제거하세요. 부여한 장부, 프로젝트, 권한을 바꾸려면 다시 연결하세요.",
          "Pour déconnecter ou reconnecter, ouvrez https://claude.ai/settings/connectors, sélectionnez Norulo et choisissez Disconnect (déconnecter), ou supprimez le connecteur. Reconnectez-vous pour modifier le registre, les projets ou les autorisations accordés.",
          "Para desconectar o volver a conectar, abre https://claude.ai/settings/connectors, selecciona Norulo y elige Disconnect (desconectar), o elimina el conector. Vuelve a conectar para cambiar el libro, los proyectos o los permisos concedidos."
        ),
        copy(
          "To revoke authorization on the Norulo side, sign in to Norulo, open API Keys and revoke the OAuth key created for the Claude connection. Revoking stops its access but does not delete ledger history or recall data already shared in a conversation.",
          "如需在 Norulo 端撤销授权，请登录 Norulo，打开 API Keys，撤销为 Claude 连接创建的 OAuth 密钥。撤销会停止其访问，但不会删除账本历史，也无法收回已在对话中分享的数据。",
          "Norulo 側で認可を取り消すには、Norulo にログインして API Keys を開き、Claude 接続用に作成された OAuth キーを失効させます。失効するとアクセスは止まりますが、帳簿の履歴は削除されず、会話で共有済みのデータも回収されません。",
          "Norulo 측에서 인증을 취소하려면 Norulo에 로그인해 API Keys를 열고 Claude 연결용으로 생성된 OAuth 키를 폐기하세요. 폐기하면 접근이 중단되지만 장부 기록은 삭제되지 않으며 대화에서 이미 공유된 데이터도 회수되지 않습니다.",
          "Pour révoquer l’autorisation côté Norulo, connectez-vous, ouvrez API Keys et révoquez la clé OAuth créée pour la connexion Claude. La révocation coupe l’accès sans supprimer l’historique du registre ni rappeler les données déjà partagées dans une conversation.",
          "Para revocar la autorización en Norulo, inicia sesión, abre API Keys y revoca la clave OAuth creada para la conexión de Claude. Revocarla detiene su acceso, pero no borra el historial del libro ni recupera datos ya compartidos en una conversación."
        ),
        copy(
          "Signing in to another Norulo account in your browser does not switch an existing Claude connection. To use a different account or ledger, disconnect in Claude, then connect again and authorize with the intended account.",
          "在浏览器中登录另一个 Norulo 账户，不会自动切换已有的 Claude 连接。如需使用其他账户或账本，请先在 Claude 中断开连接，再重新连接并使用目标账户授权。",
          "ブラウザーで別の Norulo アカウントにログインしても、既存の Claude 接続は切り替わりません。別のアカウントや帳簿を使うには、Claude で切断してから再接続し、目的のアカウントで認可します。",
          "브라우저에서 다른 Norulo 계정으로 로그인해도 기존 Claude 연결은 바뀌지 않습니다. 다른 계정이나 장부를 사용하려면 Claude에서 연결을 해제한 뒤 다시 연결해 원하는 계정으로 인증하세요.",
          "Se connecter à un autre compte Norulo dans le navigateur ne change pas une connexion Claude existante. Pour utiliser un autre compte ou registre, déconnectez-vous dans Claude, puis reconnectez-vous et autorisez avec le compte voulu.",
          "Iniciar sesión en otra cuenta de Norulo en el navegador no cambia una conexión de Claude existente. Para usar otra cuenta o libro, desconecta en Claude, vuelve a conectar y autoriza con la cuenta deseada."
        ),
      ],
      apiKeysLink,
    },
  ],
  troubleshootingTitle: copy("Troubleshooting", "故障排查", "トラブルシューティング", "문제 해결", "Dépannage", "Solución de problemas"),
  troubleshooting: [
    {
      title: copy("ChatGPT: custom MCP controls unavailable", "ChatGPT：找不到自定义 MCP 选项", "ChatGPT：カスタム MCP の項目がない", "ChatGPT: 사용자 지정 MCP 메뉴가 없음", "ChatGPT : options MCP personnalisées indisponibles", "ChatGPT: no aparecen los controles de MCP personalizado"),
      text: copy(
        "Availability depends on your ChatGPT account, workspace settings and client version. A workspace administrator may need to allow custom connections.",
        "是否可用取决于你的 ChatGPT 账户、工作区设置和客户端版本。可能需要工作区管理员允许自定义连接。",
        "利用可否は ChatGPT アカウント、ワークスペース設定、クライアントのバージョンによって異なります。ワークスペース管理者によるカスタム接続の許可が必要な場合があります。",
        "사용 가능 여부는 ChatGPT 계정, 워크스페이스 설정, 클라이언트 버전에 따라 다릅니다. 워크스페이스 관리자가 사용자 지정 연결을 허용해야 할 수 있습니다.",
        "La disponibilité dépend de votre compte ChatGPT, des paramètres de l’espace de travail et de la version du client. Un administrateur peut devoir autoriser les connexions personnalisées.",
        "La disponibilidad depende de tu cuenta de ChatGPT, la configuración del espacio de trabajo y la versión del cliente. Puede que un administrador deba permitir conexiones personalizadas."
      ),
    },
    {
      title: copy("Claude: “Add custom connector” unavailable", "Claude：找不到“Add custom connector”", "Claude：「Add custom connector」がない", "Claude: “Add custom connector”가 없음", "Claude : « Add custom connector » indisponible", "Claude: no aparece «Add custom connector»"),
      text: copy(
        "On Team and Enterprise plans, only Owners can add custom connectors. Ask an Owner to add Norulo under Organization settings → Connectors, then connect it from your own Connectors settings. Free accounts that already have a custom connector must remove it first.",
        "在 Team 和 Enterprise 套餐中，只有 Owner 能添加自定义连接器。请让 Owner 在 Organization settings → Connectors 中添加 Norulo，然后在你自己的连接器设置中连接。已有一个自定义连接器的 Free 账户需要先移除它。",
        "Team と Enterprise プランでは、カスタムコネクターを追加できるのは Owner だけです。Owner に Organization settings → Connectors で Norulo を追加してもらい、自分のコネクター設定から接続します。すでにカスタムコネクターがある Free アカウントは、先にそれを削除する必要があります。",
        "Team 및 Enterprise 요금제에서는 Owner만 사용자 지정 커넥터를 추가할 수 있습니다. Owner에게 Organization settings → Connectors에서 Norulo를 추가해 달라고 요청한 뒤 자신의 커넥터 설정에서 연결하세요. 이미 사용자 지정 커넥터가 있는 Free 계정은 먼저 그것을 제거해야 합니다.",
        "Avec les offres Team et Enterprise, seuls les Owners peuvent ajouter des connecteurs personnalisés. Demandez à un Owner d’ajouter Norulo dans Organization settings → Connectors, puis connectez-le depuis vos propres paramètres de connecteurs. Un compte Free qui a déjà un connecteur personnalisé doit d’abord le supprimer.",
        "En los planes Team y Enterprise, solo los Owners pueden añadir conectores personalizados. Pide a un Owner que añada Norulo en Organization settings → Connectors y conéctalo desde tu propia configuración de conectores. Una cuenta Free que ya tenga un conector personalizado debe eliminarlo primero."
      ),
    },
    {
      title: copy("Claude cannot connect to Norulo", "Claude 无法连接 Norulo", "Claude が Norulo に接続できない", "Claude가 Norulo에 연결되지 않음", "Claude n’arrive pas à se connecter à Norulo", "Claude no puede conectarse a Norulo"),
      text: copy(
        "Check that the server URL is exactly https://mcp.norulo.com/mcp and that the OAuth Client ID and OAuth Client Secret fields are empty. Remove the connector, add it again and click Connect.",
        "确认服务器 URL 为 https://mcp.norulo.com/mcp，且 OAuth Client ID 和 OAuth Client Secret 字段为空。移除该连接器后重新添加，再点击 Connect。",
        "サーバー URL が https://mcp.norulo.com/mcp と完全に一致し、OAuth Client ID と OAuth Client Secret が空欄であることを確認します。コネクターを削除して追加し直し、Connect をクリックします。",
        "서버 URL이 정확히 https://mcp.norulo.com/mcp인지, OAuth Client ID와 OAuth Client Secret 필드가 비어 있는지 확인하세요. 커넥터를 제거하고 다시 추가한 뒤 Connect를 클릭하세요.",
        "Vérifiez que l’URL du serveur est exactement https://mcp.norulo.com/mcp et que les champs OAuth Client ID et OAuth Client Secret sont vides. Supprimez le connecteur, ajoutez-le à nouveau et cliquez sur Connect.",
        "Comprueba que la URL del servidor sea exactamente https://mcp.norulo.com/mcp y que los campos OAuth Client ID y OAuth Client Secret estén vacíos. Elimina el conector, vuelve a añadirlo y pulsa Connect."
      ),
    },
    {
      title: copy("Authorization expired", "授权已过期", "認可の期限切れ", "인증 만료", "Autorisation expirée", "Autorización caducada"),
      text: copy(
        "Reconnect Norulo from Claude or ChatGPT and authorize again.",
        "在 Claude 或 ChatGPT 中重新连接 Norulo 并再次授权。",
        "Claude または ChatGPT から Norulo を再接続して、もう一度認可します。",
        "Claude 또는 ChatGPT에서 Norulo를 다시 연결하고 다시 인증하세요.",
        "Reconnectez Norulo depuis Claude ou ChatGPT et autorisez à nouveau.",
        "Vuelve a conectar Norulo desde Claude o ChatGPT y autoriza de nuevo."
      ),
    },
    {
      title: copy("Missing projects", "缺少项目", "プロジェクトが表示されない", "프로젝트가 보이지 않음", "Projets manquants", "Faltan proyectos"),
      text: copy(
        "Check the connected account, ledger and selected project access. Reconnect to select additional projects.",
        "检查已连接的账户、账本和所选项目范围。如需更多项目，请重新连接并选择。",
        "接続中のアカウント、帳簿、選択したプロジェクトのアクセス範囲を確認します。追加するには再接続して選択します。",
        "연결된 계정, 장부, 선택한 프로젝트 접근 범위를 확인하세요. 프로젝트를 추가하려면 다시 연결해 선택하세요.",
        "Vérifiez le compte connecté, le registre et l’accès aux projets sélectionnés. Reconnectez-vous pour ajouter des projets.",
        "Comprueba la cuenta conectada, el libro y el acceso a proyectos seleccionado. Vuelve a conectar para añadir proyectos."
      ),
    },
    {
      title: copy("Cannot create or edit records", "无法创建或修改记录", "記録を作成・編集できない", "기록을 만들거나 수정할 수 없음", "Impossible de créer ou modifier", "No se pueden crear ni editar registros"),
      text: copy(
        "Check the granted write permissions and your ledger role. Viewers cannot write, even with write permissions granted.",
        "检查已授予的写入权限和你的账本角色。Viewer 角色即使授予写入权限也无法写入。",
        "付与した書き込み権限と帳簿のロールを確認します。Viewer は書き込み権限を付与しても書き込めません。",
        "부여한 쓰기 권한과 장부 역할을 확인하세요. Viewer는 쓰기 권한을 부여해도 쓸 수 없습니다.",
        "Vérifiez les autorisations d’écriture accordées et votre rôle dans le registre. Un Viewer ne peut pas écrire, même avec ces autorisations.",
        "Comprueba los permisos de escritura concedidos y tu rol en el libro. Un Viewer no puede escribir aunque tenga esos permisos."
      ),
    },
    {
      title: copy("Connection name already exists", "连接名称已存在", "接続名が既に存在する", "연결 이름이 이미 있음", "Nom de connexion déjà utilisé", "El nombre de la conexión ya existe"),
      text: copy(
        "Choose a distinct name for the new connection, or reconnect the existing one instead.",
        "为新连接选择一个不同的名称，或改为重新连接已有连接。",
        "新しい接続に別の名前を付けるか、既存の接続を再接続します。",
        "새 연결에 다른 이름을 지정하거나 기존 연결을 다시 연결하세요.",
        "Choisissez un nom distinct pour la nouvelle connexion, ou reconnectez plutôt la connexion existante.",
        "Elige un nombre distinto para la nueva conexión o vuelve a conectar la existente."
      ),
    },
  ],
  aboutTitle: copy("Before you connect", "连接前须知", "接続前の注意", "연결 전 확인 사항", "Avant de vous connecter", "Antes de conectar"),
  about: [
    copy(
      "You add Norulo yourself as a custom MCP connection: a custom connector in Claude or a custom MCP server in ChatGPT. Creating it does not automatically install separately packaged skills.",
      "Norulo 由你自行作为自定义 MCP 连接添加：在 Claude 中是自定义连接器，在 ChatGPT 中是自定义 MCP 服务器。创建连接不会自动安装单独打包的技能（skills）。",
      "Norulo はカスタム MCP 接続として自分で追加します（Claude ではカスタムコネクター、ChatGPT ではカスタム MCP サーバー）。接続を作成しても、別途パッケージ化されたスキルは自動でインストールされません。",
      "Norulo는 사용자 지정 MCP 연결로 직접 추가합니다(Claude에서는 사용자 지정 커넥터, ChatGPT에서는 사용자 지정 MCP 서버). 연결을 만들어도 별도로 패키징된 스킬은 자동 설치되지 않습니다.",
      "Vous ajoutez vous-même Norulo comme connexion MCP personnalisée : un connecteur personnalisé dans Claude ou un serveur MCP personnalisé dans ChatGPT. Sa création n’installe pas automatiquement les skills distribuées séparément.",
      "Añades Norulo tú mismo como conexión MCP personalizada: un conector personalizado en Claude o un servidor MCP personalizado en ChatGPT. Crearla no instala automáticamente skills empaquetadas por separado."
    ),
    copy(
      "Norulo requires internet access; Claude and ChatGPT reach it at https://mcp.norulo.com/mcp.",
      "Norulo 需要联网使用，Claude 和 ChatGPT 通过 https://mcp.norulo.com/mcp 访问。",
      "Norulo の利用にはインターネット接続が必要です。Claude と ChatGPT は https://mcp.norulo.com/mcp に接続します。",
      "Norulo는 인터넷 연결이 필요하며 Claude와 ChatGPT는 https://mcp.norulo.com/mcp로 접속합니다.",
      "Norulo nécessite un accès à Internet ; Claude et ChatGPT le joignent à l’adresse https://mcp.norulo.com/mcp.",
      "Norulo requiere acceso a internet; Claude y ChatGPT se conectan a https://mcp.norulo.com/mcp."
    ),
    copy(
      "Norulo records bookkeeping entries. It cannot charge cards, pay vendors or cancel external subscriptions.",
      "Norulo 只记录账目，无法扣款、向供应商付款或取消外部订阅。",
      "Norulo は記帳を記録するサービスです。カードへの請求、取引先への支払い、外部サブスクリプションの解約はできません。",
      "Norulo는 장부 항목을 기록합니다. 카드 결제, 거래처 지급, 외부 구독 해지는 할 수 없습니다.",
      "Norulo enregistre des écritures comptables. Il ne peut ni débiter une carte, ni payer des fournisseurs, ni résilier des abonnements externes.",
      "Norulo registra asientos contables. No puede cobrar tarjetas, pagar a proveedores ni cancelar suscripciones externas."
    ),
  ],
  supportTitle: copy("Support", "支持", "サポート", "지원", "Assistance", "Soporte"),
  support: copy(
    "Need help? Email contact@norulo.com with the time, the error message and what you were trying to do.",
    "需要帮助？请发送邮件至 contact@norulo.com，并说明发生时间、错误提示和你要执行的操作。",
    "お困りの場合は contact@norulo.com まで、発生時刻、エラーメッセージ、実行しようとした操作をお知らせください。",
    "도움이 필요하면 contact@norulo.com으로 발생 시간, 오류 메시지, 하려던 작업을 보내 주세요.",
    "Besoin d’aide ? Écrivez à contact@norulo.com en indiquant l’heure, le message d’erreur et ce que vous tentiez de faire.",
    "¿Necesitas ayuda? Escribe a contact@norulo.com indicando la hora, el mensaje de error y lo que intentabas hacer."
  ),
  safetyTitle: copy("Keep credentials private", "保护好凭据", "認証情報を守る", "자격 증명 보호", "Protégez vos identifiants", "Protege tus credenciales"),
  safety: copy(
    "Never send passwords, verification codes, API keys or tokens through an AI chat or support messages. Norulo will never ask for them.",
    "切勿通过 AI 对话或支持邮件发送密码、验证码、API 密钥或令牌。Norulo 绝不会索要这些信息。",
    "パスワード、確認コード、API キー、トークンを AI チャットやサポートへのメッセージで送らないでください。Norulo がそれらを求めることはありません。",
    "비밀번호, 인증 코드, API 키, 토큰을 AI 채팅이나 지원 메시지로 보내지 마세요. Norulo는 이를 요청하지 않습니다.",
    "N’envoyez jamais de mot de passe, code de vérification, clé API ou jeton via une conversation IA ou un message au support. Norulo ne vous les demandera jamais.",
    "Nunca envíes contraseñas, códigos de verificación, claves API ni tokens por un chat de IA o mensajes de soporte. Norulo nunca te los pedirá."
  ),
  landingTitle: copy("Ask about your expenses with AI agents.", "用 AI 智能体查询你的支出。", "AI エージェントで支出について質問。", "AI 에이전트로 지출을 물어보세요.", "Interrogez vos dépenses avec des agents IA.", "Pregunta por tus gastos con agentes de IA."),
  landingText: copy(
    "Connect Norulo to Claude, ChatGPT or another MCP-compatible AI agent with OAuth. Choose the ledger, projects and permissions it can use, then review spending, export records and record expenses through conversation.",
    "通过 OAuth 将 Norulo 连接到 Claude、ChatGPT 或其他兼容 MCP 的 AI 智能体。选择可使用的账本、项目和权限，即可在对话中查看支出、导出记录并记账。",
    "OAuth を使い、Norulo を Claude、ChatGPT、その他の MCP 対応 AI エージェントに接続します。利用できる帳簿、プロジェクト、権限を選べば、会話で支出の確認、記録のエクスポート、記帳ができます。",
    "OAuth로 Norulo를 Claude, ChatGPT 또는 기타 MCP 호환 AI 에이전트에 연결하세요. 사용할 장부, 프로젝트, 권한을 선택하면 대화로 지출을 검토하고 기록을 내보내고 지출을 기록할 수 있습니다.",
    "Connectez Norulo à Claude, à ChatGPT ou à un autre agent IA compatible MCP avec OAuth. Choisissez le registre, les projets et les autorisations, puis consultez vos dépenses, exportez et enregistrez des dépenses par la conversation.",
    "Conecta Norulo a Claude, ChatGPT u otro agente de IA compatible con MCP mediante OAuth. Elige el libro, los proyectos y los permisos, y luego revisa gastos, exporta registros y registra gastos mediante la conversación."
  ),
  landingLink: copy("Set up Norulo in your AI agent", "在你的 AI 智能体中配置 Norulo", "AI エージェントで Norulo を設定", "AI 에이전트에서 Norulo 설정", "Configurer Norulo dans votre agent IA", "Configurar Norulo en tu agente de IA"),
  commandTitle: copy("Command", "命令", "コマンド", "명령", "Commande", "Comando"),
  emailSupport: copy("Email support", "发邮件联系支持", "サポートにメール", "지원팀에 이메일", "Écrire au support", "Escribir a soporte"),
};
