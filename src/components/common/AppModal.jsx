import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useScrollLock from "@/hooks/useScrollLock";

/**
 * AppModal — reusable modal shell backed by shadcn Dialog.
 *
 * Structure:
 *   ┌─────────────────────────────┐
 *   │ DialogHeader (title + desc) │  ← always visible, never scrolls
 *   ├─────────────────────────────┤
 *   │ Scrollable body (children)  │  ← flex-1, overflow-y-auto
 *   ├─────────────────────────────┤
 *   │ Footer (footer prop)        │  ← always visible, never scrolls
 *   └─────────────────────────────┘
 *
 * @param {boolean}         props.isOpen        - Controls visibility.
 * @param {Function}        props.onClose        - Called when dialog requests close.
 * @param {boolean}         [props.isLoading]    - When true, prevents closing (backdrop / Esc blocked).
 * @param {string}          props.title          - Modal heading (font-artistic).
 * @param {string|ReactNode}[props.description]  - Subtitle beneath the title.
 * @param {ReactNode}       props.children       - Scrollable body content.
 * @param {ReactNode}       [props.footer]       - Fixed footer content (buttons, etc.).
 * @param {string}          [props.maxWidth]     - Tailwind max-w-* class. Default: "max-w-lg".
 * @param {string}          [props.className]    - Extra classes on DialogContent.
 * @param {boolean}         [props.scrollBody]   - Enable scrollable body. Default: true.
 */
export default function AppModal({
  isOpen,
  onClose,
  isLoading = false,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
  className = "",
  scrollBody = true,
}) {
  useScrollLock(isOpen);

  const handleOpenChange = (open) => {
    if (!open && !isLoading) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${maxWidth} z-[70] font-sans flex flex-col overflow-hidden p-0 ${
          scrollBody ? "max-h-[90dvh]" : ""
        } ${className}`}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        {(title || description) && (
          <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogHeader>
              {title && (
                <DialogTitle className="font-artistic text-2xl font-bold tracking-wide text-gray-900">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-sm text-gray-500 mt-0.5 font-sans">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────── */}
        <div
          className={`px-6 py-4 ${
            scrollBody ? "flex-1 overflow-y-auto" : ""
          }`}
        >
          {children}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
