import { useNavigate, useEffect } from "react-router-dom";

/** Handles SPA redirect from GitHub Pages 404.html fallback.
 *  Uses React Router navigation (client-side) to avoid a full page
 *  reload that would re-trigger 404.html and cause an infinite loop. */
export function SpaRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUrl = localStorage.getItem("spa-redirect");
    if (redirectUrl) {
      localStorage.removeItem("spa-redirect");
      // Client-side navigation — no page reload, so 404.html won't fire again
      navigate(redirectUrl.replace(window.location.origin, ""), { replace: true });
    }
  }, [navigate]);

  return null;
}
