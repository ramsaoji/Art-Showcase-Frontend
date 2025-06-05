import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function GallerySearch({
  searchInput,
  handleSearchInput,
  clearSearch,
  isSearching,
}) {
  return (
    <>
      {/* Show search indicator when user is typing */}
      {isSearching && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by title, artist, style, or material..."
            className="w-full pl-12 pr-4 py-4 text-base font-sans rounded-full bg-white/80 border border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all duration-300 shadow-sm hover:shadow-md"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
