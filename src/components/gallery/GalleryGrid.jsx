import { useMemo } from "react";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import InfiniteScroll from "react-infinite-scroll-component";
import ArtworkCard from "../ArtworkCard";
import Loader from "../ui/Loader";
import { useAuth } from "../../contexts/AuthContext";

export default function GalleryGrid({
  isCardsLoading,
  allArtworks,
  pageData,
  hasMore,
  loadMore,
  handleImageClick,
  handleDelete,
  handleResetAllFilters,
  searchQuery,
  filters,
}) {
  const { isSuperAdmin, isArtist, user } = useAuth();
  // Filter artworks based on user role and filters
  const filteredArtworks = useMemo(() => {
    // Helper to check if status is selected (handle array or string)
    const isStatusMatch = (artStatus) => {
      if (!filters.status || filters.status === "all" || filters.status.length === 0) return true;
      if (Array.isArray(filters.status)) {
        return filters.status.includes(artStatus);
      }
      return filters.status === artStatus;
    };

    let result = isSuperAdmin
      ? allArtworks
      : isArtist && user
      ? allArtworks.filter(
          (art) =>
            // For own artworks, apply status filter if set
            (art.userId === user.id && isStatusMatch(art.status)) ||
            // For others' artworks, only show ACTIVE
            (art.userId !== user.id && art.status === "ACTIVE")
        )
      : allArtworks.filter((art) => art.status === "ACTIVE");

    // For super admin, apply status filter if set
    if (isSuperAdmin && filters.status && filters.status !== "all" && filters.status.length > 0) {
      result = result.filter((art) => isStatusMatch(art.status));
    }
    return result;
  }, [allArtworks, isSuperAdmin, isArtist, user, filters.status]);

  // Helper: check if any filter or search is active
  const filtersActive =
    (typeof searchQuery === "string" && searchQuery.trim() !== "") ||
    (typeof filters !== "undefined" &&
      ((Array.isArray(filters.material) && filters.material.length > 0 && !filters.material.includes("all")) ||
        (Array.isArray(filters.artist) && filters.artist.length > 0 && !filters.artist.includes("all")) ||
        (Array.isArray(filters.availability) && filters.availability.length > 0 && !filters.availability.includes("all")) ||
        (Array.isArray(filters.featured) && filters.featured.length > 0 && !filters.featured.includes("all")) ||
        (Array.isArray(filters.status) && filters.status.length > 0 && !filters.status.includes("all"))));

  return (
    <div className="relative">
      {/* Search Results Count */}
      {searchQuery.trim() && !isCardsLoading && pageData && (
        <div className="mb-6 text-center">
          <p className="text-base sm:text-lg font-sans tracking-wide">
            <span className="font-medium text-gray-900">
              {pageData.totalCount > 0 ? (
                <>
                  Found {pageData.totalCount}{" "}
                  {pageData.totalCount === 1 ? "artwork" : "artworks"}
                </>
              ) : (
                "No artworks found"
              )}
            </span>{" "}
            <span className="text-gray-600">for</span>{" "}
            <span className="font-medium text-indigo-600">"{searchQuery}"</span>
            {filteredArtworks.length < pageData.totalCount && (
              <span className="text-gray-500 text-sm block mt-1">
                Showing {filteredArtworks.length} of {pageData.totalCount}
              </span>
            )}
          </p>
        </div>
      )}

      {isCardsLoading && filteredArtworks.length === 0 ? (
        // Initial load: skeleton only (no loading text to avoid duplicate)
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl aspect-[3/4] mb-4" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={filteredArtworks.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            filteredArtworks.length > 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2 text-gray-600">
                  <Loader size="small" />
                  <span className="text-base font-sans">
                    Loading more artworks...
                  </span>
                </div>
              </div>
            ) : null
          }
          endMessage={
            filteredArtworks.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-sans text-base">
                  🎨{" "}
                  {filteredArtworks.length === 1
                    ? "You've seen the only artwork!"
                    : `You've seen all ${filteredArtworks.length} artworks!`}
                </p>
              </div>
            ) : null
          }
          scrollThreshold={0.8}
          style={{ overflow: "visible" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {filteredArtworks.map((image) => (
              <ArtworkCard
                key={image.id}
                artwork={image}
                onDelete={handleDelete}
                onQuickView={handleImageClick}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* No Results State */}
      {!isCardsLoading && filteredArtworks.length === 0 && (
        <div className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur rounded-2xl shadow-sm border border-gray-100">
          <PhotoIcon className="mx-auto h-16 w-16 text-gray-400/80" />
          <h3 className="mt-4 text-2xl sm:text-3xl font-artistic font-bold tracking-wide text-gray-900">
            {filtersActive
              ? "No artworks found matching your criteria."
              : "No artworks available."}
          </h3>
          <p className="mt-3 text-base sm:text-lg font-sans tracking-wide leading-relaxed text-gray-600 max-w-md mx-auto">
            {filtersActive ? (
              <>
                <span>Try adjusting your search or filter settings.</span>
                <button
                  onClick={handleResetAllFilters}
                  className="ml-2 inline-flex font-medium text-indigo-600 hover:text-indigo-800 hover:underline  transition-colors"
                >
                  Clear all filters
                </button>
              </>
            ) : null}
          </p>
        </div>
      )}
    </div>
  );
}
