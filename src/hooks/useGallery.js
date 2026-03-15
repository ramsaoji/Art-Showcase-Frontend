import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import { trpc, useArtistsSearch, useMaterialsSearch, useStylesSearch } from "@/lib/trpc";
import {
  trackArtworkInteraction,
  trackUserAction,
  trackError,
} from "@/services/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { isArtistRole } from "@/lib/rbac";

/**
 * Custom hook that manages all gallery state: search, filters, sort, infinite
 * scroll, image modal, and URL-param synchronisation.
 * @returns {Object} Gallery state and handlers consumed by the Gallery page.
 */
export default function useGallery() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const hasLoggedError = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const isArtistSession = isArtistRole(user?.role);
  const utils = trpc.useUtils();
  const prevUserRef = useRef(user?.id);

  // State management
  const [sortBy, setSortBy] = useState(() => {
    return new URLSearchParams(location.search).get("sortBy") || "newest";
  });

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    const getParam = (key) => {
      const val = params.get(key);
      if (!val || val === "all") return [];
      return val.split(",");
    };
    return {
      material: getParam("material"),
      artist: getParam("artist"),
      availability: getParam("availability"),
      featured: getParam("featured"),
      status: getParam("status"),
      style: getParam("style"),
      discount: getParam("discount"),
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
  const [artists, setArtists] = useState([]); // Will be set from backend
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Infinite scroll state
  const [allArtworks, setAllArtworks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Add state to track which dropdowns have been opened (for lazy loading)
  const [openedDropdowns, setOpenedDropdowns] = useState({
    artist: false,
    material: false,
    style: false,
  });

  // Add state to track if we need to load artist data for active filter
  const [shouldLoadArtistForFilter, setShouldLoadArtistForFilter] =
    useState(false);

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
      material: filters.material.sort().join(","),
      artist: filters.artist.sort().join(","),
      availability: filters.availability.sort().join(","),
      featured: filters.featured.sort().join(","),
      discount: filters.discount.sort().join(","),
      sortBy,
    };
    return JSON.stringify(key);
  }, [searchQuery, filters, sortBy]);

  // Single query input object that's stable
  const queryInput = useMemo(
    () => ({
      searchQuery: searchQuery.trim(),
      material: filters.material,
      artist: filters.artist,
      availability: filters.availability,
      featured: filters.featured,
      status: filters.status,
      style: filters.style,
      discount: filters.discount,
      sortBy,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    [
      searchQuery,
      filters.material,
      filters.artist,
      filters.availability,
      filters.featured,
      filters.status,
      filters.style,
      filters.discount,
      sortBy,
      currentPage,
    ]
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
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 min — no refetch on minimize/restore
    gcTime: 10 * 60 * 1000, // 10 min cache (React Query v5; was cacheTime)
    keepPreviousData: true,
    enabled: !authLoading,
    onError: (err) => {
      if (!hasLoggedError.current) {
        trackError(
          getFriendlyErrorMessage(err) ||
            "There was an issue fetching the gallery.",
          "Gallery"
        );
        hasLoggedError.current = true;
      }
    },
  });
  useEffect(() => {
    if (!error) {
      hasLoggedError.current = false;
    }
  }, [error]);
  // Reset pagination when filters change (using stable queryKey)
  const prevQueryKey = useRef(queryKey);
  useEffect(() => {
    if (initialized.current && prevQueryKey.current !== queryKey) {

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

  // Memoize navigate and location.search using refs for use inside debounce
  const navigateRef = useRef(navigate);
  const locationSearchRef = useRef(location.search);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    locationSearchRef.current = location.search;
  }, [location.search]);

  // Update URL parameters with debouncing to prevent excessive navigation
  const updateURL = useMemo(
    () =>
      debounce((searchQuery, filters, sortBy) => {
        const params = new URLSearchParams();
        if (searchQuery && searchQuery.trim())
          params.set("searchQuery", searchQuery);
        
        const setArrayParam = (key, arr) => {
          if (arr && arr.length > 0 && !arr.includes("all")) {
            params.set(key, arr.join(","));
          }
        };

        setArrayParam("material", filters.material);
        setArrayParam("artist", filters.artist);
        setArrayParam("availability", filters.availability);
        setArrayParam("featured", filters.featured);
        setArrayParam("discount", filters.discount);
        
        if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);

        const newSearch = params.toString();
        const currentSearch = locationSearchRef.current.slice(1);

        if (newSearch !== currentSearch) {
          navigateRef.current(`?${newSearch}`, { replace: true });
        }
      }, 300),
    [] // Only create once
  );

  useEffect(() => {
    updateURL(searchQuery, filters, sortBy);
  }, [searchQuery, filters, sortBy, updateURL]);

  // Extract materials and artists from all fetched artworks more efficiently
  useEffect(() => {
    if (allArtworks && Array.isArray(allArtworks)) {
      // Extract unique materials
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

      // Extract unique artists
      const backendArtists = allArtworks
        .map((art) => art.artistName)
        .filter(Boolean);
      const artworkArtists = allArtworks
        .map((art) => art.artistName || art.artist)
        .filter(Boolean);
      // Merge and deduplicate by artist name
      const uniqueArtists = Array.from(
        new Set([...backendArtists, ...artworkArtists])
      );
      setArtists(uniqueArtists);
    }
  }, [allArtworks]);

  // Load more function with better state management
  const loadMore = useCallback(() => {


    if (!isFetching && hasMore) {

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

    setFilters((prev) => ({ ...prev, [filterType]: value }));
    trackUserAction("gallery_filter", { type: filterType, value });
  }, []);

  const handleSortChange = useCallback((value) => {

    setSortBy(value);
    trackUserAction("gallery_sort", { sort_by: value });
  }, []);

  const handleResetAllFilters = useCallback(() => {
    debouncedSearch.cancel(); // Cancel any pending search first
    setCurrentPage(1); // Reset page before clearing artworks
    setAllArtworks([]);
    setHasMore(true);
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
    setSortBy("newest");
    setFilters({
      material: [],
      artist: [],
      availability: [],
      featured: [],
      status: [],
      style: [], // Reset style as well
      discount: [],
    });
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Manual refetch for debugging
  const handleManualRefetch = useCallback(() => {

    refetch();
  }, [refetch]);



  // Auto-apply artist filter for logged-in artists only once
  const didAutoApplyArtistFilter = useRef(false);
  useEffect(() => {
    if (
      isArtistSession &&
      user &&
      filters.artist.length === 0 &&
      !didAutoApplyArtistFilter.current
    ) {
      setFilters((prev) => ({ ...prev, artist: [user.id] }));
      
      // Optimistically add logged-in artist to results to avoid "Loading..."
      setArtistResults((prev) => {
        const alreadyExists = prev.some((a) => a.id === user.id);
        if (alreadyExists) return prev;
        
        return [
          ...prev,
          {
            id: user.id,
            // Keep the optimistic label aligned with the public artist filter display.
            label: user.artistName || "Artist",
          },
        ];
      });

      didAutoApplyArtistFilter.current = true;
    }
    // Reset the flag if user logs out or changes
    if ((!isArtistSession || !user) && didAutoApplyArtistFilter.current) {
      didAutoApplyArtistFilter.current = false;
    }
  }, [isArtistSession, user, filters.artist]);

  // --- Artists Filter State ---
  const [artistSearch, setArtistSearch] = useState("");
  const [artistPage, setArtistPage] = useState(1);
  const [artistResults, setArtistResults] = useState([]);
  const prevArtistSearch = useRef("");

  // Clear results only when search string changes
  useEffect(() => {
    if (prevArtistSearch.current !== artistSearch) {
      setArtistResults([]);
      setArtistPage(1);
      prevArtistSearch.current = artistSearch;
    }
    // eslint-disable-next-line
  }, [artistSearch]);

  // Check if we need to load artist data for the active filter
  useEffect(() => {
    if (filters.artist.length > 0 && !shouldLoadArtistForFilter) {
      const allExist = filters.artist.every((id) =>
        artistResults.some((artist) => artist.id === id)
      );

      if (!allExist) {
        setShouldLoadArtistForFilter(true);
      }
    }
  }, [filters.artist, artistResults, shouldLoadArtistForFilter]);

  // Add a separate query to get artist details when filter is applied
  const { data: artistFilterData, isLoading: isArtistFilterLoading } =
    useArtistsSearch(
      {
        ids: filters.artist,
        limit: Math.max(filters.artist.length, 1),
        page: 1,
      },
      {
        enabled: shouldLoadArtistForFilter && filters.artist.length > 0,
      }
    );

  // Handle artist filter data
  useEffect(() => {
    if (artistFilterData && shouldLoadArtistForFilter) {
      filters.artist.forEach((id) => {
        const foundArtist = artistFilterData.artists.find((a) => a.id === id);
        if (foundArtist) {
          const artistWithLabel = {
            id: foundArtist.id,
            label: foundArtist.email
              ? `${foundArtist.artistName} (${foundArtist.email})`
              : foundArtist.artistName,
          };
          setArtistResults((prev) => {
            const exists = prev.some((a) => a.id === artistWithLabel.id);
            if (!exists) {
              return [...prev, artistWithLabel];
            }
            return prev;
          });
        }
      });
      setShouldLoadArtistForFilter(false);
    }
  }, [artistFilterData, shouldLoadArtistForFilter, filters.artist]);

  // Append new items or replace only on first page
  const {
    data: artistData,
    isLoading: isArtistsLoading,
    isFetching: isArtistsFetching,
  } = useArtistsSearch(
    {
      search: artistSearch,
      limit: 12,
      page: artistPage,
    },
    {
      enabled: openedDropdowns.artist, // Only fetch when artist dropdown has been opened
    }
  );

  useEffect(() => {
    if (artistData) {
      const newArtists = artistData.artists.map((a) => ({
        id: a.id,
        label: a.email ? `${a.artistName} (${a.email})` : a.artistName,
      }));
      setArtistResults((prev) => {
        if (artistPage === 1) return newArtists;
        const existingIds = new Set(prev.map((a) => a.id));
        const uniqueNew = newArtists.filter((a) => !existingIds.has(a.id));
        return [...prev, ...uniqueNew];
      });

      // If we were loading artist data for the filter, mark it as done
      if (shouldLoadArtistForFilter) {
        setShouldLoadArtistForFilter(false);
      }
    }
    // eslint-disable-next-line
  }, [artistData, artistPage, shouldLoadArtistForFilter]);

  const hasMoreArtists = artistData?.hasMore;
  const handleArtistSearch = (q) => {
    if (q !== artistSearch) {
      setArtistSearch(q);
      setArtistPage(1);
    }
  };
  const loadMoreArtists = () => {
    if (hasMoreArtists && !isArtistsFetching) setArtistPage((p) => p + 1);
  };

  // --- Materials Filter State ---
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialPage, setMaterialPage] = useState(1);
  const [materialResults, setMaterialResults] = useState([]);
  const prevMaterialSearch = useRef("");
  // Clear results only when search string changes
  useEffect(() => {
    if (prevMaterialSearch.current !== materialSearch) {
      setMaterialResults([]);
      setMaterialPage(1);
      prevMaterialSearch.current = materialSearch;
    }
    // eslint-disable-next-line
  }, [materialSearch]);
  // Append new items or replace only on first page
  const {
    data: materialData,
    isLoading: isMaterialsLoading,
    isFetching: isMaterialsFetching,
  } = useMaterialsSearch(
    {
      search: materialSearch,
      limit: 12,
      page: materialPage,
    },
    {
      enabled: openedDropdowns.material, // Only fetch when material dropdown has been opened
    }
  );
  useEffect(() => {
    if (materialData) {
      const newMaterials = materialData.items.map((m) => ({
        id: m,
        label: m,
      }));
      setMaterialResults((prev) => {
        if (materialPage === 1) return newMaterials;
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNew = newMaterials.filter((m) => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });
    }
    // eslint-disable-next-line
  }, [materialData, materialPage]);
  const hasMoreMaterials = materialData?.hasMore;
  const handleMaterialSearch = (q) => {
    if (q !== materialSearch) {
      setMaterialSearch(q);
      setMaterialPage(1);
    }
  };
  const loadMoreMaterials = () => {
    if (hasMoreMaterials && !isMaterialsFetching) {
      setMaterialPage((p) => p + 1);
    }
  };

  // --- Styles Filter State ---
  const [styleSearch, setStyleSearch] = useState("");
  const [stylePage, setStylePage] = useState(1);
  const [styleResults, setStyleResults] = useState([]);
  const prevStyleSearch = useRef("");
  // Clear results only when search string changes
  useEffect(() => {
    if (prevStyleSearch.current !== styleSearch) {
      setStyleResults([]);
      setStylePage(1);
      prevStyleSearch.current = styleSearch;
    }
    // eslint-disable-next-line
  }, [styleSearch]);
  // Append new items or replace only on first page
  const {
    data: styleData,
    isLoading: isStylesLoading,
    isFetching: isStylesFetching,
  } = useStylesSearch(
    {
      search: styleSearch,
      limit: 12,
      page: stylePage,
    },
    {
      enabled: openedDropdowns.style, // Only fetch when style dropdown has been opened
    }
  );
  useEffect(() => {
    if (styleData) {
      const newStyles = styleData.items.map((s) => ({
        id: s,
        label: s,
      }));
      setStyleResults((prev) => {
        if (stylePage === 1) return newStyles;
        const existingIds = new Set(prev.map((s) => s.id));
        const uniqueNew = newStyles.filter((s) => !existingIds.has(s.id));
        return [...prev, ...uniqueNew];
      });
    }
    // eslint-disable-next-line
  }, [styleData, stylePage]);
  const hasMoreStyles = styleData?.hasMore;
  const handleStyleSearch = (q) => {
    if (q !== styleSearch) {
      setStyleSearch(q);
      setStylePage(1);
    }
  };
  const loadMoreStyles = () => {
    if (hasMoreStyles && !isStylesFetching) {
      setStylePage((p) => p + 1);
    }
  };

  // Invalidate queries when user/auth state changes
  useEffect(() => {
    // Only run if user ID has changed (login/logout/switch user)
    if (prevUserRef.current !== user?.id) {
      prevUserRef.current = user?.id;

      // Reset queries to clear cache and trigger loading state
      utils.user.listArtistsPublic.reset();
      utils.artwork.getMaterials.reset();
      utils.artwork.getStyles.reset();
      // Also reset main artwork list
      utils.artwork.getAllArtworks.reset();
      
      // Reset dropdown states to ensure fresh data and valid pagination
      setArtistResults([]);
      setArtistPage(1);
      setMaterialResults([]);
      setMaterialPage(1);
      setStyleResults([]);
      setStylePage(1);
      
      // Reset main gallery pagination
      setCurrentPage(1);
      setAllArtworks([]);
      setHasMore(true);
    }
  }, [user?.id, utils]);



  // Functions to mark dropdowns as opened (for lazy loading)
  const markDropdownOpened = useCallback((dropdownType) => {
    setOpenedDropdowns((prev) => ({
      ...prev,
      [dropdownType]: true,
    }));
  }, []);

  // Helper function to get active filters for display
  const getActiveFilters = useCallback(() => {
    const active = [];

    if (searchQuery && searchQuery.trim()) {
      active.push({
        type: "search",
        label: `Search: "${searchQuery}"`,
        value: searchQuery,
        onRemove: () => clearSearch(),
      });
    }

    if (filters.material && filters.material.length > 0) {
      active.push({
        type: "material",
        label: `Material: ${filters.material.join(", ")}`,
        value: filters.material,
        onRemove: () => handleFilterChange("material", []),
      });
    }

    if (filters.artist && filters.artist.length > 0) {
      const labels = filters.artist.map((id) => {
        const found = artistResults.find((a) => a.id === id);
        return found ? found.label.split(" (")[0] : id;
      });

      active.push({
        type: "artist",
        label: `Artist: ${labels.join(", ")}`,
        value: filters.artist,
        onRemove: () => handleFilterChange("artist", []),
      });
    }

    if (filters.availability && filters.availability.length > 0) {
      active.push({
        type: "availability",
        label: `Availability: ${filters.availability.join(", ")}`,
        value: filters.availability,
        onRemove: () => handleFilterChange("availability", []),
      });
    }

    if (filters.featured && filters.featured.length > 0) {
      active.push({
        type: "featured",
        label: `Featured: ${filters.featured.includes("featured")
          ? "Yes"
          : "No"}`,
        value: filters.featured,
        onRemove: () => handleFilterChange("featured", []),
      });
    }

    if (filters.discount && filters.discount.length > 0) {
      active.push({
        type: "discount",
        label: `Discount: ${filters.discount.includes("discounted")
          ? "Yes"
          : "No"}`,
        value: filters.discount,
        onRemove: () => handleFilterChange("discount", []),
      });
    }

    if (filters.status && filters.status.length > 0) {
      active.push({
        type: "status",
        label: `Status: ${filters.status.join(", ")}`,
        value: filters.status,
        onRemove: () => handleFilterChange("status", []),
      });
    }

    if (sortBy && sortBy !== "newest") {
      const sortLabels = {
        oldest: "Oldest First",
        "price-high": "Price: High to Low",
        "price-low": "Price: Low to High",
        "discount-high": "Discount: High to Low",
        "discount-low": "Discount: Low to High",
        "year-new": "Year: Newest First",
        "year-old": "Year: Oldest First",
        "artist-az": "Artist: A-Z",
        "artist-za": "Artist: Z-A",
      };

      active.push({
        type: "sort",
        label: `Sort: ${sortLabels[sortBy] || sortBy}`,
        value: sortBy,
        onRemove: () => handleSortChange("newest"),
      });
    }

    return active;
  }, [
    searchQuery,
    filters.material,
    filters.artist,
    filters.availability,
    filters.featured,
    filters.status,
    filters.discount,
    sortBy,
    clearSearch,
    handleFilterChange,
    handleSortChange,
    artistResults,
  ]);


  return {
    // State
    sortBy,
    filters,
    searchInput,
    searchQuery,
    isSearching,
    materials,
    artists, // Added artists to return
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
    getActiveFilters, // Added helper function

    // Replace materials/artists with new paginated/searchable state
    artists: Array.isArray(artistResults) ? artistResults : [],
    materials: Array.isArray(materialResults) ? materialResults : [],
    styles: Array.isArray(styleResults) ? styleResults : [],
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

    // New state for opened dropdowns
    openedDropdowns,
    setOpenedDropdowns,

    // New functions for lazy loading
    markDropdownOpened,
  };
}




