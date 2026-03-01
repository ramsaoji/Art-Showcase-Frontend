import { useEffect } from "react";

/**
 * useScrollLock — locks scrolling on the main scroll container when `isLocked` is true.
 *
 * This app uses `#main-scroll-container` as its primary scroll area (not document.body),
 * so Radix's built-in body scroll lock won't prevent background scrolling for our layout.
 * This hook targets that container directly and also locks body as a fallback.
 *
 * @param {boolean} isLocked — whether scrolling should be prevented.
 */
export default function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollContainer = document.getElementById("main-scroll-container");
    const body = document.body;

    // Store original overflow values
    const originalContainerOverflow = scrollContainer?.style.overflow ?? "";
    const originalBodyOverflow = body.style.overflow;

    // Lock scrolling
    if (scrollContainer) {
      scrollContainer.style.overflow = "hidden";
    }
    body.style.overflow = "hidden";

    return () => {
      // Restore original overflow values
      if (scrollContainer) {
        scrollContainer.style.overflow = originalContainerOverflow;
      }
      body.style.overflow = originalBodyOverflow;
    };
  }, [isLocked]);
}
