import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/outline/ChevronRightIcon";

/**
 * CarouselNavButton
 * Prev / Next arrow button for image carousels and overlays.
 * Extracted from ArtworkCard, ImageModal, and FullScreenOverlay
 * to eliminate three copies of near-identical markup.
 *
 * @param {"prev"|"next"} direction
 * @param {Function}      onClick
 * @param {string}        [size="md"]  - "sm" | "md" | "lg"
 * @param {string}        [className]  - Extra classes on the button
 */
const sizeClasses = {
  sm: "p-2",
  md: "p-2 sm:p-3",
  lg: "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-4 w-4 sm:h-5 sm:w-5",
  lg: "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6",
};

const defaultPositions = {
  prev: "left-2 sm:left-4",
  next: "right-2 sm:right-4",
};

/**
 * @param {"prev"|"next"} direction
 * @param {Function}      onClick
 * @param {string}        [size="md"]   - "sm" | "md" | "lg"
 * @param {string}        [position]    - Tailwind left/right position classes — overrides default
 * @param {string}        [className]   - Extra classes (z-index, bg overrides, etc.)
 */
export default function CarouselNavButton({
  direction,
  onClick,
  size = "md",
  position,
  className = "",
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  const label = direction === "prev" ? "Previous" : "Next";
  const positionClasses = position ?? defaultPositions[direction];

  return (
    <button
      onClick={onClick}
      className={`absolute ${positionClasses} top-1/2 -translate-y-1/2 z-30 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full ${sizeClasses[size]} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30 ${className}`}
      aria-label={label}
      type="button"
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}
