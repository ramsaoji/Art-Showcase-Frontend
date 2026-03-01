import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useCarousel
 * Shared carousel state logic extracted from ArtworkCard and ImageModal.
 * Manages current index, auto-advance (optional), and manual navigation.
 *
 * @param {Array}   images        - Array of image objects
 * @param {boolean} [autoAdvance=false] - Whether to auto-advance every 4s
 * @param {boolean} [active=true]       - Pauses auto-advance when false (e.g. modal is closed)
 * @returns {{ currentIndex, goTo, goPrev, goNext, setCurrentIndex }}
 */
export default function useCarousel(images, { autoAdvance = false, active = true } = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef(null);
  const count = Array.isArray(images) ? images.length : 0;

  // Auto-advance
  useEffect(() => {
    if (!autoAdvance || !active || count <= 1) return;

    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      setCurrentIndex((idx) => (idx + 1) % count);
    }, 4000);

    return () => clearTimeout(autoTimer.current);
  }, [autoAdvance, active, currentIndex, count]);

  // Reset index when the image set changes (e.g. switching artworks in ImageModal)
  const resetIndex = useCallback(() => setCurrentIndex(0), []);

  const goTo = useCallback(
    (idx) => {
      if (idx === currentIndex) return;
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setCurrentIndex(idx);
    },
    [currentIndex]
  );

  const goPrev = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setCurrentIndex((idx) => (idx - 1 + count) % count);
    },
    [count]
  );

  const goNext = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setCurrentIndex((idx) => (idx + 1) % count);
    },
    [count]
  );

  return { currentIndex, setCurrentIndex, goTo, goPrev, goNext, resetIndex };
}
