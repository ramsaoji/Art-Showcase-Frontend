import { useState, useEffect, useCallback } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import InfiniteScroll from "react-infinite-scroll-component";
import ArtworkCard from "../ArtworkCard";
import Loader from "../ui/Loader";
import { Virtuoso } from "react-virtuoso";

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
}) {
  // State to track if we should use virtualization (for larger datasets)
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Update virtualization state when artwork count changes
  useEffect(() => {
    // Enable virtualization for larger datasets (more than 20 items)
    setUseVirtualization(allArtworks.length > 20);
  }, [allArtworks.length]);

  // Memoized item renderer for virtualization
  const ItemRenderer = useCallback(
    (index) => {
      const image = allArtworks[index];
      return (
        <div className="p-2">
          <ArtworkCard
            key={image.id}
            artwork={image}
            onDelete={handleDelete}
            onQuickView={handleImageClick}
          />
        </div>
      );
    },
    [allArtworks, handleDelete, handleImageClick]
  );
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
            {allArtworks.length < pageData.totalCount && (
              <span className="text-gray-500 text-sm block mt-1">
                Showing {allArtworks.length} of {pageData.totalCount}
              </span>
            )}
          </p>
        </div>
      )}

      {isCardsLoading && allArtworks.length === 0 ? (
        // Loading skeleton for initial load
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl aspect-[3/4] mb-4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : // Use virtualization for larger datasets, infinite scroll for smaller ones
      useVirtualization ? (
        <div className="min-h-[800px]">
          <Virtuoso
            style={{ height: "800px" }}
            totalCount={allArtworks.length}
            overscan={200}
            endReached={hasMore ? loadMore : null}
            itemContent={ItemRenderer}
            components={{
              Footer: () => (
                <div className="text-center py-8">
                  {hasMore ? (
                    <div className="inline-flex items-center space-x-2 text-gray-600">
                      <Loader size="small" />
                      <span className="text-base font-sans">
                        Loading more artworks...
                      </span>
                    </div>
                  ) : (
                    allArtworks.length > 0 && (
                      <p className="text-gray-500 font-sans text-base">
                        🎨{" "}
                        {allArtworks.length === 1
                          ? "You've seen the only artwork!"
                          : `You've seen all ${allArtworks.length} artworks!`}
                      </p>
                    )
                  )}
                </div>
              ),
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12"
          />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={allArtworks.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <Loader size="small" />
                <span className="text-base font-sans">
                  Loading more artworks...
                </span>
              </div>
            </div>
          }
          endMessage={
            allArtworks.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-sans text-base">
                  🎨{" "}
                  {allArtworks.length === 1
                    ? "You've seen the only artwork!"
                    : `You've seen all ${allArtworks.length} artworks!`}
                </p>
              </div>
            ) : null
          }
          scrollThreshold={0.8}
          style={{ overflow: "visible" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {allArtworks.map((image) => (
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
      {!isCardsLoading &&
        allArtworks.length === 0 &&
        pageData &&
        pageData.totalCount === 0 && (
          <div className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            <PhotoIcon className="mx-auto h-16 w-16 text-gray-400/80" />
            <h3 className="mt-4 text-xl sm:text-2xl font-artistic font-bold tracking-wide text-gray-900">
              No Artworks Found
            </h3>
            <p className="mt-3 text-base sm:text-lg font-sans tracking-wide leading-relaxed text-gray-600 max-w-md mx-auto">
              {searchQuery.trim() ? (
                <>
                  No artworks match your search{" "}
                  <span className="font-medium text-indigo-600">
                    "{searchQuery}"
                  </span>
                  <br />
                  Try different keywords or{" "}
                </>
              ) : (
                "No artworks match the selected filters. Try "
              )}
              <button
                onClick={handleResetAllFilters}
                className="inline-flex font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                clear all filters
              </button>
            </p>
          </div>
        )}
    </div>
  );
}
