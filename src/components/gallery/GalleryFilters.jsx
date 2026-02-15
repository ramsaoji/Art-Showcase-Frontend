import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { Menu, Transition, Dialog } from "@headlessui/react";
import FunnelIcon from "@heroicons/react/24/outline/FunnelIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { useAuth } from "../../contexts/AuthContext";
import InfiniteScroll from "react-infinite-scroll-component";
import Tooltip from "../ui/Tooltip";

// Helper to mask email addresses for privacy
function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (user.length <= 1) return `*@${domain}`;
  if (user.length === 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${"*".repeat(user.length - 2)}${
    user[user.length - 1]
  }@${domain}`;
}

// Helper to mask email in label string like 'John Doe (john@example.com)'
function maskEmailInLabel(label) {
  if (typeof label !== "string") return label;
  const match = label.match(/^(.*)\s+\(([^)]+)\)$/);
  if (match) {
    const name = match[1];
    const email = match[2];
    return `${name} (${maskEmail(email)})`;
  }
  return label;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "year-new", label: "Year: Newest to Oldest" },
  { value: "year-old", label: "Year: Oldest to Newest" },
  { value: "artist-az", label: "Artist: A to Z" },
  { value: "artist-za", label: "Artist: Z to A" },
];

const FEATURED_OPTIONS = [
  { value: "all", label: "All Artworks" },
  { value: "featured", label: "Featured Only" },
  { value: "non-featured", label: "Non-Featured" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "EXPIRED", label: "Expired" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

// Reusable search filter component
function SearchableFilterSection({
  title,
  options,
  selectedValues = [],
  onApply,
  allLabel = "All",
  searchPlaceholder,
  searchQuery = "",
  onSearch,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  shouldShowFullEmail = () => false,
  /** Optional wrapper for footer (e.g. Menu.Item) so dropdown closes on Apply/Reset */
  renderFooterWrapper,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [tempSelectedValues, setTempSelectedValues] = useState(
    Array.isArray(selectedValues) ? selectedValues : []
  );
  const scrollableRef = useRef(null);
  const prevOptionsLength = useRef(options.length);
  const prevScrollTop = useRef(0);

  // Sync tempSelectedValues with selectedValues prop when it changes
  useEffect(() => {
    setTempSelectedValues(Array.isArray(selectedValues) ? selectedValues : []);
  }, [selectedValues]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearch) onSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, onSearch]);

  // Reset localSearch when searchQuery prop changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Save scroll position before loading more
  const handleLoadMore = () => {
    if (scrollableRef.current) {
      prevScrollTop.current = scrollableRef.current.scrollTop;
    }
    if (onLoadMore) onLoadMore();
  };

  // Restore scroll position after new items are appended
  useEffect(() => {
    if (
      options.length > prevOptionsLength.current &&
      scrollableRef.current &&
      prevScrollTop.current > 0
    ) {
      // Only restore if we were at the bottom before
      const el = scrollableRef.current;
      // If user was near the bottom, keep them at the bottom
      if (el.scrollHeight - prevScrollTop.current - el.clientHeight < 40) {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = prevScrollTop.current;
      }
    }
    prevOptionsLength.current = options.length;
  }, [options.length]);

  // Filter options based on search query (if not using backend search)
  const filteredOptions = options;

  // Unique id for scrollable target
  const scrollableId = `${title.replace(/\s+/g, "-")}-scrollable-list`;

  const toggleSelection = (value) => {
    setTempSelectedValues((prev) => {
      if (value === "all") return [];
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const isSelected = (value) => {
    if (value === "all") return tempSelectedValues.length === 0;
    return tempSelectedValues.includes(value);
  };

  return (
    <div className="flex flex-col h-full max-h-[400px]">
      <div className="px-3 py-2 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {/* Search input */}
        <div className="relative group">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-sm font-sans rounded-xl bg-white border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-gray-400 text-gray-900"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        id={scrollableId}
        ref={scrollableRef}
        className="custom-scrollbar overflow-auto flex-1 p-2"
      >
        <InfiniteScroll
          dataLength={filteredOptions.length}
          next={handleLoadMore}
          hasMore={hasMore}
          loader={
            <div className="px-3 py-2 text-sm text-gray-400 font-sans text-center italic">
              Loading...
            </div>
          }
          scrollableTarget={scrollableId}
        >
          {/* All Option - same checkbox style as Filters popup */}
          <div className="mb-2 pb-2 border-b border-gray-100">
            <button
              onClick={() => setTempSelectedValues([])}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                tempSelectedValues.length === 0
                  ? "bg-indigo-50 text-indigo-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div
                className={`mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                  tempSelectedValues.length === 0
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300 bg-white"
                }`}
              >
                {tempSelectedValues.length === 0 && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span>{allLabel}</span>
            </button>
          </div>

          {isLoading && filteredOptions.length === 0 ? (
            <div className="px-3 py-10 text-sm text-gray-400 font-sans text-center italic">
              Loading options...
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="space-y-1">
            {filteredOptions.map((option) => {
              const value =
                typeof option === "object" ? option.id || option : option;
              let label =
                typeof option === "object" ? option.label || option : option;
              
              if (typeof label === "string" && /\(.+@.+\)/.test(label)) {
                if (
                  typeof option === "object" &&
                  shouldShowFullEmail(option.id)
                ) {
                  // Show full label
                } else {
                  label = maskEmailInLabel(label);
                }
              }
              const active = isSelected(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleSelection(value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                    active
                      ? "bg-indigo-50 text-indigo-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                      active
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {active && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <Tooltip content={label} className="flex-grow min-w-0" contentClassName="truncate">
                    {label}
                  </Tooltip>
                </button>
              );
            })}
            </div>
          ) : (
            <div className="px-3 py-8 text-sm text-gray-400 font-sans text-center italic">
              No options found
            </div>
          )}
        </InfiniteScroll>
      </div>

      {/* Footer with Apply/Reset - optionally wrapped so dropdown closes on click */}
      {(() => {
        const footer = (
          <div className="p-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl flex items-center justify-between gap-4">
            <button
              onClick={() => setTempSelectedValues([])}
              className="px-4 py-2 rounded-lg text-sm font-sans font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => onApply(tempSelectedValues)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow transition-all"
            >
              Apply Filters
            </button>
          </div>
        );
        return renderFooterWrapper ? renderFooterWrapper(footer) : footer;
      })()}
    </div>
  );
}

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
  artistSearch = "",
  materialSearch = "",
  styleSearch = "",
  markDropdownOpened,
}) {
  const { isSuperAdmin, isArtist, user } = useAuth();
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(false);

  // Temp state for Filters dropdown - only apply on "Apply" click to avoid API call per checkbox
  const [tempFiltersFeatured, setTempFiltersFeatured] = useState([]);
  const [tempFiltersStatus, setTempFiltersStatus] = useState([]);
  const [tempFiltersAvailability, setTempFiltersAvailability] = useState([]);

  const syncTempFiltersFromProps = useCallback(() => {
    setTempFiltersFeatured(Array.isArray(filters.featured) ? [...filters.featured] : []);
    setTempFiltersStatus(Array.isArray(filters.status) ? [...filters.status] : []);
    setTempFiltersAvailability(Array.isArray(filters.availability) ? [...filters.availability] : []);
  }, [filters.featured, filters.status, filters.availability]);

  const applyFiltersPopup = useCallback(() => {
    handleFilterChange("featured", tempFiltersFeatured);
    handleFilterChange("status", tempFiltersStatus);
    handleFilterChange("availability", tempFiltersAvailability);
  }, [handleFilterChange, tempFiltersFeatured, tempFiltersStatus, tempFiltersAvailability]);

  // Helper to decide if full email should be shown for an artist
  function shouldShowFullEmail(artistId) {
    if (isSuperAdmin) return true;
    if (user && artistId && user.id === artistId) return true;
    return false;
  }

  // Helper to toggle filter values
  const toggleFilterValue = (currentValues, value) => {
    if (value === "all") return [];
    if (!Array.isArray(currentValues)) return [value];
    if (currentValues.includes(value)) {
      return currentValues.filter((v) => v !== value);
    }
    return [...currentValues, value];
  };

  const isFilterSelected = (currentValues, value) => {
    if (value === "all") return !currentValues || currentValues.length === 0;
    return Array.isArray(currentValues) && currentValues.includes(value);
  };

  return (
    <div className="mb-12">
      {/* Mobile Filter Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="w-full flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters & Sort
        </button>
      </div>

      {/* Mobile Filters Dialog */}
      <Transition.Root show={isMobileFiltersOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setIsMobileFiltersOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel
                className="relative flex flex-col w-full mt-auto bg-white rounded-t-3xl px-4 pb-4"
                style={{
                  height: "calc(100dvh - 5rem)",
                }}
              >
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-sans font-semibold text-gray-900">
                    Filters & Sort
                  </Dialog.Title>
                  <button
                    type="button"
                    className="p-2 -m-2 text-gray-400 hover:text-gray-500"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 py-6 pr-1 overflow-y-auto">
                  {/* Sort Options */}
                  <div className="mb-8">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Sort by
                    </h3>
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
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Featured Status
                    </h3>
                    <div className="space-y-3">
                      {FEATURED_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                        const active = isFilterSelected(filters.featured, option.value);
                        return (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange(
                              "featured",
                              toggleFilterValue(filters.featured, option.value)
                            )
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                            active
                              ? "bg-indigo-50 text-indigo-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                             active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                          }`}>
                             {active && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             )}
                          </div>
                          {option.label}
                        </button>
                      )})}
                    </div>
                  </div>

                  {/* Active Status Filter */}
                  {(isSuperAdmin || isArtist) && (
                    <div className="mb-8">
                      <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                        Active Status
                      </h3>
                      <div className="space-y-3">
                        {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                          const active = isFilterSelected(filters.status, option.value);
                          return (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleFilterChange("status", toggleFilterValue(filters.status, option.value))
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                              active
                                ? "bg-indigo-50 text-indigo-900 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                           <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                             active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                           }`}>
                             {active && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             )}
                          </div>
                            {option.label}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}

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
                      onSearch={(query) => {
                        markDropdownOpened("artist");
                        handleArtistSearch(query);
                      }}
                      isLoading={isArtistsLoading}
                      hasMore={hasMoreArtists}
                      onLoadMore={loadMoreArtists}
                      shouldShowFullEmail={shouldShowFullEmail}
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
                      onSearch={(query) => {
                        markDropdownOpened("material");
                        handleMaterialSearch(query);
                      }}
                      isLoading={isMaterialsLoading}
                      hasMore={hasMoreMaterials}
                      onLoadMore={loadMoreMaterials}
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
                      onSearch={(query) => {
                        markDropdownOpened("style");
                        handleStyleSearch(query);
                      }}
                      isLoading={isStylesLoading}
                      hasMore={hasMoreStyles}
                      onLoadMore={loadMoreStyles}
                    />
                  </div>

                  {/* Availability Filter */}
                  <div className="mb-8">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Availability
                    </h3>
                    <div className="space-y-3">
                      {AVAILABILITY_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                        const active = isFilterSelected(filters.availability, option.value);
                        return (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("availability", toggleFilterValue(filters.availability, option.value))
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                            active
                              ? "bg-indigo-50 text-indigo-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                           <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                             active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                           }`}>
                             {active && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             )}
                          </div>
                          {option.label}
                        </button>
                      )})}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {(filters.material?.length > 0 ||
                    filters.artist?.length > 0 ||
                    filters.availability?.length > 0 ||
                    filters.featured?.length > 0 ||
                    filters.status?.length > 0) && (
                    <div className="mb-4">
                      <button
                        onClick={handleResetAllFilters}
                        className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-sans text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                      >
                        Reset All
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-4 mb-6">
        {/* Filters Dropdown (other filters) */}
        <Menu as="div" className="relative">
          <Menu.Button
            onClick={syncTempFiltersFromProps}
            className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(filters.featured?.length > 0 ||
              filters.status?.length > 0 ||
              filters.availability?.length > 0) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                {
                  ["featured", "status", "availability"].filter(
                    (key) => filters[key] && filters[key].length > 0
                  ).length
                }
              </span>
            )}
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 p-4">
              {/* Featured Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">
                  Featured Status
                </h3>
                <div className="space-y-1">
                  {FEATURED_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(tempFiltersFeatured, option.value);
                    return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setTempFiltersFeatured(toggleFilterValue(tempFiltersFeatured, option.value))
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                        active
                          ? "bg-indigo-50 text-indigo-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                       <div className={`mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                         active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                       }`}>
                         {active && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                         )}
                      </div>
                      {option.label}
                    </button>
                  )})}
                </div>
              </div>
              {/* Active Status Filter Section */}
              {(isSuperAdmin || isArtist) && (
                <div className="mb-4">
                  <h3 className="text-sm font-sans font-semibold text-gray-900 my-2">
                    Active Status
                  </h3>
                  <div className="space-y-1">
                    {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                      const active = isFilterSelected(tempFiltersStatus, option.value);
                      return (
                      <button
                        key={option.value}
                        onClick={() =>
                          setTempFiltersStatus(toggleFilterValue(tempFiltersStatus, option.value))
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                          active
                            ? "bg-indigo-50 text-indigo-900 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                         <div className={`mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                           active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                         }`}>
                           {active && (
                              <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                           )}
                        </div>
                        {option.label}
                      </button>
                    )})}
                  </div>
                </div>
              )}
              {/* Availability Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 my-2">
                  Availability
                </h3>
                <div className="space-y-1">
                  {AVAILABILITY_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                    const active = isFilterSelected(tempFiltersAvailability, option.value);
                    return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setTempFiltersAvailability(toggleFilterValue(tempFiltersAvailability, option.value))
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans flex items-center ${
                        active
                          ? "bg-indigo-50 text-indigo-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                       <div className={`mr-2 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                         active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                       }`}>
                         {active && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                         )}
                      </div>
                      {option.label}
                    </button>
                  )})}
                </div>
              </div>
              {/* Footer: Reset + Apply - Menu.Item so popup closes on click */}
              <Menu.Item as="div" className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempFiltersFeatured([]);
                      setTempFiltersStatus([]);
                      setTempFiltersAvailability([]);
                    }}
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
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
        {/* Artist Dropdown */}
        {Array.isArray(artists) && (
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={() => markDropdownOpened("artist")}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Artist
              {filters.artist && filters.artist.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                  {filters.artist.length}
                </span>
              )}
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Artist"
                  options={artists}
                  selectedValues={filters.artist}
                  onApply={(values) => handleFilterChange("artist", values)}
                  allLabel="All Artists"
                  searchPlaceholder="Search artists..."
                  searchQuery={artistSearch}
                  onSearch={(query) => {
                    markDropdownOpened("artist");
                    handleArtistSearch(query);
                  }}
                  isLoading={isArtistsLoading}
                  hasMore={hasMoreArtists}
                  onLoadMore={loadMoreArtists}
                  shouldShowFullEmail={shouldShowFullEmail}
                  renderFooterWrapper={(footer) => <Menu.Item as="div">{footer}</Menu.Item>}
                />
              </Menu.Items>
            </Transition>
          </Menu>
        )}
        {/* Material Dropdown */}
        {Array.isArray(materials) && (
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={() => markDropdownOpened("material")}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Material
              {filters.material && filters.material.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                  {filters.material.length}
                </span>
              )}
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Material"
                  options={materials}
                  selectedValues={filters.material}
                  onApply={(values) => handleFilterChange("material", values)}
                  allLabel="All Materials"
                  searchPlaceholder="Search materials..."
                  searchQuery={materialSearch}
                  onSearch={(query) => {
                    markDropdownOpened("material");
                    handleMaterialSearch(query);
                  }}
                  isLoading={isMaterialsLoading}
                  hasMore={hasMoreMaterials}
                  onLoadMore={loadMoreMaterials}
                  renderFooterWrapper={(footer) => <Menu.Item as="div">{footer}</Menu.Item>}
                />
              </Menu.Items>
            </Transition>
          </Menu>
        )}
        {/* Style Dropdown */}
        {Array.isArray(styles) && (
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={() => markDropdownOpened("style")}
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Style
              {filters.style && filters.style.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                  {filters.style.length}
                </span>
              )}
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 p-4">
                <SearchableFilterSection
                  title="Style"
                  options={styles}
                  selectedValues={filters.style}
                  onApply={(values) => handleFilterChange("style", values)}
                  allLabel="All Styles"
                  searchPlaceholder="Search styles..."
                  searchQuery={styleSearch}
                  onSearch={(query) => {
                    markDropdownOpened("style");
                    handleStyleSearch(query);
                  }}
                  isLoading={isStylesLoading}
                  hasMore={hasMoreStyles}
                  onLoadMore={loadMoreStyles}
                  renderFooterWrapper={(footer) => <Menu.Item as="div">{footer}</Menu.Item>}
                />
              </Menu.Items>
            </Transition>
          </Menu>
        )}
        <div className="flex-1" />
        {/* Sort Dropdown (right aligned) */}
        <Menu as="div" className="relative ml-auto">
          <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Sort by:{" "}
            {sortBy
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-2 space-y-1">
                {SORT_OPTIONS.map((option) => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => handleSortChange(option.value)}
                        className={`${
                          active
                            ? "bg-gray-50 text-indigo-600"
                            : "text-gray-700"
                        } ${
                          sortBy === option.value ? "font-medium" : ""
                        } block px-4 py-2 text-sm w-full text-left font-sans`}
                      >
                        {option.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Desktop Filters Dialog */}
      <Transition.Root show={isDesktopFiltersOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 hidden lg:block"
          onClose={setIsDesktopFiltersOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-y-full lg:translate-y-0 lg:scale-95"
              enterTo="translate-y-0 lg:scale-100"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-y-0 lg:scale-100"
              leaveTo="translate-y-full lg:scale-95"
            >
              <Dialog.Panel
                className="relative flex flex-col w-full max-w-2xl bg-white rounded-3xl px-4 pb-4"
                style={{
                  height: "calc(100dvh - 5rem)",
                }}
              >
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-sans font-semibold text-gray-900">
                    Filters & Sort
                  </Dialog.Title>
                  <button
                    type="button"
                    className="p-2 -m-2 text-gray-400 hover:text-gray-500"
                    onClick={() => setIsDesktopFiltersOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 py-6 pr-1 overflow-y-auto">
                  {/* Sort Options */}
                  <div className="mb-8">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Sort by
                    </h3>
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
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Featured Status
                    </h3>
                    <div className="space-y-3">
                      {FEATURED_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                        const active = isFilterSelected(filters.featured, option.value);
                        return (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange(
                              "featured",
                              toggleFilterValue(filters.featured, option.value)
                            )
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                            active
                              ? "bg-indigo-50 text-indigo-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                             active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                          }`}>
                             {active && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             )}
                          </div>
                          {option.label}
                        </button>
                      )})}
                    </div>
                  </div>

                  {/* Active Status Filter */}
                  {(isSuperAdmin || isArtist) && (
                    <div className="mb-8">
                      <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                        Active Status
                      </h3>
                      <div className="space-y-3">
                        {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                          const active = isFilterSelected(filters.status, option.value);
                          return (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleFilterChange("status", toggleFilterValue(filters.status, option.value))
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                              active
                                ? "bg-indigo-50 text-indigo-900 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                             <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                               active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                             }`}>
                               {active && (
                                  <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                               )}
                            </div>
                            {option.label}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}

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
                      onSearch={(query) => {
                        markDropdownOpened("artist");
                        handleArtistSearch(query);
                      }}
                      isLoading={isArtistsLoading}
                      hasMore={hasMoreArtists}
                      onLoadMore={loadMoreArtists}
                      shouldShowFullEmail={shouldShowFullEmail}
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
                      onSearch={(query) => {
                        markDropdownOpened("material");
                        handleMaterialSearch(query);
                      }}
                      isLoading={isMaterialsLoading}
                      hasMore={hasMoreMaterials}
                      onLoadMore={loadMoreMaterials}
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
                      onSearch={(query) => {
                        markDropdownOpened("style");
                        handleStyleSearch(query);
                      }}
                      isLoading={isStylesLoading}
                      hasMore={hasMoreStyles}
                      onLoadMore={loadMoreStyles}
                    />
                  </div>

                  {/* Availability Filter */}
                  <div className="mb-8">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Availability
                    </h3>
                    <div className="space-y-3">
                      {AVAILABILITY_OPTIONS.filter((o) => o.value !== "all").map((option) => {
                        const active = isFilterSelected(filters.availability, option.value);
                        return (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("availability", toggleFilterValue(filters.availability, option.value))
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm flex items-center ${
                            active
                              ? "bg-indigo-50 text-indigo-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                           <div className={`mr-3 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                             active ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                           }`}>
                             {active && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             )}
                          </div>
                          {option.label}
                        </button>
                      )})}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {(filters.material?.length > 0 ||
                    filters.artist?.length > 0 ||
                    filters.style?.length > 0 ||
                    filters.availability?.length > 0 ||
                    filters.featured?.length > 0 ||
                    filters.status?.length > 0) && (
                    <div className="mb-4">
                      <button
                        onClick={handleResetAllFilters}
                        className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-sans text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                      >
                        Reset All
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
                    onClick={() => setIsDesktopFiltersOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Active Filters Display */}
      {((filters.material && filters.material.length > 0) ||
        (filters.artist && filters.artist.length > 0) ||
        (filters.style && filters.style.length > 0) ||
        (filters.availability && filters.availability.length > 0) ||
        (filters.featured && filters.featured.length > 0) ||
        (filters.status && filters.status.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {filters.featured && filters.featured.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
              <span className="mr-0.5 shrink-0">Featured:</span>
              <span className="font-semibold break-words">
                {filters.featured.map(f => f === "featured" ? "Featured" : "Non-Featured").join(", ")}
              </span>
              <button
                onClick={() => handleFilterChange("featured", [])}
                className="ml-1 shrink-0 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.artist && filters.artist.length > 0 && (() => {
            const n = filters.artist.length;
            const labels = Array.isArray(artists)
              ? filters.artist.map(id => {
                  const found = artists.find((a) => a.id === id);
                  if (found && found.label) return shouldShowFullEmail(found.id) ? found.label : maskEmailInLabel(found.label);
                  return "Loading...";
                })
              : [];
            const fullList = labels.join(", ");
            const displayText = n === 1 ? labels[0] : `${n} selected`;
            const showTooltip = n > 1 || (n === 1 && fullList);
            return (
              <span className="inline-flex items-center gap-x-1 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                <span className="mr-0.5 shrink-0">Artist:</span>
                {showTooltip ? (
                  <Tooltip content={fullList} showOnlyWhenTruncated={n === 1} contentClassName={n === 1 ? "truncate max-w-[140px] sm:max-w-[200px]" : ""}>
                    <span className={`font-semibold ${n > 1 ? "cursor-help underline decoration-dotted underline-offset-1" : ""}`}>
                      {displayText}
                    </span>
                  </Tooltip>
                ) : (
                  <span className="font-semibold">{displayText}</span>
                )}
                <button
                  onClick={() => handleFilterChange("artist", [])}
                  className="ml-1 shrink-0 hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            );
          })()}
          {filters.material && filters.material.length > 0 && (() => {
            const n = filters.material.length;
            const fullList = filters.material.join(", ");
            const displayText = n === 1 ? filters.material[0] : `${n} selected`;
            return (
              <span className="inline-flex items-center gap-x-1 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                <span className="mr-0.5 shrink-0">Material:</span>
                {n > 1 ? (
                  <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                    <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1">
                      {displayText}
                    </span>
                  </Tooltip>
                ) : (
                  <span className="font-semibold">{displayText}</span>
                )}
                <button
                  onClick={() => handleFilterChange("material", [])}
                  className="ml-1 shrink-0 hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            );
          })()}
          {filters.style && filters.style.length > 0 && (() => {
            const n = filters.style.length;
            const fullList = filters.style.join(", ");
            const displayText = n === 1 ? filters.style[0] : `${n} selected`;
            return (
              <span className="inline-flex items-center gap-x-1 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                <span className="mr-0.5 shrink-0">Style:</span>
                {n > 1 ? (
                  <Tooltip content={fullList} showOnlyWhenTruncated={false} contentClassName="">
                    <span className="font-semibold cursor-help underline decoration-dotted underline-offset-1">
                      {displayText}
                    </span>
                  </Tooltip>
                ) : (
                  <span className="font-semibold">{displayText}</span>
                )}
                <button
                  onClick={() => handleFilterChange("style", [])}
                  className="ml-1 shrink-0 hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            );
          })()}
          {filters.availability && filters.availability.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
              <span className="mr-0.5 shrink-0">Availability:</span>
              <span className="font-semibold break-words">
                {filters.availability.map(a => a === "available" ? "Available" : "Sold").join(", ")}
              </span>
              <button
                onClick={() => handleFilterChange("availability", [])}
                className="ml-1 shrink-0 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.status && filters.status.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700 max-w-full">
              <span className="mr-0.5 shrink-0">Status:</span>
              <span className="font-semibold break-words">
                {filters.status.map(s => 
                   s === "ACTIVE" ? "Active" : 
                   s === "INACTIVE" ? "Inactive" : 
                   s === "EXPIRED" ? "Expired" : s
                ).join(", ")}
              </span>
              <button
                onClick={() => handleFilterChange("status", [])}
                className="ml-1 shrink-0 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              handleResetAllFilters();
            }}
            className="self-center text-sm font-sans font-medium tracking-wide text-gray-500 hover:text-indigo-600 transition-colors py-1"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
