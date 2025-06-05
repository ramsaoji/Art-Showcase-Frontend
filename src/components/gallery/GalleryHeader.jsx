import GallerySearch from "./GallerySearch";

export default function GalleryHeader({
  searchInput,
  handleSearchInput,
  clearSearch,
  isSearching,
}) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-10">
      <h1 className="font-artistic text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-wide">
        Art Gallery
      </h1>
      <p className="font-sans text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
