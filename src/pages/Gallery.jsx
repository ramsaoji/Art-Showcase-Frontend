import ImageModal from "../components/ImageModal";
import useGallery from "../hooks/useGallery";
import GalleryHeader from "../components/gallery/GalleryHeader";
import GalleryFilters from "../components/gallery/GalleryFilters";
import GalleryGrid from "../components/gallery/GalleryGrid";

export default function Gallery() {
  const {
    // State
    sortBy,
    filters,
    searchInput,
    searchQuery,
    isSearching,
    materials,
    artists,
    selectedImage,
    isMobileFiltersOpen,
    allArtworks,
    hasMore,
    pageData,
    isCardsLoading,
    isError,
    error,
    styles,
    isArtistsLoading,
    isMaterialsLoading,
    isStylesLoading,
    hasMoreArtists,
    hasMoreMaterials,
    hasMoreStyles,
    handleArtistSearch,
    handleMaterialSearch,
    handleStyleSearch,
    loadMoreArtists,
    loadMoreMaterials,
    loadMoreStyles,
    artistSearch,
    materialSearch,
    styleSearch,

    // Handlers
    setSelectedImage,
    setIsMobileFiltersOpen,
    handleSearchInput,
    handleImageClick,
    handleDelete,
    handleFilterChange,
    handleSortChange,
    handleResetAllFilters,
    clearSearch,
    handleManualRefetch,
    loadMore,
  } = useGallery();

  if (isError) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl font-sans text-sm">
            Error loading artworks:{" "}
            {error?.message || "Unknown error occurred."}
            <br />
            <button
              onClick={handleManualRefetch}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section with Search */}
        <GalleryHeader
          searchInput={searchInput}
          handleSearchInput={handleSearchInput}
          clearSearch={clearSearch}
          isSearching={isSearching}
        />

        {/* Filters and Sort Section */}
        <GalleryFilters
          filters={filters}
          sortBy={sortBy}
          materials={materials}
          artists={artists}
          styles={styles}
          handleFilterChange={handleFilterChange}
          handleSortChange={handleSortChange}
          handleResetAllFilters={handleResetAllFilters}
          isMobileFiltersOpen={isMobileFiltersOpen}
          setIsMobileFiltersOpen={setIsMobileFiltersOpen}
          isArtistsLoading={isArtistsLoading}
          isMaterialsLoading={isMaterialsLoading}
          isStylesLoading={isStylesLoading}
          hasMoreArtists={hasMoreArtists}
          hasMoreMaterials={hasMoreMaterials}
          hasMoreStyles={hasMoreStyles}
          handleArtistSearch={handleArtistSearch}
          handleMaterialSearch={handleMaterialSearch}
          handleStyleSearch={handleStyleSearch}
          loadMoreArtists={loadMoreArtists}
          loadMoreMaterials={loadMoreMaterials}
          loadMoreStyles={loadMoreStyles}
          artistSearch={artistSearch}
          materialSearch={materialSearch}
          styleSearch={styleSearch}
        />

        {/* Gallery Grid with Artworks */}
        <GalleryGrid
          isCardsLoading={isCardsLoading}
          allArtworks={allArtworks}
          pageData={pageData}
          hasMore={hasMore}
          loadMore={loadMore}
          handleImageClick={handleImageClick}
          handleDelete={handleDelete}
          handleResetAllFilters={handleResetAllFilters}
          searchQuery={searchQuery}
          filters={filters}
        />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          image={selectedImage || {}}
          onPrevious={() => {
            const currentIndex =
              allArtworks?.findIndex((img) => img.id === selectedImage?.id) ||
              0;
            if (currentIndex > 0 && allArtworks) {
              setSelectedImage(allArtworks[currentIndex - 1]);
            }
          }}
          onNext={() => {
            const currentIndex =
              allArtworks?.findIndex((img) => img.id === selectedImage?.id) ||
              0;
            if (allArtworks && currentIndex < allArtworks.length - 1) {
              setSelectedImage(allArtworks[currentIndex + 1]);
            }
          }}
          hasPrevious={
            selectedImage &&
            allArtworks &&
            allArtworks.findIndex((img) => img.id === selectedImage.id) > 0
          }
          hasNext={
            selectedImage &&
            allArtworks &&
            allArtworks.findIndex((img) => img.id === selectedImage.id) <
              allArtworks.length - 1
          }
        />
      )}
    </div>
  );
}
