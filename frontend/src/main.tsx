import React from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App";
// Disable default browser context menu (Refresh, Inspect, etc.)
window.addEventListener("contextmenu", (e: MouseEvent) => {
  e.preventDefault();
});

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
