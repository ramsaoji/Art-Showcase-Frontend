import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useGallery from "@/hooks/useGallery";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import GalleryFilters from "@/features/gallery-filters";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import ImageModal from "@/components/artwork/ImageModal";
import ErrorState from "@/components/common/ErrorState";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import { containerMotion } from "@/lib/motionConfigs";
import { Button } from "@/components/ui/button";

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

  // Layout view type: 'grid' or 'masonry'
  const [layoutType, setLayoutType] = useState('masonry');
  const isFiltersDisabled =
    isArtistsLoading ||
    isArtistFilterLoading ||
    isMaterialsLoading ||
    isStylesLoading;

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
      <div className="relative min-h-screen bg-white/50">
        <PageBackground />
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <ErrorState
              title="Failed to load gallery"
              description={
                getFriendlyErrorMessage(error) ||
                "There was an issue fetching the gallery. Please try again."
              }
              primaryAction={
                <Button
                  variant="default"
                  className="rounded-full px-8 font-artistic text-base"
                  onClick={() => handleManualRefetch()}
                >
                  Retry
                </Button>
              }
              secondaryAction={
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full px-6 font-artistic text-base"
                >
                  <Link to="/">Return Home</Link>
                </Button>
              }
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white/50">
      <PageBackground />
      <motion.div
        {...containerMotion}
        className="text-center"
      >
        <div className="relative container mx-auto px-4 sm:px-8 py-12">
          {/* Header Section with Search */}
          <GalleryHeader
            searchInput={searchInput}
            handleSearchInput={handleSearchInput}
            clearSearch={clearSearch}
            isSearching={isSearching}
            disabled={false}
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
            layoutType={layoutType}
            setLayoutType={setLayoutType}
            disabled={isFiltersDisabled}
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
            layoutType={layoutType}
          />
        </div>
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
