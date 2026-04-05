// Handle GitHub Pages SPA redirect BEFORE React renders.
// 404.html saves the target URL, then redirects to /bt-prototype/.
// When the app loads at /bt-prototype/, we swap the URL in the address bar
// to the intended path WITHOUT a server request (history.replaceState),
// then let React Router handle the navigation client-side.
const spaRedirectUrl = localStorage.getItem("spa-redirect");
if (spaRedirectUrl) {
  localStorage.removeItem("spa-redirect");
  // Extract just the path portion from the full URL
  const urlObj = new URL(spaRedirectUrl);
  const path = urlObj.pathname + urlObj.search + urlObj.hash;
  // Change the address bar URL without triggering a server request.
  // React Router's basename-aware routing will pick up the new URL.
  window.history.replaceState(null, "", path);
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
