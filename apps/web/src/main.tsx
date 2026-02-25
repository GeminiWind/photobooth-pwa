import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@photobooth/ui";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    }
  });
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
