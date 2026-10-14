// The same onboarding journey appears prominently in Docs and the API page.
const copy = (en, zh, ja, ko, fr, es) => [en, { zh, ja, ko, fr, es }];

export const AGENT_GUIDE = {
  title: copy("Set up expenses with a Coding Agent", "用 Coding Agent 配置并添加支出", "Coding Agent で支出を設定・追加", "Coding Agent로 지출 설정 및 추가", "Configurer les dépenses avec un Coding Agent", "Configurar gastos con un Coding Agent"),
  intro: copy(
    "Give your Coding Agent the API guide and your costs. It can build out an empty ledger, organize projects and categories, and record expenses through the REST API.",
    "把 API 说明和支出资料交给 Coding Agent，让它通过 REST API 从空账本开始，整理项目与类别，再添加支出。",
    "API ガイドと費用の資料を Coding Agent に渡します。REST API で空の帳簿にプロジェクトとカテゴリーを整え、支出を記録できます。",
    "API 안내와 비용 자료를 Coding Agent에 전달하세요. REST API로 빈 장부에 프로젝트와 카테고리를 구성하고 지출을 기록할 수 있습니다.",
    "Transmettez le guide API et vos coûts à votre Coding Agent. Il peut organiser les projets et catégories d’un registre vide, puis enregistrer les dépenses via l’API REST.",
    "Entrega la guía API y tus costes al Coding Agent. Puede organizar proyectos y categorías en un libro vacío y registrar gastos mediante la API REST."
  ),
  steps: [
    {
      title: copy("Copy the API guide", "复制 API 说明", "API ガイドをコピー", "API 안내 복사", "Copier le guide API", "Copiar la guía API"),
      text: copy("Open the API page, click Copy for Agent, then paste it into your Coding Agent’s conversation.", "打开 API 页面，点击 Copy for Agent（复制给 Agent），再把内容发给 Coding Agent。", "API ページで Copy for Agent をクリックし、Coding Agent の会話に貼り付けます。", "API 페이지에서 Copy for Agent를 클릭하고 Coding Agent 대화에 붙여 넣으세요.", "Ouvrez la page API, cliquez sur Copy for Agent, puis collez le contenu dans la conversation de votre Coding Agent.", "Abre la página API, pulsa Copy for Agent y pega el contenido en la conversación del Coding Agent."),
      href: "/developers/api#overview",
      label: copy("Open API · Copy for Agent", "打开 API · Copy for Agent", "API を開く · Copy for Agent", "API 열기 · Copy for Agent", "Ouvrir l’API · Copy for Agent", "Abrir API · Copy for Agent"),
    },
    {
      title: copy("Create an API key", "创建 API Key", "API キーを作成", "API 키 생성", "Créer une clé API", "Crear una clave API"),
      text: copy(
        "Sign in and select the intended ledger in API Keys. Enable profile:read, projects:read, categories:read, expenses:read, expenses:write and reports:read. To create projects or categories, an Owner or Admin also needs projects:write and categories:write. Choose project restrictions and explicitly allow the shared pool when needed; setting up new projects needs all-project access. The token is shown once.",
        "登录后，在 API Keys 选择目标账本。启用 profile:read、projects:read、categories:read、expenses:read、expenses:write 和 reports:read。需要创建项目或类别时，Owner 或 Admin 还需 projects:write 和 categories:write。按需限制项目，并单独允许公共池访问；初始化新项目需允许全部项目。密钥只显示一次。",
        "ログイン後、API Keys で対象の帳簿を選びます。profile:read、projects:read、categories:read、expenses:read、expenses:write、reports:read を有効にします。プロジェクトやカテゴリーの作成には Owner または Admin と projects:write、categories:write も必要です。プロジェクトを制限し、必要なら共有プールを明示的に許可します。新規プロジェクトの設定には全プロジェクトへのアクセスが必要です。キーは一度だけ表示されます。",
        "로그인 후 API Keys에서 대상 장부를 선택하세요. profile:read, projects:read, categories:read, expenses:read, expenses:write, reports:read를 활성화하세요. 프로젝트나 카테고리를 만들려면 Owner 또는 Admin 역할과 projects:write, categories:write도 필요합니다. 프로젝트 제한을 선택하고 필요하면 공유 풀을 별도로 허용하세요. 새 프로젝트 설정에는 전체 프로젝트 접근이 필요합니다. 키는 한 번만 표시됩니다.",
        "Connectez-vous et sélectionnez le registre dans API Keys. Activez profile:read, projects:read, categories:read, expenses:read, expenses:write et reports:read. Pour créer projets ou catégories, un Owner ou Admin doit aussi disposer de projects:write et categories:write. Choisissez les restrictions de projets et autorisez explicitement le fonds partagé si nécessaire ; créer de nouveaux projets exige l’accès à tous les projets. Le jeton n’est affiché qu’une fois.",
        "Inicia sesión y selecciona el libro en API Keys. Activa profile:read, projects:read, categories:read, expenses:read, expenses:write y reports:read. Para crear proyectos o categorías, un Owner o Admin también necesita projects:write y categories:write. Elige las restricciones de proyectos y permite el fondo compartido cuando sea necesario; crear proyectos requiere acceso a todos los proyectos. El token se muestra una sola vez."
      ),
      href: "/api-keys",
      label: copy("Create API key", "去创建 API Key", "API キーを作成する", "API 키 만들기", "Créer une clé API", "Crear clave API"),
    },
    {
      title: copy("Store the key securely", "安全配置环境变量", "キーを安全に設定", "키를 안전하게 설정", "Stocker la clé en sécurité", "Guardar la clave de forma segura"),
      text: copy(
        "Set NORULO_API_KEY in the agent’s secure environment or secret manager, and NORULO_API_BASE to https://api.norulo.com. A local .env must be excluded from Git and explicitly loaded by the agent’s runtime. Tell the agent the variable names, never paste the key into chat, source code, browser variables or logs. The Bash example below reads it without echoing or putting it in shell history; the agent must inherit that environment.",
        "在 Agent 的安全环境或密钥管理器中配置 NORULO_API_KEY，并把 NORULO_API_BASE 设为 https://api.norulo.com。使用本地 .env 时须加入 Git 忽略，并由 Agent 运行环境显式加载。只告诉 Agent 变量名，不要把密钥发到聊天、写入代码、前端变量或日志。下方 Bash 示例隐藏输入且不把密钥写入命令历史；Agent 必须继承该环境。",
        "Agent の安全な環境またはシークレット管理で NORULO_API_KEY を設定し、NORULO_API_BASE を https://api.norulo.com にします。ローカル .env は Git 対象外にし、実行環境で明示的に読み込みます。Agent には変数名だけを伝え、キーを会話、コード、ブラウザー変数、ログに含めません。下の Bash 例は非表示で入力し履歴にも残しません。Agent はその環境を継承する必要があります。",
        "Agent의 보안 환경이나 비밀 관리 도구에 NORULO_API_KEY를 설정하고 NORULO_API_BASE를 https://api.norulo.com으로 지정하세요. 로컬 .env는 Git에서 제외하고 런타임에서 명시적으로 로드해야 합니다. Agent에는 변수 이름만 알려주고 키를 대화, 코드, 브라우저 변수 또는 로그에 넣지 마세요. 아래 Bash 예시는 입력을 숨기고 기록에 키를 남기지 않습니다. Agent가 해당 환경을 상속해야 합니다.",
        "Définissez NORULO_API_KEY dans l’environnement sécurisé ou le gestionnaire de secrets de l’agent, et NORULO_API_BASE sur https://api.norulo.com. Excluez tout .env local de Git et chargez-le explicitement dans le runtime. Communiquez uniquement les noms de variables, jamais la clé dans le chat, le code, les variables navigateur ou les logs. L’exemple Bash masque la saisie et ne laisse pas la clé dans l’historique ; l’agent doit hériter de cet environnement.",
        "Configura NORULO_API_KEY en el entorno seguro o gestor de secretos del agente y NORULO_API_BASE como https://api.norulo.com. Excluye cualquier .env local de Git y cárgalo explícitamente en el entorno de ejecución. Comunica solo los nombres de las variables; no pegues la clave en el chat, código, variables del navegador o registros. El ejemplo Bash oculta la entrada y no guarda la clave en el historial; el agente debe heredar ese entorno."
      ),
    },
    {
      title: copy("Give the agent your expenses", "把支出资料交给 Agent", "支出資料を Agent に渡す", "Agent에 지출 자료 전달", "Transmettre les dépenses à l’agent", "Entregar los gastos al agente"),
      text: copy(
        "Ask it to read the copied API guide, inspect the ledger, reuse or create the needed projects and categories, then add your expenses. Include dates, amounts, currencies and purposes. If the agent’s model supports images or PDFs, attach receipts and invoices too. The agent extracts structured fields; the REST API accepts JSON, with no receipt-upload endpoint. Confirm unclear fields before saving. Use the prompt below to get started.",
        "让它先阅读已复制的 API 说明、检查现有账本，复用或创建所需项目和类别，再添加支出。提供日期、金额、币种和用途；如果 Agent 的模型支持图片或 PDF，也可一并发送收据、发票。Agent 负责提取结构化字段，REST API 接收 JSON，目前没有票据上传接口。含糊字段应在保存前确认。可直接使用下方示例指令。",
        "コピーした API ガイドを読み、帳簿を確認し、必要なプロジェクトとカテゴリーを再利用または作成して支出を追加するよう依頼します。日付、金額、通貨、用途を渡し、モデルが画像・PDF に対応していれば領収書や請求書も添付できます。Agent が項目を抽出し、REST API は JSON を受け取ります。領収書アップロード API はありません。不明な項目は保存前に確認します。下の指示例を使えます。",
        "복사한 API 안내를 읽고 기존 장부를 확인한 뒤 필요한 프로젝트와 카테고리를 재사용하거나 만들어 지출을 추가하도록 요청하세요. 날짜, 금액, 통화, 용도를 제공하고 모델이 이미지나 PDF를 지원하면 영수증과 청구서도 첨부할 수 있습니다. Agent가 구조화된 필드를 추출하며 REST API는 JSON을 받습니다. 영수증 업로드 엔드포인트는 없습니다. 불명확한 필드는 저장 전에 확인하세요. 아래 요청 예시를 사용할 수 있습니다.",
        "Demandez-lui de lire le guide copié, d’inspecter le registre, de réutiliser ou créer les projets et catégories nécessaires, puis d’ajouter les dépenses. Précisez dates, montants, devises et objets. Si le modèle accepte images ou PDF, joignez reçus et factures. L’agent extrait les champs structurés ; l’API REST reçoit du JSON et n’a pas d’endpoint de dépôt de reçus. Faites confirmer les champs ambigus avant l’enregistrement. Utilisez l’exemple ci-dessous.",
        "Pídele que lea la guía copiada, revise el libro, reutilice o cree los proyectos y categorías necesarios y añada tus gastos. Incluye fechas, importes, monedas y conceptos. Si el modelo admite imágenes o PDF, adjunta recibos y facturas. El agente extrae campos estructurados; la API REST recibe JSON y no ofrece subida de recibos. Confirma los campos dudosos antes de guardar. Usa la instrucción de ejemplo."
      ),
    },
    {
      title: copy("Check the saved ledger", "核对保存结果", "保存結果を確認", "저장 결과 확인", "Vérifier le registre enregistré", "Comprobar el libro guardado"),
      text: copy(
        "Have the agent read back each saved expense and report its ID, project or shared target, category, date and amount. Verify totals separately by currency in Overview. Add recurring schedules only when requested; recording a cost does not pay an invoice or renew a subscription.",
        "让 Agent 回读每笔已保存支出，汇报 ID、项目或公共池归属、类别、日期和金额，再到总览按币种核对汇总。只有明确需要时才添加周期计划；记账不会付款或续订外部服务。",
        "Agent に保存済み支出を再取得させ、ID、プロジェクトまたは共有先、カテゴリー、日付、金額を報告させます。概要で通貨別の合計を確認します。定期予定は依頼された場合だけ追加します。記録しても支払いや外部契約の更新は行いません。",
        "Agent가 저장된 지출을 다시 읽고 ID, 프로젝트 또는 공유 대상, 카테고리, 날짜, 금액을 보고하게 하세요. 개요에서 통화별 합계를 확인하세요. 반복 일정은 요청한 경우에만 추가합니다. 비용 기록은 청구서 결제나 외부 구독 갱신을 수행하지 않습니다.",
        "Faites relire chaque dépense enregistrée et demandez son ID, projet ou fonds partagé, catégorie, date et montant. Vérifiez les totaux par devise dans Vue d’ensemble. Ajoutez des échéanciers uniquement sur demande ; enregistrer un coût ne paie pas de facture et ne renouvelle pas d’abonnement.",
        "Haz que el agente vuelva a leer cada gasto guardado y comunique su ID, proyecto o fondo compartido, categoría, fecha e importe. Comprueba los totales por moneda en Resumen. Añade programaciones recurrentes solo si se solicitan; registrar un coste no paga facturas ni renueva suscripciones."
      ),
      href: "/overview",
      label: copy("Review expense totals", "查看支出汇总", "支出合計を確認", "지출 합계 확인", "Vérifier les totaux", "Revisar totales de gastos"),
    },
  ],
  modelTitle: copy("How the ledger fits together", "账本里的概念如何关联", "帳簿の概念と関係", "장부 개념의 관계", "Les relations dans le registre", "Cómo se relaciona el libro"),
  model: copy(
    "A ledger belongs to an Owner and contains projects, one shared pool and ledger-wide categories. Each expense belongs to exactly one project or the shared pool, and uses one category. Projects answer which product incurred the cost; categories describe what the cost was for, such as Hosting or Software. Shared costs, such as tools used by several projects, count once in ledger totals and are not split or copied across projects. GitHub links are optional. Start by reusing existing projects and categories; create only what is missing.",
    "账本属于一位 Owner，包含多个项目、一个公共池，以及全账本通用的类别。每笔支出只归属于一个项目或公共池，并使用一个类别。项目回答“哪个产品产生了成本”，类别回答“花在什么上”，如托管、软件。多个项目共用的工具等成本放入公共池，账本汇总只计一次，不会自动分摊或复制到项目。GitHub 关联可选。先复用已有项目与类别，只创建缺少的部分。",
    "帳簿は Owner に属し、プロジェクト、1 つの共有プール、帳簿共通のカテゴリーを含みます。支出は必ず 1 つのプロジェクトまたは共有プールに属し、1 つのカテゴリーを使います。プロジェクトはどの製品の費用か、カテゴリーは何の費用か（ホスティング、ソフトウェアなど）を示します。複数のプロジェクトで使うツールなどの共有費用は帳簿で一度だけ集計され、分配・複製されません。GitHub 連携は任意です。既存のものを再利用し、不足分だけ作成します。",
    "장부는 Owner에 속하며 여러 프로젝트, 하나의 공유 풀, 장부 공통 카테고리를 포함합니다. 각 지출은 정확히 하나의 프로젝트 또는 공유 풀에 속하고 하나의 카테고리를 사용합니다. 프로젝트는 어느 제품의 비용인지, 카테고리는 호스팅이나 소프트웨어처럼 어떤 비용인지를 나타냅니다. 여러 프로젝트가 사용하는 도구는 공유 풀에 기록하며 장부 합계에 한 번만 포함되고 프로젝트에 배분·복제되지 않습니다. GitHub 연결은 선택 사항입니다. 기존 프로젝트와 카테고리를 재사용하고 부족한 것만 만드세요.",
    "Un registre appartient à un Owner et contient des projets, un fonds partagé et des catégories communes. Chaque dépense appartient à un seul projet ou au fonds partagé et utilise une catégorie. Le projet indique quel produit engendre le coût ; la catégorie en décrit la nature, par exemple Hébergement ou Logiciels. Les outils communs à plusieurs projets sont comptés une fois, sans répartition ni copie entre projets. GitHub est facultatif. Réutilisez l’existant et créez seulement ce qui manque.",
    "Un libro pertenece a un Owner y contiene proyectos, un fondo compartido y categorías comunes. Cada gasto pertenece a un único proyecto o al fondo compartido y usa una categoría. El proyecto indica qué producto genera el coste; la categoría describe su naturaleza, como Alojamiento o Software. Las herramientas comunes se cuentan una vez, sin repartirse ni copiarse entre proyectos. GitHub es opcional. Reutiliza lo existente y crea solo lo que falte."
  ),
  promptTitle: copy("A prompt to send your agent", "发给 Agent 的示例指令", "Agent に送る指示例", "Agent에 보낼 요청 예시", "Une consigne pour votre agent", "Una instrucción para tu agente"),
  prompt: copy(
    "Read the Norulo API guide I pasted. Use NORULO_API_BASE and NORULO_API_KEY from your secure environment without displaying the key. Inspect my ledger and reuse existing projects and categories; create missing ones within your permissions. Organize the expenses I provide by project or shared pool, with category, date, exact amount, currency and purpose. If you can read my receipt images or PDFs, extract those fields. Ask me about unclear values before saving. Add the confirmed expenses via REST with a separate idempotency key for each, then read them back and report IDs and totals by currency. Create recurring schedules only if I request them.",
    "请阅读我发来的 Norulo API 说明，从安全环境读取 NORULO_API_BASE 和 NORULO_API_KEY，不要显示密钥。先检查账本，复用已有项目与类别，按权限创建缺少的部分。把我提供的支出整理到项目或公共池，填写类别、日期、准确金额、币种和用途。如能读取我发来的收据图片或 PDF，请提取这些字段；不明确的信息先向我确认。用 REST API 添加已确认支出，每笔使用独立幂等键，再回读核对并汇报支出 ID 和逐币汇总。只有我提出需要时才创建周期计划。",
    "送った Norulo API ガイドを読んでください。安全な環境の NORULO_API_BASE と NORULO_API_KEY を使い、キーは表示しないでください。帳簿を確認し、既存のプロジェクトとカテゴリーを再利用して権限内で不足分を作成してください。支出をプロジェクトまたは共有プールに整理し、カテゴリー、日付、正確な金額、通貨、用途を記入してください。領収書画像や PDF を読める場合は項目を抽出し、不明な値は保存前に確認してください。確認済み支出ごとに別の冪等キーで REST API に保存し、再取得して ID と通貨別合計を報告してください。定期予定は依頼した場合だけ作成してください。",
    "전달한 Norulo API 안내를 읽으세요. 보안 환경의 NORULO_API_BASE와 NORULO_API_KEY를 사용하되 키는 표시하지 마세요. 장부를 확인하고 기존 프로젝트와 카테고리를 재사용하며 권한 안에서 부족한 것만 만드세요. 지출을 프로젝트 또는 공유 풀로 정리하고 카테고리, 날짜, 정확한 금액, 통화, 용도를 입력하세요. 영수증 이미지나 PDF를 읽을 수 있다면 필드를 추출하고 불명확한 값은 저장 전에 확인하세요. 확인된 지출마다 별도 멱등 키로 REST API에 저장한 뒤 다시 읽어 ID와 통화별 합계를 보고하세요. 반복 일정은 요청한 경우에만 만드세요.",
    "Lisez le guide API Norulo que j’ai transmis. Utilisez NORULO_API_BASE et NORULO_API_KEY depuis votre environnement sécurisé sans afficher la clé. Inspectez le registre, réutilisez projets et catégories existants et créez les éléments manquants selon vos droits. Classez mes dépenses par projet ou fonds partagé avec catégorie, date, montant exact, devise et objet. Si vous pouvez lire mes reçus en image ou PDF, extrayez ces champs. Faites confirmer les valeurs ambiguës avant l’enregistrement. Ajoutez chaque dépense confirmée via REST avec sa propre clé d’idempotence, relisez-les et rapportez les ID et totaux par devise. Ne créez d’échéanciers récurrents que sur ma demande.",
    "Lee la guía API de Norulo que he pegado. Usa NORULO_API_BASE y NORULO_API_KEY desde tu entorno seguro sin mostrar la clave. Revisa el libro, reutiliza proyectos y categorías existentes y crea lo que falte según tus permisos. Organiza mis gastos por proyecto o fondo compartido con categoría, fecha, importe exacto, moneda y concepto. Si puedes leer recibos en imagen o PDF, extrae esos campos. Confirma los valores dudosos antes de guardar. Añade cada gasto confirmado por REST con su propia clave de idempotencia, vuelve a leerlos e informa de los ID y totales por moneda. Crea programaciones recurrentes solo si lo solicito."
  ),
  landingTitle: copy("Let your Coding Agent organize expenses.", "让 Coding Agent 帮你配置支出。", "Coding Agent で支出を整理。", "Coding Agent로 지출을 정리하세요.", "Confiez vos dépenses à votre Coding Agent.", "Deja que tu Coding Agent organice los gastos."),
  landingText: copy("Copy the API guide, set a secure API key, then send your costs or supported receipt images and PDFs. Your agent can set up projects, categories and expense records.", "复制 API 说明、安全配置 API Key，再发送支出资料或模型支持的票据图片、PDF，让 Agent 整理项目、类别并添加支出。", "API ガイドをコピーし、API キーを安全に設定して費用や対応する領収書画像・PDF を渡せば、Agent がプロジェクト、カテゴリー、支出を設定できます。", "API 안내를 복사하고 API 키를 안전하게 설정한 뒤 비용 자료나 지원되는 영수증 이미지·PDF를 전달하세요. Agent가 프로젝트, 카테고리, 지출을 설정할 수 있습니다.", "Copiez le guide API, configurez une clé sécurisée et transmettez vos coûts ou reçus en image et PDF pris en charge. L’agent peut organiser projets, catégories et dépenses.", "Copia la guía API, configura una clave segura y envía tus costes o recibos en imagen y PDF compatibles. El agente puede organizar proyectos, categorías y gastos."),
  startLink: copy("Follow the Agent setup guide", "查看 Agent 配置教程", "Agent 設定ガイドを見る", "Agent 설정 안내 보기", "Suivre le guide de configuration Agent", "Ver la guía de configuración Agent"),
};
