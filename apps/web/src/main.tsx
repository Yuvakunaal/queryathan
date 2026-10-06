import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import "./styles/reset.css";
import "./styles/tokens.css";
import { registerServiceWorker } from "./registerServiceWorker";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>
  </StrictMode>,
);

registerServiceWorker();
