// Handle GitHub Pages SPA redirect from 404.html
const spaRedirect = localStorage.getItem("spa-redirect");
if (spaRedirect) {
  localStorage.removeItem("spa-redirect");
  window.location.replace(spaRedirect);
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
