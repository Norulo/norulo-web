import { T, useLang } from "../i18n.jsx";
import { I } from "../icons.jsx";

const COPY = {
  label: ["Last operation source", { zh: "最后操作来源", ja: "最後の操作元", ko: "마지막 작업 출처", fr: "Origine de la dernière opération", es: "Origen de la última operación" }],
  owner: ["Owner", { zh: "Owner", ja: "所有者", ko: "소유자", fr: "Propriétaire", es: "Propietario" }],
  member: ["Shared member", { zh: "共享成员", ja: "共有メンバー", ko: "공유 구성원", fr: "Membre du registre", es: "Miembro del libro" }],
  create: ["Created", { zh: "创建", ja: "作成", ko: "생성", fr: "Création", es: "Creación" }],
  update: ["Updated", { zh: "修改", ja: "更新", ko: "수정", fr: "Modification", es: "Modificación" }],
  recurring: ["Created by recurring schedule", { zh: "周期计划自动创建", ja: "定期スケジュールで自動作成", ko: "반복 일정으로 자동 생성", fr: "Créé par un échéancier", es: "Creado por un plan recurrente" }],
  unknown: ["Source unknown", { zh: "来源未知", ja: "操作元不明", ko: "출처 알 수 없음", fr: "Origine inconnue", es: "Origen desconocido" }],
};
const text = (key) => T(...COPY[key]);

export function ExpenseSourceTag({ source }) {
  useLang();
  let label = text("unknown");
  let Glyph = I.Clock;
  if (source?.kind === "recurring" && source.action === "create") {
    label = text("recurring");
    Glyph = I.Refresh;
  } else if (["owner", "member"].includes(source?.kind) &&
      ["create", "update"].includes(source?.action) && typeof source.userId === "string" && source.userId) {
    const name = [source.name, source.githubLogin, source.userId]
      .find((value) => typeof value === "string" && value.trim());
    label = `${text(source.kind)} · ${name} · ${text(source.action)}`;
    Glyph = source.via === "api_key" ? I.Terminal : I.User;
    if (source.via === "api_key") label += ` · ${T("API key")}`;
  }
  // Quiet provenance footnote: muted body text with a small glyph, not a chip,
  // so it never competes with the purpose, date or amount.
  return (
    <span className="ledger-expense-source" aria-label={`${text("label")}: ${label}`}>
      <Glyph size={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
