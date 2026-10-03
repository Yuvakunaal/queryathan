import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RunBar from "./RunBar";

afterEach(() => {
  cleanup();
});

describe("RunBar", () => {
  it("renders a Run button when idle", () => {
    render(<RunBar isRunning={false} onRun={() => undefined} />);
    expect(screen.getByRole("button").textContent).toContain("Run");
  });

  it("calls onRun when clicked while idle", () => {
    const onRun = vi.fn();
    render(<RunBar isRunning={false} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("disables the button and says it is running while running", () => {
    render(<RunBar isRunning={true} onRun={() => undefined} />);
    const button = screen.getByRole<HTMLButtonElement>("button");
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Running");
  });

  it("does not call onRun when clicked while already running", () => {
    const onRun = vi.fn();
    render(<RunBar isRunning={true} onRun={onRun} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRun).not.toHaveBeenCalled();
  });
});
