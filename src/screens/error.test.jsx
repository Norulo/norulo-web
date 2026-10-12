import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotFoundScreen } from "./error.jsx";

// The page shares the public header/footer, so recovery links are scoped.
const suggestions = () => within(document.querySelector(".notfound-suggest"));

describe("NotFoundScreen", () => {
  it("suggests login instead of private account pages when signed out", () => {
    render(<NotFoundScreen go={vi.fn()} requested="missing" auth={{ authenticated: false }} />);

    expect(suggestions().getByText("Sign in")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Repositories and watches")).not.toBeInTheDocument();
  });

  it("suggests private account pages when signed in", () => {
    render(<NotFoundScreen go={vi.fn()} requested="missing" auth={{ authenticated: true }} />);

    expect(suggestions().getByText("Projects")).toBeInTheDocument();
    expect(suggestions().getByText("Shared expenses")).toBeInTheDocument();
  });

  it("exposes signed-out recovery suggestions as real screen links", async () => {
    const user = userEvent.setup();
    const go = vi.fn();

    render(<NotFoundScreen go={go} requested="missing" auth={{ authenticated: false }} />);

    const home = suggestions().getByRole("link", { name: /^home/i });
    const signIn = suggestions().getByRole("link", { name: /^sign in/i });
    const status = suggestions().getByRole("link", { name: /^status/i });

    expect(home).toHaveAttribute("href", "/");
    expect(signIn).toHaveAttribute("href", "/login");
    expect(status).toHaveAttribute("href", "/status");

    await user.click(status);

    expect(go).toHaveBeenCalledWith("status");
  });

  it("exposes signed-in recovery suggestions as real screen links", () => {
    render(<NotFoundScreen go={vi.fn()} requested="missing" auth={{ authenticated: true }} />);

    expect(suggestions().getByRole("link", { name: /^projects/i })).toHaveAttribute(
      "href",
      "/projects"
    );
    expect(suggestions().getByRole("link", { name: /^shared expenses/i })).toHaveAttribute(
      "href",
      "/shared"
    );
  });

  it("exposes support email as a real mail link", () => {
    render(<NotFoundScreen go={vi.fn()} requested="missing" auth={{ authenticated: false }} />);

    expect(screen.getByRole("link", { name: /contact@norulo\.com/i })).toHaveAttribute(
      "href",
      "mailto:contact@norulo.com"
    );
  });
});
