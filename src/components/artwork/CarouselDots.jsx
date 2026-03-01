/**
 * CarouselDots
 * Reusable dot indicator bar for multi-image carousels.
 * Extracted from ArtworkCard, ImageModal, and FullScreenOverlay
 * to eliminate three copies of near-identical markup.
 *
 * @param {Array}    images       - Array of image objects (used for length + keys)
 * @param {number}   currentIndex - Active dot index
 * @param {Function} onDotClick   - Called with the index when a dot is clicked
 * @param {string}   [className]  - Extra classes on the wrapper
 */
export default function CarouselDots({ images, currentIndex, onDotClick, className = "bottom-4" }) {
  if (!images || images.length <= 1) return null;

  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-3 z-20 bg-black/30 backdrop-blur-md rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 ${className}`}
    >
      {images.map((img, idx) => (
        <button
          key={img.id ?? idx}
          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 focus:outline-none ${
            idx === currentIndex
              ? "bg-white scale-110 shadow-lg shadow-white/25"
              : "bg-white/40 scale-90 hover:scale-105 hover:bg-white/60"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onDotClick(idx);
          }}
          aria-label={`Go to image ${idx + 1}`}
          type="button"
        />
      ))}
    </div>
  );
}
