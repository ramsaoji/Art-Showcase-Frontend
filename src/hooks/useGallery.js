import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { trpc } from "../utils/trpc";
import {
  trackArtworkInteraction,
  trackUserAction,
} from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import {
  useArtistsSearch,
  useMaterialsSearch,
  useStylesSearch,
} from "../utils/trpc";

export default function useGallery() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const { isArtist, user, loading: authLoading } = useAuth();

  // State management
  const [sortBy, setSortBy] = useState(() => {
    return new URLSearchParams(location.search).get("sortBy") || "newest";
  });

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      material: params.get("material") || "all",
      artist: params.get("artist") || "all",
      availability: params.get("availability") || "all",
      featured: params.get("featured") || "all",
      status: params.get("status") || "all",
      style: params.get("style") || "all", // Ensure style is always present
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
      material: filters.material,
      artist: filters.artist, // Added artist to query key
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
      artist: filters.artist, // Added artist to query input
      availability: filters.availability,
      featured: filters.featured,
      status: filters.status, // Ensure status is sent to backend
      style: filters.style, // <-- add style to query input
      sortBy,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    [
      searchQuery.trim(),
      filters.material,
      filters.artist,
      filters.availability,
      filters.featured,
      filters.status,
      filters.style,
      sortBy,
      currentPage,
      ITEMS_PER_PAGE,
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
    staleTime: 30000,
    cacheTime: 300000,
    keepPreviousData: true,
    enabled: !authLoading, // Only enable when auth is not loading
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
        if (filters.material && filters.material !== "all")
          params.set("material", filters.material);
        if (filters.artist && filters.artist !== "all")
          params.set("artist", filters.artist); // Added artist to URL params
        if (filters.availability && filters.availability !== "all")
          params.set("availability", filters.availability);
        if (filters.featured && filters.featured !== "all")
          params.set("featured", filters.featured);
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
    debouncedSearch.cancel(); // Cancel any pending search first
    setCurrentPage(1); // Reset page before clearing artworks
    setAllArtworks([]);
    setHasMore(true);
    setSearchInput("");
    setSearchQuery("");
    setIsSearching(false);
    setSortBy("newest");
    setFilters({
      material: "all",
      artist: "all",
      availability: "all",
      featured: "all",
      status: "all",
      style: "all", // Reset style as well
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
    console.log("Manual refetch triggered");
    refetch();
  }, [refetch]);

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

    if (filters.material && filters.material !== "all") {
      active.push({
        type: "material",
        label: `Material: ${filters.material}`,
        value: filters.material,
        onRemove: () => handleFilterChange("material", "all"),
      });
    }

    if (filters.artist && filters.artist !== "all") {
      const selectedArtist = artists.find((a) => a.id === filters.artist);
      active.push({
        type: "artist",
        label: `Artist: ${
          selectedArtist ? selectedArtist.label : filters.artist
        }`,
        value: filters.artist,
        onRemove: () => handleFilterChange("artist", "all"),
      });
    }

    if (filters.availability && filters.availability !== "all") {
      active.push({
        type: "availability",
        label: `Availability: ${filters.availability}`,
        value: filters.availability,
        onRemove: () => handleFilterChange("availability", "all"),
      });
    }

    if (filters.featured && filters.featured !== "all") {
      active.push({
        type: "featured",
        label: `Featured: ${filters.featured === "featured" ? "Yes" : "No"}`,
        value: filters.featured,
        onRemove: () => handleFilterChange("featured", "all"),
      });
    }

    if (filters.status && filters.status !== "all") {
      active.push({
        type: "status",
        label: `Status: ${
          filters.status === "ACTIVE"
            ? "Active"
            : filters.status === "INACTIVE"
            ? "Inactive"
            : filters.status === "EXPIRED"
            ? "Expired"
            : filters.status
        }`,
        value: filters.status,
        onRemove: () => handleFilterChange("status", "all"),
      });
    }

    if (sortBy && sortBy !== "newest") {
      const sortLabels = {
        oldest: "Oldest First",
        "price-high": "Price: High to Low",
        "price-low": "Price: Low to High",
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
    filters,
    sortBy,
    clearSearch,
    handleFilterChange,
    handleSortChange,
    artists,
  ]);

  // Auto-apply artist filter for logged-in artists only once
  const didAutoApplyArtistFilter = useRef(false);
  useEffect(() => {
    if (
      isArtist &&
      user &&
      filters.artist === "all" &&
      !didAutoApplyArtistFilter.current
    ) {
      setFilters((prev) => ({ ...prev, artist: user.id }));
      didAutoApplyArtistFilter.current = true;
    }
    // Reset the flag if user logs out or changes
    if ((!isArtist || !user) && didAutoApplyArtistFilter.current) {
      didAutoApplyArtistFilter.current = false;
    }
  }, [isArtist, user, filters.artist]);

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
    if (filters.artist !== "all" && !shouldLoadArtistForFilter) {
      // Check if the artist is already in our results
      const artistExists = artistResults.some(
        (artist) => artist.id === filters.artist
      );
      if (!artistExists) {
        setShouldLoadArtistForFilter(true);
        // Mark artist dropdown as opened to enable the query
        setOpenedDropdowns((prev) => ({ ...prev, artist: true }));
        // Set a search query to find this specific artist
        // We'll need to get the artist name from the backend or use a different approach
        // For now, let's try to load all artists and find the one we need
      }
    }
  }, [filters.artist, artistResults, shouldLoadArtistForFilter]);

  // Add a separate query to get artist details when filter is applied
  const { data: artistFilterData, isLoading: isArtistFilterLoading } =
    useArtistsSearch(
      {
        search: "", // Empty search to get all artists
        limit: 50, // Higher limit to find the specific artist
        page: 1,
      },
      {
        enabled: shouldLoadArtistForFilter && openedDropdowns.artist,
      }
    );

  // Handle artist filter data
  useEffect(() => {
    if (artistFilterData && shouldLoadArtistForFilter) {
      const foundArtist = artistFilterData.artists.find(
        (a) => a.id === filters.artist
      );
      if (foundArtist) {
        const artistWithLabel = {
          id: foundArtist.id,
          label: `${foundArtist.artistName} (${foundArtist.email})`,
        };
        // Add to artist results if not already present
        setArtistResults((prev) => {
          const exists = prev.some((a) => a.id === artistWithLabel.id);
          if (!exists) {
            return [...prev, artistWithLabel];
          }
          return prev;
        });
      }
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
        label: `${a.artistName} (${a.email})`,
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

  // Functions to handle filter section expansion
  const expandFilter = useCallback((filterType) => {
    setOpenedDropdowns((prev) => ({
      ...prev,
      [filterType]: true,
    }));
  }, []);

  const collapseFilter = useCallback((filterType) => {
    setOpenedDropdowns((prev) => ({
      ...prev,
      [filterType]: false,
    }));
  }, []);

  const toggleFilter = useCallback((filterType) => {
    setOpenedDropdowns((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  }, []);

  // Functions to mark dropdowns as opened (for lazy loading)
  const markDropdownOpened = useCallback((dropdownType) => {
    setOpenedDropdowns((prev) => ({
      ...prev,
      [dropdownType]: true,
    }));
  }, []);

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
