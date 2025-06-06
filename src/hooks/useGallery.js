import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { trpc } from "../utils/trpc";
import {
  trackArtworkInteraction,
  trackUserAction,
} from "../services/analytics";

export default function useGallery() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialized = useRef(false);

  // State management
  const [sortBy, setSortBy] = useState(() => {
    return new URLSearchParams(location.search).get("sortBy") || "newest";
  });

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      material: params.get("material") || "all",
      availability: params.get("availability") || "all",
      featured: params.get("featured") || "all",
    };
  });

  // Search state - separate input from query
  const [searchInput, setSearchInput] = useState(() => {
    return new URLSearchParams(location.search).get("searchQuery") || "";
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    return new URLSearchParams(location.search).get("searchQuery") || "";
  });

  // Add a state to track if we're actively searching (user is typing)
  const [isSearching, setIsSearching] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Infinite scroll state
  const [allArtworks, setAllArtworks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

  // Create a stable debounced function using useMemo
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue) => {
        setSearchQuery(searchValue);
        setIsSearching(false);
        if (searchValue.trim()) {
          trackUserAction("gallery_search", { query: searchValue.trim() });
        }
      }, 500),
    []
  );

  // Handle search input changes
  const handleSearchInput = useCallback(
    (value) => {
      setSearchInput(value);
      setIsSearching(true);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      setIsSearching(false);
    };
  }, [debouncedSearch]);

  // Create a stable query key that doesn't change unnecessarily
  const queryKey = useMemo(() => {
    const key = {
      searchQuery: searchQuery.trim(),
      material: filters.material,
      availability: filters.availability,
      featured: filters.featured,
      sortBy,
    };
    return JSON.stringify(key);
  }, [searchQuery, filters, sortBy]);

  // Single query input object that's stable
  const queryInput = useMemo(
    () => ({
      searchQuery: searchQuery.trim(),
      material: filters.material,
      availability: filters.availability,
      featured: filters.featured,
      sortBy,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    [searchQuery, filters, sortBy, currentPage]
  );

  // Single tRPC query with proper dependency management
  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.artwork.getAllArtworks.useQuery(queryInput, {
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    cacheTime: 300000,
    keepPreviousData: true,
    enabled: true,
    onSuccess: (data) => {
      console.log("Query succeeded with data:", data);
    },
    onError: (error) => {
      console.error("Query failed with error:", error);
    },
  });

  // Reset pagination when filters change (using stable queryKey)
  const prevQueryKey = useRef(queryKey);
  useEffect(() => {
    if (initialized.current && prevQueryKey.current !== queryKey) {
      console.log("Filter/search change detected, resetting pagination");
      setCurrentPage(1);
      setAllArtworks([]);
      setHasMore(true);
    }
    prevQueryKey.current = queryKey;
    initialized.current = true;
  }, [queryKey]);

  // Handle page data updates more efficiently
  useEffect(() => {
    if (pageData) {
      console.log("Page data received:", pageData);

      if (currentPage === 1) {
        // First page or filter change - replace all artworks
        setAllArtworks(pageData.artworks || []);
      } else {
        // Subsequent pages - append to existing artworks
        setAllArtworks((prev) => {
          const existingIds = new Set(prev.map((art) => art.id));
          const newArtworks = (pageData.artworks || []).filter(
            (art) => !existingIds.has(art.id)
          );
          return [...prev, ...newArtworks];
        });
      }

      // Update hasMore based on server response
      setHasMore(pageData.hasMore || false);
    }
  }, [pageData, currentPage]);

  // Update URL parameters with debouncing to prevent excessive navigation
  const updateURL = useMemo(
    () =>
      debounce((searchQuery, filters, sortBy) => {
        const params = new URLSearchParams();
        if (searchQuery && searchQuery.trim())
          params.set("searchQuery", searchQuery);
        if (filters.material && filters.material !== "all")
          params.set("material", filters.material);
        if (filters.availability && filters.availability !== "all")
          params.set("availability", filters.availability);
        if (filters.featured && filters.featured !== "all")
          params.set("featured", filters.featured);
        if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);

        const newSearch = params.toString();
        const currentSearch = location.search.slice(1);

        if (newSearch !== currentSearch) {
          navigate(`?${newSearch}`, { replace: true });
        }
      }, 300),
    [navigate, location.search]
  );

  useEffect(() => {
    updateURL(searchQuery, filters, sortBy);
  }, [searchQuery, filters, sortBy, updateURL]);

  // Extract materials from all fetched artworks more efficiently
  useEffect(() => {
    if (allArtworks && Array.isArray(allArtworks)) {
      const uniqueMaterials = [
        ...new Set(
          allArtworks
            .map((art) => art.material)
            .filter((material) => material && material.trim())
        ),
      ];
      setMaterials((prev) => {
        // Only update if materials have actually changed
        if (JSON.stringify(prev) !== JSON.stringify(uniqueMaterials)) {
          return uniqueMaterials;
        }
        return prev;
      });
    }
  }, [allArtworks]);

  // Load more function with better state management
  const loadMore = useCallback(() => {
    console.log("Load more called:", { isFetching, hasMore, currentPage });

    if (!isFetching && hasMore) {
      console.log("Loading next page:", currentPage + 1);
      setCurrentPage((prev) => prev + 1);

      // Track infinite scroll interaction
      trackUserAction("gallery_infinite_scroll", {
        page: currentPage + 1,
        total_loaded: allArtworks.length,
      });
    }
  }, [isFetching, hasMore, currentPage, allArtworks.length]);

  // Determine loading state for cards area
  const isCardsLoading = isLoading || (isFetching && currentPage === 1);

  // Memoized event handlers
  const handleImageClick = useCallback((image) => {
    setSelectedImage(image);
    trackArtworkInteraction("gallery_artwork_view", image.id, image.title);
  }, []);

  const handleImageError = useCallback((imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
    trackArtworkInteraction("gallery_artwork_error", imageId);
  }, []);

  const handleDelete = useCallback(
    (deletedId) => {
      // Remove from local state immediately for better UX
      setAllArtworks((prev) =>
        prev.filter((artwork) => artwork.id !== deletedId)
      );

      if (selectedImage?.id === deletedId) {
        setSelectedImage(null);
      }
      trackArtworkInteraction("gallery_artwork_delete", deletedId);
    },
    [selectedImage?.id]
  );

  const handleFilterChange = useCallback((filterType, value) => {
    console.log("Filter change:", filterType, value);
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    trackUserAction("gallery_filter", { type: filterType, value });
  }, []);

  const handleSortChange = useCallback((value) => {
    console.log("Sort change:", value);
    setSortBy(value);
    trackUserAction("gallery_sort", { sort_by: value });
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
    setSortBy("newest");
    setFilters({
      material: "all",
      availability: "all",
      featured: "all",
    });
    setCurrentPage(1);
    setAllArtworks([]);
    setHasMore(true);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Manual refetch for debugging
  const handleManualRefetch = useCallback(() => {
    console.log("Manual refetch triggered");
    refetch();
  }, [refetch]);

  return {
    // State
    sortBy,
    filters,
    searchInput,
    searchQuery,
    isSearching,
    materials,
    selectedImage,
    isMobileFiltersOpen,
    allArtworks,
    hasMore,
    pageData,
    isCardsLoading,
    isError,
    error,

    // Handlers
    setSelectedImage,
    setIsMobileFiltersOpen,
    handleSearchInput,
    handleImageClick,
    handleImageError,
    handleDelete,
    handleFilterChange,
    handleSortChange,
    handleResetAllFilters,
    clearSearch,
    handleManualRefetch,
    loadMore,
  };
}
