import { describe, it, expect } from "vitest";
import { safeConnectReturn, rememberConnectReturn, consumeConnectReturn } from "./connect-return.js";
const path = "/api/connect/authorize?client_id=example&state=state";
const storage = () => { const m = new Map(); return { getItem: k => m.get(k), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
describe("OAuth login continuation", () => {
  it("allows only the exact local authorization path", () => {
    expect(safeConnectReturn(path)).toBe(path);
    for (const p of ["https://evil.example", "//evil.example", "/api/connect/authorize-other?client_id=a", "/api/connect/authorize?client_id=a#evil", "/api/connect/authorize?client_id=a\\evil"]) expect(safeConnectReturn(p)).toBeNull();
  });
  it("survives a login redirect once, then removes the continuation", () => {
    const s = storage(); rememberConnectReturn("?connect_return=" + encodeURIComponent(path), s, 100);
    expect(consumeConnectReturn("", s, 101)).toBe(path);
    expect(consumeConnectReturn("", s, 102)).toBeNull();
  });
  it("expires old or future continuations", () => {
    const s = storage(); rememberConnectReturn("?connect_return=" + encodeURIComponent(path), s, 100);
    expect(consumeConnectReturn("", s, 700000)).toBeNull();
  });
});
