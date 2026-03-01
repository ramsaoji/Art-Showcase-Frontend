import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the custom scroll container to the top on every route change.
 *
 * Uses a multi-stage enforcement strategy to handle all race conditions:
 * - Immediate reset (synchronous)
 * - After microtasks/RAF (handles autofocus, focus managers)
 * - After 50ms (handles lazy module hydration, Framer Motion layout)
 * - After 150ms (handles async data loads that shift layout)
 *
 * Also disables browser scroll restoration so the browser does not
 * attempt to restore scroll positions on history navigation.
 */

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      const container = document.getElementById("main-scroll-container");
      if (container && container.scrollTop !== 0) {
        container.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    // Stage 1: Immediate
    scrollToTop();

    // Stage 2: After current JS task + browser paint
    let rafId = requestAnimationFrame(() => {
      scrollToTop();
      rafId = requestAnimationFrame(scrollToTop);
    });

    // Stage 3: After lazy module loads and Framer Motion layout animations
    const t1 = setTimeout(scrollToTop, 50);
    // Stage 4: After async data fetches that change page height
    const t2 = setTimeout(scrollToTop, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
