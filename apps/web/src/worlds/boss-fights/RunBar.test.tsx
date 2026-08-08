import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RunBar from "./RunBar";

// jsdom doesn't implement matchMedia; RunBar's running-state effect reads
// prefersReducedMotion(), which calls it.
beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
});

afterEach(() => {
  cleanup();
});

describe("RunBar", () => {
  it("renders the EXECUTE label when idle", () => {
    render(<RunBar isRunning={false} onRun={() => undefined} />);
    expect(screen.getByRole("button").textContent).toContain(">_ EXECUTE");
  });

  it("calls onRun when clicked while idle", () => {
    const onRun = vi.fn();
    render(<RunBar isRunning={false} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("disables the button and shows a running label while running", () => {
    render(<RunBar isRunning={true} onRun={() => undefined} />);
    const button = screen.getByRole<HTMLButtonElement>("button");
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("RUNNING");
  });

  it("does not call onRun when clicked while already running", () => {
    const onRun = vi.fn();
    render(<RunBar isRunning={true} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRun).not.toHaveBeenCalled();
  });
});
