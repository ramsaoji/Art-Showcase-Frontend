/**
 * ScrollableListPanel
 * Scroll container for DnD sortable lists used in admin management pages.
 * Pixel-identical to every inline version in CarouselManagement and FeaturedArtworksManagement.
 *
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
export default function ScrollableListPanel({ children, className = "" }) {
  return (
    <div
      className={`space-y-3 min-h-[20rem] max-h-[60vh] overflow-y-auto bg-gray-50/50 rounded-xl border border-gray-200 p-4 ${className}`}
    >
      {children}
    </div>
  );
}
