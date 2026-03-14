import { memo } from "react";
import GallerySearch from "./GallerySearch";

/**
 * GalleryHeader — displays the gallery page title, description, and search bar.
 *
 * @param {string} props.searchInput - Current controlled search value.
 * @param {Function} props.handleSearchInput - Called with the new value on each keystroke.
 * @param {Function} props.clearSearch - Clears the search input.
 * @param {boolean} props.isSearching - When true, shows the searching indicator inside GallerySearch.
 * @param {boolean} [props.disabled=false] - Disables the gallery search controls.
 */
function GalleryHeader({
  searchInput,
  handleSearchInput,
  clearSearch,
  isSearching,
  disabled = false,
}) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-10">
      <h1 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
        Art Gallery
      </h1>
      <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
        Discover our curated collection of exceptional artworks from talented
        artists around the world
      </p>

      <GallerySearch
        searchInput={searchInput}
        handleSearchInput={handleSearchInput}
        clearSearch={clearSearch}
        isSearching={isSearching}
        disabled={disabled}
      />
    </div>
  );
}

GalleryHeader.displayName = "GalleryHeader";
export default memo(GalleryHeader);
