import { describe, expect, it } from "vitest";
import config from "./vite.config.js";

describe("vite production build inputs", () => {
  it("does not publish the prototype review page as a production asset", () => {
    expect(config.build.rollupOptions.input).not.toHaveProperty("review");
  });
});

describe("vite development API proxy", () => {
  it("keeps development and preview listeners on loopback by default", () => {
    expect(config.server.host).toBe("127.0.0.1");
    expect(config.preview.host).toBe("127.0.0.1");
  });

  it("strips the /api prefix to match the production Worker proxy", () => {
    const apiProxy = config.server.proxy["^/api(?:/|\\?|$)"];
    expect(apiProxy.rewrite("/api/auth/session?fresh=1")).toBe(
      "/auth/session?fresh=1"
    );
    expect(apiProxy.rewrite("/api")).toBe("/");
    expect(apiProxy.rewrite("/api?fresh=1")).toBe("/?fresh=1");
    expect(apiProxy.rewrite("/api/api/v1/expenses")).toBe("/api/v1/expenses");
  });
});
