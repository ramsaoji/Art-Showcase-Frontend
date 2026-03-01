import { useRef, useState } from "react";
import {
  Tooltip as TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

/**
 * Reusable tooltip backed by shadcn TooltipPrimitive.
 * Shows full content on hover; optionally only when child is visually truncated.
 *
 * @param {string} content - Full text to show in the tooltip
 * @param {string|React.ReactNode} children - Text or node to display
 * @param {boolean} showOnlyWhenTruncated - Only show tooltip when text is truncated (default: true)
 * @param {string} contentClassName - Class for the truncating wrapper (e.g. "flex-grow truncate")
 * @param {string} className - Class for the outer wrapper span
 */
export default function Tooltip({
  content,
  children,
  showOnlyWhenTruncated = true,
  className = "",
  contentClassName = "truncate",
}) {
  const measureRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next) => {
    if (!next) { setOpen(false); return; }
    if (showOnlyWhenTruncated && measureRef.current) {
      const el = measureRef.current;
      if (el.scrollWidth <= el.clientWidth) return;
    }
    setOpen(next);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <TooltipRoot open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <span className={`relative inline-block min-w-0 ${className}`}>
            <span
              ref={measureRef}
              className={contentClassName}
              style={{ display: "block", minWidth: 0 }}
            >
              {children}
            </span>
          </span>
        </TooltipTrigger>
        {content && (
          <TooltipContent side="top">
            {content}
          </TooltipContent>
        )}
      </TooltipRoot>
    </TooltipProvider>
  );
}
