import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Handles SPA redirect from GitHub Pages 404.html fallback.
 *  Uses React Router's navigate() which properly updates the router's
 *  internal state, unlike history.replaceState which only changes the URL bar. */
export function SpaRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const spaRedirectUrl = localStorage.getItem("spa-redirect");
    if (spaRedirectUrl) {
      localStorage.removeItem("spa-redirect");
      const urlObj = new URL(spaRedirectUrl);
      const path = urlObj.pathname + urlObj.search + urlObj.hash;
      // Navigate using React Router — this updates both the URL bar
      // AND the router's internal state, triggering the correct route.
      navigate(path, { replace: true });
    }
  }, [navigate]);

  return null;
}
