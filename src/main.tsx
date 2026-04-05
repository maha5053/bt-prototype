// Handle GitHub Pages SPA redirect using hash (avoids 404.html loop)
const hash = window.location.hash;
if (hash.startsWith("#redirect")) {
  const path = hash.replace("#redirect", "");
  // Clean up hash and navigate to the real path
  history.replaceState(
    null,
    "",
    "/bt-prototype" + path + window.location.search,
  );
  // Reload so the router picks up the new URL
  window.location.reload();
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
