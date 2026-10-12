import { afterEach, describe, expect, it } from "vitest";
import { setLang } from "../i18n.jsx";
import { ApiError } from "../api/http.js";
import { requestErrorText, UserFacingError } from "./request-error.js";

afterEach(async () => { await setLang("en"); });

describe("request error copy", () => {
  it.each([
    ["D1_ACCESS_PAUSED", 503, "Service is temporarily paused"],
    ["INVALID_INPUT", 422, "Check the information"],
    ["PRECONDITION_REQUIRED", 428, "Reload before trying again"],
    ["SERVER_UNAVAILABLE", 503, "temporarily unavailable"],
    ["REQUEST_TOO_LARGE", 413, "request is too large"],
    ["QUOTA_WINDOW_CHANGED", 409, "Reload before trying again"],
    ["UNTRUSTED_ORIGIN", 403, "could not be verified"],
    ["UNAUTHENTICATED", 401, "Please sign in again"],
  ])("turns %s into actionable UI copy", (code, status, expected) => {
    const failure = new ApiError("Raw server detail", { status, payload: { error: { code } } });
    expect(requestErrorText(failure)).toContain(expected);
    expect(requestErrorText(failure)).not.toContain(code);
  });

  it("keeps untrusted details out of UI while preserving locally authored guidance", () => {
    const raw = new ApiError("INTERNAL_DIAGNOSTIC", { status: 418 });
    expect(requestErrorText(raw, "Action unavailable")).toBe("Action unavailable");
    expect(requestErrorText(new UserFacingError("Choose projects again."))).toBe("Choose projects again.");
  });

  it("localizes native transport failures and bare status responses", async () => {
    await setLang("zh");
    expect(requestErrorText(new TypeError("Failed to fetch"))).toBe("无法连接到服务，请检查网络连接后重试。");
    expect(requestErrorText(new DOMException("The operation was aborted due to timeout", "TimeoutError")))
      .toBe("请求超时，请确认最新数据后再试。");
    expect(requestErrorText(new ApiError("Request failed with status 502", { status: 502 })))
      .toBe("服务暂时不可用，请稍后重试。");
  });

  it("localizes GitHub manage errors while retaining their actionable meaning", async () => {
    await setLang("zh");
    expect(requestErrorText({ code: "github_org_admin_required" }))
      .toBe("请使用 GitHub 组织所有者或管理员账户管理此安装。");
  });

  it("keeps provider identity errors separate from an expired Norulo session", () => {
    expect(requestErrorText({ status: 403, code: "GITHUB_REAUTHORIZATION_REQUIRED" }))
      .toBe("Reconnect your GitHub account before checking repository access.");
    expect(requestErrorText({ status: 401, code: "GITHUB_IDENTITY_REQUIRED" }))
      .toContain("Connect your GitHub account");
  });
});
