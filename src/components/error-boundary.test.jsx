import { lazy, Suspense } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary.jsx";
import { setLang } from "../i18n.jsx";

function BrokenScreen({ fail = true }) {
  if (fail) throw new Error("Private ledger detail must not reach the fallback");
  return <p>Recovered screen</p>;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  await setLang("en");
  vi.restoreAllMocks();
});

describe("React failure recovery", () => {
  it("keeps the surrounding shell mounted and offers explicit recovery without exposing error details", () => {
    const onReload = vi.fn();
    const onError = vi.fn();
    render(<>
      <button>Shell navigation</button>
      <ErrorBoundary onReload={onReload} onError={onError}><BrokenScreen /></ErrorBoundary>
    </>);
    expect(screen.getByRole("button", { name: "Shell navigation" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to display this screen");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.queryByText(/Private ledger detail/)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unsaved changes may be lost.");
    expect(onReload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reload Norulo" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it.each([
    "Failed to fetch dynamically imported module: https://norulo.com/assets/old.js",
    "error loading dynamically imported module",
    "Importing a module script failed.",
  ])("catches lazy import rejection without automatically retrying: %s", async (message) => {
    const load = vi.fn(() => Promise.reject(new TypeError(message)));
    const LazyScreen = lazy(load);
    const onReload = vi.fn();
    render(<ErrorBoundary fullPage onReload={onReload}>
      <Suspense fallback={<p>Loading screen</p>}><LazyScreen /></Suspense>
    </ErrorBoundary>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Check your connection");
    expect(screen.getByRole("main")).toHaveClass("app-startup");
    expect(load).toHaveBeenCalledTimes(1);
    expect(onReload).not.toHaveBeenCalled();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it("recovers only after the containing route/account scope key changes", () => {
    const { rerender } = render(<ErrorBoundary key="project:account-a"><BrokenScreen /></ErrorBoundary>);
    rerender(<ErrorBoundary key="project:account-a"><BrokenScreen fail={false} /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByText("Recovered screen")).not.toBeInTheDocument();
    rerender(<ErrorBoundary key="project:account-b"><BrokenScreen fail={false} /></ErrorBoundary>);
    expect(screen.getByText("Recovered screen")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("updates failure copy when the user changes language even if a locale chunk cannot load", async () => {
    render(<ErrorBoundary><BrokenScreen /></ErrorBoundary>);
    // Inline fallback translations are available before any lazy catalog resolves.
    let ready;
    act(() => { ready = setLang("zh"); });
    expect(screen.getByRole("alert")).toHaveTextContent("无法显示此页面");
    expect(screen.getByRole("button", { name: "重新加载 Norulo" })).toBeVisible();
    await act(async () => { await ready; });
  });
});
