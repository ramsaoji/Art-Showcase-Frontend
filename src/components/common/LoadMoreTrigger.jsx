import ArrowDownCircleIcon from "@heroicons/react/24/outline/ArrowDownCircleIcon";
import Loader from "@/components/common/Loader";

/**
 * LoadMoreTrigger
 * "Load More" clickable link shown at the bottom of paginated scroll lists.
 * Pixel-identical to every inline version in CarouselManagement and FeaturedArtworksManagement.
 *
 * @param {Function} onClick
 * @param {boolean} [isLoading=false] - Shows a small spinner instead of the link while loading
 * @param {string} [label="Load More"]
 */
export default function LoadMoreTrigger({ onClick, isLoading = false, label }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader size="small" />
      </div>
    );
  }

  if (!label) return null;

  return (
    <div className="flex justify-center mt-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer hover:text-indigo-800 hover:underline hover:-translate-y-0.5 transition font-sans text-base bg-transparent border-none p-0"
      >
        <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
        {label}
      </button>
    </div>
  );
}
