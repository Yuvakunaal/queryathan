import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface State {
  failed: boolean;
}

/**
 * The last safety net. If anything in the app throws while drawing, the player
 * sees a plain message and a way forward, not a blank page. Progress lives in
 * the browser's storage and is untouched by a crash.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept for anyone with the console open; nothing is sent anywhere.
    console.error("Queryathan hit an error", error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--dcq-color-bg, #0b0f0d)",
          color: "var(--dcq-color-fg, #e7efe9)",
          font: "15px/1.6 ui-monospace, monospace",
        }}
      >
        <div style={{ maxWidth: "46ch" }}>
          <h1 style={{ margin: "0 0 8px", font: "700 22px/1.2 ui-monospace, monospace" }}>
            Something went wrong.
          </h1>
          <p style={{ margin: "0 0 16px" }}>
            Sorry about that. Your progress is saved on this device and nothing was lost.
            Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.assign("/");
            }}
            style={{
              height: "40px",
              padding: "0 18px",
              font: "600 14px ui-monospace, monospace",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
