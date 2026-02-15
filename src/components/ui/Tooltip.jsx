import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Reusable tooltip that shows full content on hover when the child is truncated.
 * Renders via portal so it appears above dropdowns/modals. Matches app theme.
 *
 * @param {string} content - Full text to show in the tooltip (e.g. full email/name)
 * @param {string|React.ReactNode} children - Text or node to display (truncated with ellipsis).
 * @param {boolean} showOnlyWhenTruncated - If true, tooltip only shows when content is visually truncated (default: true)
 * @param {string} contentClassName - Class for the truncating wrapper (e.g. "flex-grow truncate")
 */
export default function Tooltip({
  content,
  children,
  showOnlyWhenTruncated = true,
  className = "",
  contentClassName = "truncate",
}) {
  const [visible, setVisible] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const measureRef = useRef(null);

  const checkTruncation = useCallback(() => {
    if (!measureRef.current) return false;
    const el = measureRef.current;
    const truncated = el.scrollWidth > el.clientWidth;
    setIsTruncated(truncated);
    return truncated;
  }, []);

  const updatePosition = useCallback(() => {
    if (!measureRef.current) return;
    const rect = measureRef.current.getBoundingClientRect();
    setPosition({
      left: rect.left,
      top: rect.top - 6,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (showOnlyWhenTruncated) {
      const truncated = checkTruncation();
      if (truncated) {
        updatePosition();
        setVisible(true);
      }
    } else {
      updatePosition();
      setVisible(true);
    }
  }, [showOnlyWhenTruncated, checkTruncation, updatePosition]);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useLayoutEffect(() => {
    if (visible && measureRef.current) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  const shouldShow = visible && (!showOnlyWhenTruncated || isTruncated);

  const tooltipEl =
    shouldShow &&
    content &&
    createPortal(
      <span
        role="tooltip"
        className="fixed px-3 py-2 max-w-[280px] text-sm font-sans text-white bg-gray-900 rounded-lg shadow-xl border border-gray-700 whitespace-normal break-words pointer-events-none z-[9999]"
        style={{
          lineHeight: 1.4,
          left: position.left,
          top: position.top,
          transform: "translateY(-100%)",
        }}
      >
        {content}
        <span
          className="absolute left-3 top-full border-[5px] border-transparent border-t-gray-900"
          aria-hidden
        />
      </span>,
      document.body
    );

  return (
    <span
      className={`relative inline-block min-w-0 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={measureRef}
        className={contentClassName}
        style={{ display: "block", minWidth: 0 }}
      >
        {children}
      </span>
      {tooltipEl}
    </span>
  );
}
