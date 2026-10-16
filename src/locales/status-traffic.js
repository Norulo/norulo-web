// Status page activity copy. Levels are relative to each service's own busiest
// hour in the window; the page never shows request counts.
const copy = (en, zh, ja, ko, fr, es) => [en, { zh, ja, ko, fr, es }];

export const STATUS_TRAFFIC_COPY = {
  title: copy("Service activity", "服务活跃度", "サービスの稼働状況", "서비스 활동", "Activité des services", "Actividad de los servicios"),
  subtitle: copy(
    "How busy each Norulo service has been, hour by hour, over the last 7 days. Shading is relative to each service’s own busiest hour; exact request counts are not published.",
    "过去 7 天各 Norulo 服务每小时的繁忙程度。颜色深浅相对于该服务自身最繁忙的一小时，不公开具体请求数。",
    "過去 7 日間の Norulo 各サービスの 1 時間ごとの混雑度です。濃淡は各サービス自身の最も混んだ時間を基準にしており、正確なリクエスト数は公開しません。",
    "최근 7일 동안 각 Norulo 서비스가 시간대별로 얼마나 바빴는지 보여 줍니다. 색의 진하기는 각 서비스의 가장 바빴던 시간을 기준으로 하며, 정확한 요청 수는 공개하지 않습니다.",
    "Niveau d’activité de chaque service Norulo, heure par heure, sur les 7 derniers jours. L’intensité est relative à l’heure la plus chargée de chaque service ; le nombre exact de requêtes n’est pas publié.",
    "Lo ocupado que ha estado cada servicio de Norulo, hora a hora, en los últimos 7 días. La intensidad es relativa a la hora de más actividad de cada servicio; no se publica el número exacto de solicitudes."
  ),
  services: {
    web: copy("Web app", "Web 应用", "Web アプリ", "웹 앱", "Application web", "Aplicación web"),
    api: copy("API server", "API 服务器", "API サーバー", "API 서버", "Serveur API", "Servidor API"),
    mcp: copy("MCP connector", "MCP 连接器", "MCP コネクター", "MCP 커넥터", "Connecteur MCP", "Conector MCP"),
  },
  serviceHosts: {
    web: "norulo.com",
    api: "api.norulo.com",
    mcp: "mcp.norulo.com",
  },
  levels: [
    copy("Idle", "空闲", "アイドル", "유휴", "Inactif", "Inactivo"),
    copy("Quiet", "清闲", "閑散", "한산", "Calme", "Tranquilo"),
    copy("Moderate", "适中", "普通", "보통", "Modéré", "Moderado"),
    copy("Busy", "繁忙", "混雑", "바쁨", "Chargé", "Ocupado"),
    copy("Peak", "高峰", "ピーク", "최고조", "Pic", "Pico"),
  ],
  lastHour: copy("Last hour", "最近一小时", "直近 1 時間", "최근 1시간", "Dernière heure", "Última hora"),
  usuallyBusiest: copy("Usually busiest around", "通常最繁忙时段约在", "最も混みやすい時間帯", "주로 가장 바쁜 시간", "Généralement plus chargé vers", "Normalmente con más actividad hacia"),
  errorsNone: copy("No Worker errors in 7 days", "7 天内无 Worker 错误", "7 日間 Worker エラーなし", "7일간 Worker 오류 없음", "Aucune erreur Worker en 7 jours", "Sin errores de Worker en 7 días"),
  errorsSome: copy("Hours with Worker errors", "出现 Worker 错误的小时数", "Worker エラーが発生した時間数", "Worker 오류가 발생한 시간 수", "Heures avec erreurs Worker", "Horas con errores de Worker"),
  legendLess: copy("Less", "较少", "少", "적음", "Moins", "Menos"),
  legendMore: copy("More", "较多", "多", "많음", "Plus", "Más"),
  legendSomeErrors: copy("Some errors", "少量错误", "一部エラー", "일부 오류", "Quelques erreurs", "Algunos errores"),
  legendElevatedErrors: copy("Elevated errors", "错误偏多", "エラー多発", "오류 증가", "Erreurs élevées", "Errores elevados"),
  legendCurrent: copy("Current hour (in progress)", "当前小时（进行中）", "現在の時間（集計中）", "현재 시간(진행 중)", "Heure en cours", "Hora actual (en curso)"),
  timesUtc: copy("Times in UTC", "时间为 UTC", "時刻は UTC", "시간은 UTC 기준", "Heures en UTC", "Horas en UTC"),
  heatmapLabel: copy(
    "hourly activity over the last 7 days",
    "过去 7 天每小时活跃度",
    "過去 7 日間の 1 時間ごとの稼働状況",
    "최근 7일간 시간대별 활동",
    "activité horaire sur les 7 derniers jours",
    "actividad por hora en los últimos 7 días"
  ),
  updated: copy("Updated", "更新于", "更新", "업데이트", "Mis à jour", "Actualizado"),
  refreshNote: copy(
    "Activity data is cached and refreshed at most every 10 minutes.",
    "活跃度数据有缓存，最多每 10 分钟更新一次。",
    "稼働データはキャッシュされ、更新は最大で 10 分ごとです。",
    "활동 데이터는 캐시되며 최대 10분마다 갱신됩니다.",
    "Les données d’activité sont mises en cache et actualisées au plus toutes les 10 minutes.",
    "Los datos de actividad se almacenan en caché y se actualizan como máximo cada 10 minutos."
  ),
  loading: copy("Loading activity…", "正在加载活跃度…", "稼働状況を読み込み中…", "활동을 불러오는 중…", "Chargement de l’activité…", "Cargando actividad…"),
  notConfigured: copy(
    "Activity data is not enabled for this deployment yet.",
    "此部署尚未启用活跃度数据。",
    "このデプロイでは稼働データがまだ有効になっていません。",
    "이 배포에서는 아직 활동 데이터가 활성화되지 않았습니다.",
    "Les données d’activité ne sont pas encore activées pour ce déploiement.",
    "Los datos de actividad aún no están activados en este despliegue."
  ),
  unavailable: copy(
    "Activity data is temporarily unavailable. Service checks below are unaffected.",
    "活跃度数据暂时不可用，下方服务检查不受影响。",
    "稼働データは一時的に利用できません。下のサービスチェックには影響ありません。",
    "활동 데이터를 일시적으로 사용할 수 없습니다. 아래 서비스 확인에는 영향이 없습니다.",
    "Les données d’activité sont temporairement indisponibles. Les vérifications ci-dessous ne sont pas affectées.",
    "Los datos de actividad no están disponibles temporalmente. Las comprobaciones de servicio no se ven afectadas."
  ),
  checksTitle: copy("Service checks", "服务检查", "サービスチェック", "서비스 확인", "Vérifications des services", "Comprobaciones de servicio"),
  checksNote: copy("Checked by Norulo’s edge, not by your browser", "由 Norulo 边缘节点检查，而非你的浏览器", "ブラウザーではなく Norulo のエッジで確認", "브라우저가 아닌 Norulo 엣지에서 확인", "Vérifié par la périphérie Norulo, pas par votre navigateur", "Comprobado desde el borde de Norulo, no desde tu navegador"),
  mcpReachable: copy("Reachable", "可访问", "到達可能", "접속 가능", "Accessible", "Accesible"),
  mcpUnreachable: copy("Unreachable", "不可访问", "到達不可", "접속 불가", "Inaccessible", "No accesible"),
  notChecked: copy("Not checked", "未检查", "未確認", "확인 안 됨", "Non vérifié", "No comprobado"),
  scheduler: copy("Daily recurring expenses run", "每日周期支出任务", "毎日の定期支出処理", "일일 반복 지출 실행", "Exécution quotidienne des dépenses récurrentes", "Ejecución diaria de gastos recurrentes"),
  schedulerSuccess: copy("Last run completed", "上次运行已完成", "前回の実行は完了", "마지막 실행 완료", "Dernière exécution terminée", "Última ejecución completada"),
  schedulerFailure: copy("Last run reported an error", "上次运行报告错误", "前回の実行でエラー", "마지막 실행에서 오류 보고", "La dernière exécution a signalé une erreur", "La última ejecución informó de un error"),
  schedulerUnknown: copy("No run in the last 3 days", "最近 3 天无运行记录", "直近 3 日間の実行なし", "최근 3일간 실행 없음", "Aucune exécution ces 3 derniers jours", "Sin ejecuciones en los últimos 3 días"),
  schedulerDetail: copy("Scheduled daily at 16:10 UTC", "每天 16:10 UTC 运行", "毎日 16:10 UTC に実行", "매일 16:10 UTC 실행", "Planifiée chaque jour à 16:10 UTC", "Programada a diario a las 16:10 UTC"),
};
