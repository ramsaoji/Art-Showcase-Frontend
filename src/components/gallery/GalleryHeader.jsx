import GallerySearch from "./GallerySearch";

export default function GalleryHeader({
  searchInput,
  handleSearchInput,
  clearSearch,
  isSearching,
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
      />
    </div>
  );
}
