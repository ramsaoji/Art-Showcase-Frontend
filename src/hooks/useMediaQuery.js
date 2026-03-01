import { useState, useEffect } from "react";

/**
 * Returns true when the given CSS media query matches, reactively updating on change.
 * Safe for SSR (returns false when window is undefined).
 * @param {string} query - A CSS media query string, e.g. "(max-width: 768px)".
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  // Lazy state initialization to avoid calling window.matchMedia during SSR (rerender-lazy-state-init)
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const media = window.matchMedia(query);
    
    // Update state if it doesn't match
    const updateMatches = () => setMatches(media.matches);
    
    // Set initial match state
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Use modern addEventListener with options for better performance
    media.addEventListener("change", updateMatches);
    return () => media.removeEventListener("change", updateMatches);
  }, [query]); // Remove matches from deps to avoid unnecessary re-runs (rerender-dependencies)

  return matches;
}
