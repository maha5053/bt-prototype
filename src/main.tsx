// Store the SPA redirect path before React renders.
// 404.html saves the target URL, then redirects to /bt-prototype/.
// We'll read it here and pass it to a component that uses React Router's
// useNavigate for proper client-side navigation.
const spaRedirectUrl = localStorage.getItem("spa-redirect");
if (spaRedirectUrl) {
  localStorage.removeItem("spa-redirect");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CurrentUserProvider } from "./context/CurrentUserContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentUserProvider>
      <App />
    </CurrentUserProvider>
  </StrictMode>,
);
