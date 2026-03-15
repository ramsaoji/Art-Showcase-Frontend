import { useState, useEffect, useRef, useCallback } from "react";
import FunnelIcon from "@heroicons/react/24/outline/FunnelIcon";
import { LayoutGrid, AppWindow } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useScrollLock from "@/hooks/useScrollLock";
import { PERMISSIONS } from "@/lib/rbac";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Tooltip from "@/components/common/Tooltip";
import SearchableFilterSection from "./components/SearchableFilterSection";
import {
  SORT_OPTIONS,
  FEATURED_OPTIONS,
  DISCOUNT_OPTIONS,
  STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  maskEmailInLabel,
} from "./utils/filterUtils";

/**
 * GalleryFilters — Gallery filter + sort bar.
 * Renders a mobile bottom-sheet (shadcn Dialog) and desktop dropdown menus
 * for sorting, filtering by featured status, active status, availability,
 * artist, material, and style.
 *
 * @param {Object} props.filters - Current filter state object.
 * @param {string} props.sortBy - Current sort key.
 * @param {Array} [props.materials=[]] - Material filter options.
 * @param {Array} [props.artists=[]] - Artist filter options.
 * @param {Array} [props.styles=[]] - Style filter options.
 * @param {Function} props.handleFilterChange - Called with (key, values) on filter change.
 * @param {Function} props.handleSortChange - Called with sort value when sort changes.
 * @param {Function} props.handleResetAllFilters - Resets all active filters.
 * @param {boolean} props.isMobileFiltersOpen - Controls mobile bottom-sheet visibility.
 * @param {Function} props.setIsMobileFiltersOpen - Setter for mobile sheet open state.
 * @param {boolean} props.isArtistsLoading - True while artist options are loading.
 * @param {boolean} props.isMaterialsLoading - True while material options are loading.
 * @param {boolean} props.isStylesLoading - True while style options are loading.
 * @param {boolean} props.hasMoreArtists - Whether more artist options can be loaded.
 * @param {boolean} props.hasMoreMaterials - Whether more material options can be loaded.
 * @param {boolean} props.hasMoreStyles - Whether more style options can be loaded.
 * @param {Function} props.handleArtistSearch - Called with query string for artist search.
 * @param {Function} props.handleMaterialSearch - Called with query string for material search.
 * @param {Function} props.handleStyleSearch - Called with query string for style search.
 * @param {Function} props.loadMoreArtists - Loads the next page of artist options.
 * @param {Function} props.loadMoreMaterials - Loads the next page of material options.
 * @param {Function} props.loadMoreStyles - Loads the next page of style options.
 * @param {string} [props.artistSearch=""] - Controlled artist search query.
 * @param {string} [props.materialSearch=""] - Controlled material search query.
 * @param {string} [props.styleSearch=""] - Controlled style search query.
 * @param {Function} props.markDropdownOpened - Signals that a dropdown has been opened (for lazy load).
 * @param {string} props.layoutType - Current layout type ('grid' or 'masonry').
 * @param {Function} props.setLayoutType - Setter for layout type.
 * @param {boolean} [props.disabled=false] - Disables filter/search interactions while loading.
 */
export default function GalleryFilters({
  filters,
  sortBy,
  materials = [],
  artists = [],
  styles = [],
  handleFilterChange,
  handleSortChange,
  handleResetAllFilters,
  isMobileFiltersOpen,
  setIsMobileFiltersOpen,
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
  artistSearch = "",
  materialSearch = "",
  styleSearch = "",
  markDropdownOpened,
  layoutType,
  setLayoutType,
  disabled = false,
}) {
  const { can, user } = useAuth();
  useScrollLock(isMobileFiltersOpen);
  const canAccessStatusFilters =
    can(PERMISSIONS.ARTWORK_READ_ANY) || can(PERMISSIONS.ARTWORK_READ_OWN);
  const canViewArtistEmails =
    can(PERMISSIONS.ARTIST_READ_ANY) || can(PERMISSIONS.USER_READ_ANY);

  // Desktop dropdown open states
  const [openDropdown, setOpenDropdown] = useState(null); // "filters" | "artist" | "material" | "style" | "sort"

  // Refs for click-outside detection on desktop dropdowns
  const filtersDropdownRef = useRef(null);
  const artistDropdownRef = useRef(null);
  const materialDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const [tempFiltersFeatured, setTempFiltersFeatured] = useState([]);
  const [tempFiltersDiscount, setTempFiltersDiscount] = useState([]);
  const [tempFiltersStatus, setTempFiltersStatus] = useState([]);
  const [tempFiltersAvailability, setTempFiltersAvailability] = useState([]);

  const syncTempFiltersFromProps = useCallback(() => {
    setTempFiltersFeatured(Array.isArray(filters.featured) ? [...filters.featured] : []);
    setTempFiltersDiscount(Array.isArray(filters.discount) ? [...filters.discount] : []);
    setTempFiltersStatus(Array.isArray(filters.status) ? [...filters.status] : []);
    setTempFiltersAvailability(Array.isArray(filters.availability) ? [...filters.availability] : []);
  }, [filters.featured, filters.discount, filters.status, filters.availability]);

  const applyFiltersPopup = useCallback(() => {
    handleFilterChange("featured", tempFiltersFeatured);
    handleFilterChange("discount", tempFiltersDiscount);
    handleFilterChange("status", tempFiltersStatus);
    handleFilterChange("availability", tempFiltersAvailability);
    setOpenDropdown(null);
  }, [handleFilterChange, tempFiltersFeatured, tempFiltersDiscount, tempFiltersStatus, tempFiltersAvailability]);

  // Close any open dropdown when clicking outside its ref
  useEffect(() => {
    if (!openDropdown) return;
    const refMap = {
      filters: filtersDropdownRef,
      artist: artistDropdownRef,
      material: materialDropdownRef,
      style: styleDropdownRef,
      sort: sortDropdownRef,
    };
    const activeRef = refMap[openDropdown];
    function handleClickOutside(e) {
      if (activeRef?.current && !activeRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = useCallback((name, onOpen) => {
    setOpenDropdown((prev) => {
      if (prev === name) return null;
      if (onOpen) onOpen();
      return name;
    });
  }, []);

  // Returns true if an artist option's full email should be shown
  const shouldShowFullEmail = useCallback((artistId) => {
    if (canViewArtistEmails) return true;
    if (user && artistId && user.id === artistId) return true;
    return false;
  }, [canViewArtistEmails, user]);

  const toggleFilterValue = (currentValues, value) => {
    if (value === "all") return [];
    if (!Array.isArray(currentValues)) return [value];
    if (currentValues.includes(value)) return currentValues.filter((v) => v !== value);
    return [...currentValues, value];
  };

  const isFilterSelected = (currentValues, value) => {
    if (value === "all") return !currentValues || currentValues.length === 0;
    return Array.isArray(currentValues) && currentValues.includes(value);
  };

  return (
    <div className={`mb-12 ${disabled ? "opacity-60 pointer-events-none" : ""}`} aria-disabled={disabled}>
      {/* Mobile Actions: Filter Button & View Toggle */}
      <div className="md:hidden flex items-center gap-3 mb-4">
        {/* Layout Toggle */}
        <div className="flex items-center p-1 bg-white border border-gray-200 rounded-full shadow-sm h-[48px]">
          <button
            type="button"
            onClick={() => setLayoutType('grid')}
            className={`p-2 h-full rounded-full transition-colors flex items-center justify-center aspect-square ${
              layoutType === 'grid'
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutType('masonry')}
            className={`p-2 h-full rounded-full transition-colors flex items-center justify-center aspect-square ${
              layoutType === 'masonry'
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            title="Masonry View"
          >
            <AppWindow className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters & Sort
        </button>
      </div>

      {/* Mobile Filters — shadcn Dialog (bottom sheet) */}
      <Dialog open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <DialogContent
          className="p-0 overflow-hidden flex flex-col border-white/20 bg-white rounded-t-3xl shadow-2xl fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 max-w-full w-full rounded-b-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
          style={{ height: "calc(100dvh - 5rem)" }}
        >
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between px-4 py-4 border-b border-gray-200 space-y-0">
            <DialogTitle className="text-lg font-sans font-semibold text-gray-900">
              Filters & Sort
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 py-6 pr-1 overflow-y-auto px-4">
            {/* Sort Options */}
            <div className="mb-8">
              <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">Sort by</h3>
              <div className="space-y-3">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                      sortBy === option.value
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Filter */}
            <div className="mb-8">
              <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">Featured Status</h3>
              <div className="space-y-3">
                {FEATURED_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                  const active = isFilterSelected(filters.featured, option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange("featured", toggleFilterValue(filters.featured, option.value))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                        active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <CheckboxIcon active={active} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount Filter */}
            <div className="mb-8">
              <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">Discount Status</h3>
              <div className="space-y-3">
                {DISCOUNT_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                  const active = isFilterSelected(filters.discount, option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange("discount", toggleFilterValue(filters.discount, option.value))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                        active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <CheckboxIcon active={active} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Status Filter */}
            {canAccessStatusFilters ? (
              <div className="mb-8">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">Active Status</h3>
                <div className="space-y-3">
                  {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(filters.status, option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange("status", toggleFilterValue(filters.status, option.value))}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                          active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <CheckboxIcon active={active} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Artist Filter */}
            <div className="mb-8">
              <SearchableFilterSection
                title="Artist"
                options={artists}
                selectedValues={filters.artist}
                onApply={(values) => handleFilterChange("artist", values)}
                allLabel="All Artists"
                searchPlaceholder="Search artists..."
                searchQuery={artistSearch}
                onSearch={(query) => { markDropdownOpened("artist"); handleArtistSearch(query); }}
                isLoading={isArtistsLoading}
                hasMore={hasMoreArtists}
                onLoadMore={loadMoreArtists}
                shouldShowFullEmail={shouldShowFullEmail}
                showFooter={false}
                onChange={(values) => handleFilterChange("artist", values)}
                loadingMessage="Loading artists..."
                disabled={disabled}
              />
            </div>

            {/* Material Filter */}
            <div className="mb-8">
              <SearchableFilterSection
                title="Material"
                options={materials}
                selectedValues={filters.material}
                onApply={(values) => handleFilterChange("material", values)}
                allLabel="All Materials"
                searchPlaceholder="Search materials..."
                searchQuery={materialSearch}
                onSearch={(query) => { markDropdownOpened("material"); handleMaterialSearch(query); }}
                isLoading={isMaterialsLoading}
                hasMore={hasMoreMaterials}
                onLoadMore={loadMoreMaterials}
                showFooter={false}
                onChange={(values) => handleFilterChange("material", values)}
                loadingMessage="Loading materials..."
                disabled={disabled}
              />
            </div>

            {/* Style Filter */}
            <div className="mb-8">
              <SearchableFilterSection
                title="Style"
                options={styles}
                selectedValues={filters.style}
                onApply={(values) => handleFilterChange("style", values)}
                allLabel="All Styles"
                searchPlaceholder="Search styles..."
                searchQuery={styleSearch}
                onSearch={(query) => { markDropdownOpened("style"); handleStyleSearch(query); }}
                isLoading={isStylesLoading}
                hasMore={hasMoreStyles}
                onLoadMore={loadMoreStyles}
                showFooter={false}
                onChange={(values) => handleFilterChange("style", values)}
                loadingMessage="Loading styles..."
                disabled={disabled}
              />
            </div>

            {/* Availability Filter */}
            <div className="mb-8">
              <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-3">
                {AVAILABILITY_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                  const active = isFilterSelected(filters.availability, option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange("availability", toggleFilterValue(filters.availability, option.value))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                        active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <CheckboxIcon active={active} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 px-4 pb-4 border-t border-gray-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                handleResetAllFilters();
                setIsMobileFiltersOpen(false);
              }}
              className="px-6 py-3 rounded-full text-sm font-sans font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 xl:flex-1">
        {/* Filters Dropdown */}
        <div className="relative shrink-0" ref={filtersDropdownRef}>
          <button
            type="button"
            onClick={() => toggleDropdown("filters", syncTempFiltersFromProps)}
            className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            aria-expanded={openDropdown === "filters"}
          >
            <span className="inline-flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              <span>Filters</span>
            </span>
            <span className="ml-3 inline-flex items-center">
              {(filters.featured?.length > 0 || filters.discount?.length > 0 || filters.status?.length > 0 || filters.availability?.length > 0) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                  {["featured", "discount", "status", "availability"].filter((k) => filters[k]?.length > 0).length}
                </span>
              )}
              <ChevronIcon className={openDropdown === "filters" ? "rotate-180" : ""} />
            </span>
          </button>
          {openDropdown === "filters" && (
            <div className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 p-4">
              {/* Featured Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">Featured Status</h3>
                <div className="space-y-1">
                  {FEATURED_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(tempFiltersFeatured, option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTempFiltersFeatured(toggleFilterValue(tempFiltersFeatured, option.value))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                          active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <CheckboxIcon active={active} small />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Discount Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 my-2">Discount Status</h3>
                <div className="space-y-1">
                  {DISCOUNT_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(tempFiltersDiscount, option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTempFiltersDiscount(toggleFilterValue(tempFiltersDiscount, option.value))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                          active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <CheckboxIcon active={active} small />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Active Status Filter Section */}
              {canAccessStatusFilters ? (
                <div className="mb-4">
                  <h3 className="text-sm font-sans font-semibold text-gray-900 my-2">Active Status</h3>
                  <div className="space-y-1">
                    {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                      const active = isFilterSelected(tempFiltersStatus, option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => setTempFiltersStatus(toggleFilterValue(tempFiltersStatus, option.value))}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                            active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <CheckboxIcon active={active} small />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {/* Availability Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 my-2">Availability</h3>
                <div className="space-y-1">
                  {AVAILABILITY_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(tempFiltersAvailability, option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTempFiltersAvailability(toggleFilterValue(tempFiltersAvailability, option.value))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                          active ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <CheckboxIcon active={active} small />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Footer: Reset + Apply */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setTempFiltersFeatured([]); setTempFiltersDiscount([]); setTempFiltersStatus([]); setTempFiltersAvailability([]); handleFilterChange("featured", []); handleFilterChange("discount", []); handleFilterChange("status", []); handleFilterChange("availability", []); setOpenDropdown(null); }}
                    className="px-4 py-2 rounded-lg text-sm font-sans font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applyFiltersPopup}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow transition-all"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Artist Dropdown */}
        {Array.isArray(artists) && (
          <div className="relative shrink-0" ref={artistDropdownRef}>
            <button
              type="button"
              onClick={() => toggleDropdown("artist", () => markDropdownOpened("artist"))}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={openDropdown === "artist"}
            >
              <span>Artist</span>
              <span className="ml-3 inline-flex items-center">
                {filters.artist?.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                    {filters.artist.length}
                  </span>
                )}
                <ChevronIcon className={openDropdown === "artist" ? "rotate-180" : ""} />
              </span>
            </button>
            {openDropdown === "artist" && (
              <div className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Artist"
                  options={artists}
                  selectedValues={filters.artist}
                  onApply={(values) => { handleFilterChange("artist", values); setOpenDropdown(null); }}
                  allLabel="All Artists"
                  searchPlaceholder="Search artists..."
                  searchQuery={artistSearch}
                  onSearch={(query) => { markDropdownOpened("artist"); handleArtistSearch(query); }}
                  isLoading={isArtistsLoading}
                  hasMore={hasMoreArtists}
                  onLoadMore={loadMoreArtists}
                  shouldShowFullEmail={shouldShowFullEmail}
                  renderFooterWrapper={(footer) => <div onClick={() => setOpenDropdown(null)}>{footer}</div>}
                  loadingMessage="Loading artists..."
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}

        {/* Material Dropdown */}
        {Array.isArray(materials) && (
          <div className="relative shrink-0" ref={materialDropdownRef}>
            <button
              type="button"
              onClick={() => toggleDropdown("material", () => markDropdownOpened("material"))}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={openDropdown === "material"}
            >
              <span>Material</span>
              <span className="ml-3 inline-flex items-center">
                {filters.material?.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                    {filters.material.length}
                  </span>
                )}
                <ChevronIcon className={openDropdown === "material" ? "rotate-180" : ""} />
              </span>
            </button>
            {openDropdown === "material" && (
              <div className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Material"
                  options={materials}
                  selectedValues={filters.material}
                  onApply={(values) => { handleFilterChange("material", values); setOpenDropdown(null); }}
                  allLabel="All Materials"
                  searchPlaceholder="Search materials..."
                  searchQuery={materialSearch}
                  onSearch={(query) => { markDropdownOpened("material"); handleMaterialSearch(query); }}
                  isLoading={isMaterialsLoading}
                  hasMore={hasMoreMaterials}
                  onLoadMore={loadMoreMaterials}
                  renderFooterWrapper={(footer) => <div onClick={() => setOpenDropdown(null)}>{footer}</div>}
                  loadingMessage="Loading materials..."
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}

        {/* Style Dropdown */}
        {Array.isArray(styles) && (
          <div className="relative shrink-0" ref={styleDropdownRef}>
            <button
              type="button"
              onClick={() => toggleDropdown("style", () => markDropdownOpened("style"))}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={openDropdown === "style"}
            >
              <span>Style</span>
              <span className="ml-3 inline-flex items-center">
                {filters.style?.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                    {filters.style.length}
                  </span>
                )}
                <ChevronIcon className={openDropdown === "style" ? "rotate-180" : ""} />
              </span>
            </button>
            {openDropdown === "style" && (
              <div className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Style"
                  options={styles}
                  selectedValues={filters.style}
                  onApply={(values) => { handleFilterChange("style", values); setOpenDropdown(null); }}
                  allLabel="All Styles"
                  searchPlaceholder="Search styles..."
                  searchQuery={styleSearch}
                  onSearch={(query) => { markDropdownOpened("style"); handleStyleSearch(query); }}
                  isLoading={isStylesLoading}
                  hasMore={hasMoreStyles}
                  onLoadMore={loadMoreStyles}
                  renderFooterWrapper={(footer) => <div onClick={() => setOpenDropdown(null)}>{footer}</div>}
                  loadingMessage="Loading styles..."
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}
        </div>

        {/* Layout Toggle and Sort Dropdown (right aligned) */}
        <div className="flex items-center gap-3 shrink-0 xl:ml-auto">
          {/* Layout Toggle */}
          <div className="flex items-center p-1 bg-white border border-gray-200 rounded-full shadow-sm h-10">
            <button
              type="button"
              onClick={() => setLayoutType('grid')}
              className={`p-1.5 h-full rounded-full transition-colors flex items-center justify-center aspect-square ${
                layoutType === 'grid'
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutType('masonry')}
              className={`p-1.5 h-full rounded-full transition-colors flex items-center justify-center aspect-square ${
                layoutType === 'masonry'
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title="Masonry View"
            >
              <AppWindow className="w-4 h-4" />
            </button>
          </div>

          <div className="relative h-10 shrink-0" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => toggleDropdown("sort")}
              className="inline-flex items-center h-full px-4 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={openDropdown === "sort"}
            >
              Sort by:{" "}
              {sortBy.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              <ChevronIcon className={openDropdown === "sort" ? "rotate-180" : ""} />
            </button>
            {openDropdown === "sort" && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-2 space-y-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { handleSortChange(option.value); setOpenDropdown(null); }}
                      className={`block px-4 py-2 text-sm w-full text-left font-sans hover:bg-gray-50 hover:text-indigo-600 ${
                        sortBy === option.value ? "font-medium text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {((filters.material && filters.material.length > 0) ||
        (filters.artist && filters.artist.length > 0) ||
        (filters.style && filters.style.length > 0) ||
        (filters.availability && filters.availability.length > 0) ||
        (filters.featured && filters.featured.length > 0) ||
        (filters.discount && filters.discount.length > 0) ||
        (filters.status && filters.status.length > 0)) && (
        <ActiveFilterBadges
          filters={filters}
          artists={artists}
          materials={materials}
          styles={styles}
          handleFilterChange={handleFilterChange}
          handleResetAllFilters={handleResetAllFilters}
          canViewArtistEmails={canViewArtistEmails}
          currentUser={user}
        />
      )}
    </div>
  );
}

// ─── Private sub-components ───────────────────────────────────────────────────

/**
 * ActiveFilterBadges — renders the row of active filter chips below the filter bar.
 *
 * @param {Object} props.filters - Current filter state.
 * @param {Array} props.artists - Full artist options list (for label lookup).
 * @param {Array} props.materials - Full material options list.
 * @param {Array} props.styles - Full style options list.
 * @param {Function} props.handleFilterChange - Clears a single filter group.
 * @param {Function} props.handleResetAllFilters - Clears all filters.
 */
function ActiveFilterBadges({ filters, artists, materials, styles, handleFilterChange, handleResetAllFilters, canViewArtistEmails, currentUser }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      {filters.featured && filters.featured.length > 0 && (() => {
        const n = filters.featured.length;
        const fullList = filters.featured
          .map((v) => FEATURED_OPTIONS.find((o) => o.value === v)?.label || v)
          .join(", ");
        const displayText = n === 1 ? FEATURED_OPTIONS.find((o) => o.value === filters.featured[0])?.label : `${n} selected`;
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
            <span className="mr-1 shrink-0">Featured:</span>
            {n > 1 ? (
              <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1 truncate block">{displayText}</span>
              </Tooltip>
            ) : (
              <span className="font-semibold truncate block">{displayText}</span>
            )}
            <button onClick={() => handleFilterChange("featured", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
          </span>
        );
      })()}
      {filters.discount && filters.discount.length > 0 && (() => {
        const n = filters.discount.length;
        const fullList = filters.discount
          .map((v) => DISCOUNT_OPTIONS.find((o) => o.value === v)?.label || v)
          .join(", ");
        const displayText = n === 1 ? DISCOUNT_OPTIONS.find((o) => o.value === filters.discount[0])?.label : `${n} selected`;
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
            <span className="mr-1 shrink-0">Discount:</span>
            {n > 1 ? (
              <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1 truncate block">{displayText}</span>
              </Tooltip>
            ) : (
              <span className="font-semibold truncate block">{displayText}</span>
            )}
            <button onClick={() => handleFilterChange("discount", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
          </span>
        );
      })()}
      {filters.artist && filters.artist.length > 0 && (() => {
        const n = filters.artist.length;
        const getLabel = (id) => {
          const match = artists.find((a) => a.id === id || a === id);
          const label = match ? (match.label || match) : id;
          const showFull = canViewArtistEmails || (currentUser && currentUser.id === id);
          return typeof label === "string" && /\(.+@.+\)/.test(label) && !showFull
            ? maskEmailInLabel(label)
            : label;
        };
        const labelList = filters.artist.map((id) => getLabel(id)).join(", ");
        const displayText = n === 1 ? labelList : `${n} selected`;
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
            <span className="mr-1 shrink-0">Artist:</span>
            {n > 1 ? (
              <Tooltip content={labelList} showOnlyWhenTruncated={false} contentClassName="">
                <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1 truncate block">{displayText}</span>
              </Tooltip>
            ) : (
              <span className="font-semibold truncate block">{displayText}</span>
            )}
            <button onClick={() => handleFilterChange("artist", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
          </span>
        );
      })()}
      {filters.material && filters.material.length > 0 && (() => {
        const n = filters.material.length;
        const fullList = filters.material
          .map((id) => {
            const match = materials.find((m) => m.id === id || m === id);
            return match ? (match.label || match) : id;
          })
          .join(", ");
        const displayText = n === 1 ? fullList : `${n} selected`;
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
            <span className="mr-1 shrink-0">Material:</span>
            {n > 1 ? (
              <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1 truncate block">{displayText}</span>
              </Tooltip>
            ) : (
              <span className="font-semibold truncate block">{displayText}</span>
            )}
            <button onClick={() => handleFilterChange("material", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
          </span>
        );
      })()}
      {filters.style && filters.style.length > 0 && (() => {
        const n = filters.style.length;
        const fullList = filters.style
          .map((id) => {
            const match = styles.find((s) => s.id === id || s === id);
            return match ? (match.label || match) : id;
          })
          .join(", ");
        const displayText = n === 1 ? fullList : `${n} selected`;
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
            <span className="mr-1 shrink-0">Style:</span>
            {n > 1 ? (
              <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1 truncate block">{displayText}</span>
              </Tooltip>
            ) : (
              <span className="font-semibold truncate block">{displayText}</span>
            )}
            <button onClick={() => handleFilterChange("style", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
          </span>
        );
      })()}
      {filters.availability && filters.availability.length > 0 && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
          <span className="mr-1 shrink-0">Availability:</span>
          <span className="font-semibold truncate block">
            {filters.availability.map((a) => a === "available" ? "Available" : "Sold").join(", ")}
          </span>
          <button onClick={() => handleFilterChange("availability", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
        </span>
      )}
      {filters.status && filters.status.length > 0 && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
          <span className="mr-1 shrink-0">Status:</span>
          <span className="font-semibold truncate block">
            {filters.status.map((s) =>
              s === "ACTIVE" ? "Active" : s === "INACTIVE" ? "Inactive" : s === "EXPIRED" ? "Expired" : s
            ).join(", ")}
          </span>
          <button onClick={() => handleFilterChange("status", [])} className="ml-2 shrink-0 hover:text-indigo-900 flex items-center justify-center">×</button>
        </span>
      )}
      <button
        onClick={handleResetAllFilters}
        className="self-center shrink-0 text-sm font-sans font-medium tracking-wide text-gray-600 hover:text-gray-900 transition-colors py-1.5 px-4 bg-white border border-gray-200 shadow-sm rounded-full hover:bg-gray-50 flex items-center justify-center"
      >
        Clear All
      </button>
    </div>
  );
}

/**
 * CheckboxIcon — custom indigo checkbox indicator used in filter lists.
 * @param {boolean} props.active - Whether the checkbox is checked.
 * @param {boolean} [props.small=false] - Uses smaller margin (for compact dropdown rows).
 */
function CheckboxIcon({ active, small = false }) {
  return (
    <div
      className={`${small ? "mr-2" : "mr-3"} h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
        active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
      }`}
    >
      {active && (
        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * ChevronIcon — small downward chevron used in dropdown trigger buttons.
 */
function ChevronIcon({ className = "" }) {
  return (
    <svg className={`ml-2 h-4 w-4 transition-transform duration-200 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
