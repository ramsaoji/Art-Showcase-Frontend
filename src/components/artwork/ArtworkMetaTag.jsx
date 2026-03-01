/**
 * ArtworkMetaTag
 * Pill-style metadata tag used for style, material, dimensions, dates etc.
 * Pixel-identical to every inline "px-3 py-1 text-sm bg-white/60 rounded-xl border" span
 * in ArtworkCard and ArtworkDetail.
 *
 * @param {React.ReactNode} children
 * @param {string} [className] - Additional classes (e.g. "bg-red-50/80 text-red-700 border-red-200/50")
 * @param {string} [title] - Native tooltip
 */
export default function ArtworkMetaTag({ children, className = "", title }) {
  return (
    <span
      className={`px-3 py-1 text-sm font-sans font-medium bg-white/60 backdrop-blur-sm text-gray-800 rounded-xl shadow-sm border border-gray-200/60 hover:border-gray-300/70 transition-colors ${className}`}
      title={title}
    >
      {children}
    </span>
  );
}
