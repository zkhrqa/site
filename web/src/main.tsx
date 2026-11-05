import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

history.scrollRestoration = "manual";
const [navigation] = performance.getEntriesByType(
  "navigation",
) as PerformanceNavigationTiming[];
if (
  navigation?.type === "reload" &&
  /^#\/(map|lessons|about)$/.test(location.hash)
) {
  history.replaceState(history.state, "", "#/");
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
