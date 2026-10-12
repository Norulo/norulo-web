import { Component } from "react";
import { T, useLang } from "../i18n.jsx";

const reloadApplication = () => window.location.reload();

function chunkLoadFailure(error) {
  return error?.name === "ChunkLoadError" ||
    /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk .+ failed|unable to preload css/i.test(
      typeof error?.message === "string" ? error.message : "",
    );
}

function ErrorFallback({ chunkFailure, fullPage, onReload }) {
  useLang();
  return (
    <main id="main-content" tabIndex={-1} className={fullPage ? "app-startup" : "auth-wrap"}>
      <section className="empty" role="alert">
        <h3>{T("Unable to display this screen", {
          zh: "无法显示此页面",
          ja: "この画面を表示できません",
          ko: "이 화면을 표시할 수 없습니다",
          fr: "Impossible d’afficher cette page",
          es: "No se puede mostrar esta pantalla",
        })}</h3>
        <p>{chunkFailure
          ? T("Check your connection, then reload Norulo to load the current version.", {
              zh: "请检查网络连接，然后重新加载 Norulo 以获取当前版本。",
              ja: "接続を確認してから Norulo を再読み込みし、現在のバージョンを読み込んでください。",
              ko: "연결을 확인한 후 Norulo를 새로고침하여 현재 버전을 불러오세요.",
              fr: "Vérifiez votre connexion, puis rechargez Norulo pour charger la version actuelle.",
              es: "Comprueba tu conexión y vuelve a cargar Norulo para obtener la versión actual.",
            })
          : T("Reload Norulo to try again.", {
              zh: "请重新加载 Norulo 后再试。",
              ja: "Norulo を再読み込みして、もう一度お試しください。",
              ko: "Norulo를 새로고침한 후 다시 시도하세요.",
              fr: "Rechargez Norulo pour réessayer.",
              es: "Vuelve a cargar Norulo para intentarlo de nuevo.",
            })}</p>
        <p>{T("Unsaved changes may be lost.", {
          zh: "尚未保存的更改可能会丢失。",
          ja: "保存していない変更が失われる場合があります。",
          ko: "저장하지 않은 변경 사항이 손실될 수 있습니다.",
          fr: "Les modifications non enregistrées peuvent être perdues.",
          es: "Los cambios sin guardar pueden perderse.",
        })}</p>
        <button className="btn primary" type="button" onClick={onReload}>
          {T("Reload Norulo", {
            zh: "重新加载 Norulo",
            ja: "Norulo を再読み込み",
            ko: "Norulo 새로고침",
            fr: "Recharger Norulo",
            es: "Volver a cargar Norulo",
          })}
        </button>
      </section>
    </main>
  );
}

// Route/scope keys must remount screen boundaries. Recovery never retries a
// business operation or automatically reloads an active tab with unsaved work.
export class ErrorBoundary extends Component {
  state = { failed: false, chunkFailure: false };

  static getDerivedStateFromError(error) {
    return { failed: true, chunkFailure: chunkLoadFailure(error) };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <ErrorFallback
      chunkFailure={this.state.chunkFailure}
      fullPage={this.props.fullPage}
      onReload={this.props.onReload || reloadApplication}
    />;
  }
}
