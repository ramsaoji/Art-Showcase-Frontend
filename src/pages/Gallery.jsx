import ImageModal from "../components/ImageModal";
import { motion } from "framer-motion";
import useGallery from "../hooks/useGallery";
import GalleryHeader from "../components/gallery/GalleryHeader";
import GalleryFilters from "../components/gallery/GalleryFilters";
import GalleryGrid from "../components/gallery/GalleryGrid";
import Alert from "../components/Alert";
import { getFriendlyErrorMessage } from "../utils/formatters";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { useCallback, useMemo } from "react";

// Hoisted static motion configuration (rendering-hoist-jsx)
const galleryContainerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

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
    isArtistFilterLoading,
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
    markDropdownOpened,

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

  // Memoized selectedArtworkIndex (js-cache-function-results)
  const selectedArtworkIndex = useMemo(() => {
    if (!selectedImage || !allArtworks) return -1;
    return allArtworks.findIndex((img) => img.id === selectedImage.id);
  }, [selectedImage, allArtworks]);

  // Memoized modal handlers (rerender-functional-setstate)
  const handleModalClose = useCallback(() => {
    setSelectedImage(null);
  }, [setSelectedImage]);

  const handleModalPrevious = useCallback(() => {
    if (selectedArtworkIndex > 0 && allArtworks) {
      setSelectedImage(allArtworks[selectedArtworkIndex - 1]);
    }
  }, [selectedArtworkIndex, allArtworks, setSelectedImage]);

  const handleModalNext = useCallback(() => {
    if (allArtworks && selectedArtworkIndex < allArtworks.length - 1) {
      setSelectedImage(allArtworks[selectedArtworkIndex + 1]);
    }
  }, [selectedArtworkIndex, allArtworks, setSelectedImage]);

  if (isError) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <Alert
            type="error"
            message={
              getFriendlyErrorMessage(error) ||
              "There was an issue fetching the gallery. Please try again."
            }
            onRetry={handleManualRefetch}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="relative min-h-screen bg-white/50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>
      <motion.div
        {...galleryContainerMotion}
        className="text-center"
      >
        <div className="relative container mx-auto px-4 sm:px-8 py-12">
          {/* Header Section with Search */}
          <GalleryHeader
            searchInput={searchInput}
            handleSearchInput={handleSearchInput}
            clearSearch={clearSearch}
            isSearching={isSearching}
          />
          {/* <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 p-6 sm:p-8"> */}
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
            isArtistFilterLoading={isArtistFilterLoading}
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
            markDropdownOpened={markDropdownOpened}
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
        {/* </div> */}
      </motion.div>
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={handleModalClose}
          image={selectedImage || {}}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
          hasPrevious={selectedArtworkIndex > 0}
          hasNext={selectedArtworkIndex < (allArtworks?.length || 0) - 1}
        />
      )}
      <ScrollToTopButton />
    </div>
  );
}
