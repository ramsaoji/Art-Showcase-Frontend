/**
 * Pagination
 * Previous / page-number buttons / Next pagination control.
 * Pixel-identical to the duplicated pagination blocks in ArtistApprovals and ArtistQuotaLimits.
 *
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Called with new page number
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="w-full mt-8">
      <div className="flex flex-nowrap justify-center sm:justify-between items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Go to previous page"
        >
          Previous
        </button>

        <div className="flex flex-nowrap gap-2 overflow-x-auto min-w-0 hide-scrollbar py-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm min-w-[36px] sm:min-w-[44px] text-sm sm:text-base ${
                p === page
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                  : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-indigo-50 hover:to-indigo-100"
              }`}
              onClick={() => onPageChange(p)}
              aria-label={p === page ? `Current page, ${p}` : `Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
