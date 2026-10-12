import { T } from "../i18n.jsx";

// Locally authored, translated guidance may be displayed as-is. Untrusted
// Server messages remain available on ApiError for diagnostics, not UI copy.
export class UserFacingError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function gitHubManageErrorText(code) {
  switch (code) {
    case "github_account_mismatch":
      return T("GitHub account mismatch. Choose a GitHub account with access to this installation, then try again.", "GitHub 账户不匹配，请选择有权访问此安装的 GitHub 账户后重试。");
    case "github_installation_not_visible":
      return T("This GitHub account cannot access that installation. Choose the right GitHub account or an organization admin account.", "此 GitHub 账户无法访问该安装，请选择正确的 GitHub 账户或组织管理员账户。");
    case "github_org_admin_required":
      return T("Use a GitHub organization owner or admin account to manage this installation.", "请使用 GitHub 组织所有者或管理员账户管理此安装。");
    case "github_identity_reauth_required":
      return T("Reconnect this GitHub account before managing the installation.", "请先重新连接此 GitHub 账户，再管理安装。");
    case "github_installation_deleted":
      return T("This GitHub App installation is no longer available. Reinstall it or remove it from Norulo.", "此 GitHub App 安装已不可用，请重新安装或从 Norulo 中移除。");
    case "github_app_installation_not_completed":
      return T("GitHub installation was not completed. Open the installation flow again to continue.", "GitHub 安装尚未完成，请重新打开安装流程以继续。");
    default:
      return "";
  }
}

export function requestErrorText(error, fallback) {
  if (error instanceof UserFacingError) return error.message;
  const code = error?.code || error?.payload?.error?.code || error?.payload?.code;
  const githubMessage = gitHubManageErrorText(code);
  if (githubMessage) return githubMessage;
  if (code === "GITHUB_REAUTHORIZATION_REQUIRED")
    return T("Reconnect your GitHub account before checking repository access.", "请先重新连接你的 GitHub 账户，再检查仓库访问权限。");
  if (code === "GITHUB_IDENTITY_REQUIRED")
    return T("Connect your GitHub account in Sign-in methods before authorizing repositories.", "请先在登录方式中连接你的 GitHub 账户，再授权仓库。");
  if (code === "D1_ACCESS_PAUSED")
    return T("Service is temporarily paused. Please try again later.", "服务暂时暂停，请稍后重试。");
  if (code === "REQUEST_TOO_LARGE" || error?.status === 413)
    return T("The request is too large. Reduce its size and try again.", "请求内容过大，请减少内容后重试。");
  if (code === "UNTRUSTED_ORIGIN")
    return T("This request could not be verified. Reload the page and try again.", "无法验证此请求，请重新加载页面后重试。");
  if (["UNAUTHENTICATED"].includes(code) || error?.status === 401)
    return T("Your session has expired. Please sign in again.", "会话已过期，请重新登录。");
  if (code === "INVALID_INPUT" || [400, 422].includes(error?.status))
    return T("Check the information and try again.", "请检查填写的信息后重试。");
  if (["PRECONDITION_REQUIRED", "PRECONDITION_FAILED", "QUOTA_WINDOW_CHANGED"].includes(code) ||
      [409, 412, 428].includes(error?.status))
    return T("The data or access changed. Reload before trying again.", "数据或权限已发生变化，请重新加载后再试。");
  if (error?.status === 403)
    return T("You do not have permission for this action. Reload access and try again.", "你没有执行此操作的权限，请重新加载权限后再试。");
  if (error?.status === 429)
    return T("Too many requests. Please wait and try again.", "请求过于频繁，请稍等后重试。");
  if (code === "SERVER_UNAVAILABLE" || error?.status >= 500)
    return T("The service is temporarily unavailable. Please try again later.", "服务暂时不可用，请稍后重试。");
  if (error?.name === "TimeoutError" || /\btimeout\b|timed out/i.test(error?.message || ""))
    return T("The request timed out. Check the latest data before trying again.", "请求超时，请确认最新数据后再试。");
  if (/failed to fetch|fetch failed|network ?error|network request failed|load failed/i.test(error?.message || ""))
    return T("Cannot connect to the service. Check your connection and try again.", "无法连接到服务，请检查网络连接后重试。");
  return fallback || T("Unable to complete the request. Please try again.", "无法完成请求，请重试。");
}
