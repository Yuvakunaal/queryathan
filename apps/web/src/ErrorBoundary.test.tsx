import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Boom(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("shows its children when nothing goes wrong", () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeTruthy();
  });

  it("shows a plain message and a way forward instead of a blank page", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Something went wrong");
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });
});
