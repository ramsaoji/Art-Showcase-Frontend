import { Fragment, useState, useEffect, useRef } from "react";
import { Menu, Transition, Dialog } from "@headlessui/react";
import {
  FunnelIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import InfiniteScroll from "react-infinite-scroll-component";

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

// Reusable search filter component
function SearchableFilterSection({
  title,
  options,
  selectedValue,
  onSelect,
  allLabel = "All",
  searchPlaceholder,
  searchQuery = "",
  onSearch,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  shouldShowFullEmail = () => false,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const scrollableRef = useRef(null);
  const prevOptionsLength = useRef(options.length);
  const prevScrollTop = useRef(0);

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

  return (
    <div>
      <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Search input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm font-sans rounded-lg bg-white border border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      <div
        id={scrollableId}
        ref={scrollableRef}
        className="custom-scrollbar max-h-64 overflow-auto bg-white rounded-lg"
      >
        <InfiniteScroll
          dataLength={filteredOptions.length}
          next={handleLoadMore}
          hasMore={hasMore}
          loader={
            <div className="px-3 py-2 text-sm text-gray-500 font-sans">
              Loading...
            </div>
          }
          scrollableTarget={scrollableId}
        >
          <button
            onClick={() => onSelect("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
              selectedValue === "all"
                ? "bg-indigo-50 text-indigo-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <span className="flex-grow">{allLabel}</span>
              {selectedValue === "all" && (
                <svg
                  className="h-5 w-5 text-indigo-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>

          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500 font-sans">
              Loading...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const value =
                typeof option === "object" ? option.id || option : option;
              let label =
                typeof option === "object" ? option.label || option : option;
              // If label contains an email in parentheses, mask it for public
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
              return (
                <button
                  key={value}
                  onClick={() => onSelect(value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                    selectedValue === value
                      ? "bg-indigo-50 text-indigo-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="flex-grow">{label}</span>
                    {selectedValue === value && (
                      <svg
                        className="h-5 w-5 text-indigo-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 font-sans">
              No options found
            </div>
          )}
        </InfiniteScroll>
      </div>
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

  // Helper to decide if full email should be shown for an artist
  function shouldShowFullEmail(artistId) {
    if (isSuperAdmin) return true;
    if (user && artistId && user.id === artistId) return true;
    return false;
  }

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
              <Dialog.Panel className="relative flex flex-col w-full h-[90vh] mt-auto bg-white rounded-t-3xl px-4 pb-4">
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
                      {[
                        { value: "newest", label: "Newest First" },
                        { value: "oldest", label: "Oldest First" },
                        {
                          value: "price-high",
                          label: "Price: High to Low",
                        },
                        { value: "price-low", label: "Price: Low to High" },
                        {
                          value: "year-new",
                          label: "Year: Newest to Oldest",
                        },
                        {
                          value: "year-old",
                          label: "Year: Oldest to Newest",
                        },
                        { value: "artist-az", label: "Artist: A to Z" },
                        { value: "artist-za", label: "Artist: Z to A" },
                      ].map((option) => (
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
                      {[
                        { value: "all", label: "All Artworks" },
                        { value: "featured", label: "Featured Only" },
                        { value: "non-featured", label: "Non-Featured" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("featured", option.value)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                            filters.featured === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Status Filter */}
                  {(isSuperAdmin || isArtist) && (
                    <div className="mb-8">
                      <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                        Active Status
                      </h3>
                      <div className="space-y-3">
                        {[
                          { value: "all", label: "All Statuses" },
                          { value: "ACTIVE", label: "Active" },
                          { value: "INACTIVE", label: "Inactive" },
                          { value: "EXPIRED", label: "Expired" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleFilterChange("status", option.value)
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                              filters.status === option.value
                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artist Filter */}
                  <div className="mb-8">
                    <SearchableFilterSection
                      title="Artist"
                      options={artists}
                      selectedValue={filters.artist}
                      onSelect={(value) => handleFilterChange("artist", value)}
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
                      selectedValue={filters.material}
                      onSelect={(value) =>
                        handleFilterChange("material", value)
                      }
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
                      selectedValue={filters.style}
                      onSelect={(value) => handleFilterChange("style", value)}
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
                      {[
                        { value: "all", label: "All" },
                        { value: "available", label: "Available" },
                        { value: "sold", label: "Sold" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("availability", option.value)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                            filters.availability === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {(filters.material !== "all" ||
                    filters.artist !== "all" ||
                    filters.availability !== "all" ||
                    filters.featured !== "all" ||
                    filters.status !== "all") && (
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
          <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(filters.featured !== "all" ||
              filters.status !== "all" ||
              filters.availability !== "all") && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                {
                  ["featured", "status", "availability"].filter(
                    (key) => filters[key] !== "all"
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
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Artworks" },
                    { value: "featured", label: "Featured Only" },
                    { value: "non-featured", label: "Non-Featured" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleFilterChange("featured", option.value)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                        filters.featured === option.value
                          ? "bg-indigo-50 text-indigo-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Active Status Filter Section */}
              {(isSuperAdmin || isArtist) && (
                <div className="mb-4">
                  <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">
                    Active Status
                  </h3>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Statuses" },
                      { value: "ACTIVE", label: "Active" },
                      { value: "INACTIVE", label: "Inactive" },
                      { value: "EXPIRED", label: "Expired" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleFilterChange("status", option.value)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                          filters.status === option.value
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Availability Filter Section */}
              <div className="mb-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">
                  Availability
                </h3>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "available", label: "Available" },
                    { value: "sold", label: "Sold" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleFilterChange("availability", option.value)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                        filters.availability === option.value
                          ? "bg-indigo-50 text-indigo-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Reset Filters */}
              {(filters.featured !== "all" ||
                filters.status !== "all" ||
                filters.availability !== "all") && (
                <div className="pt-2">
                  <button
                    onClick={handleResetAllFilters}
                    className="w-full text-center px-3 py-2 rounded-lg text-sm font-sans text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
        {/* Artist Dropdown */}
        {Array.isArray(artists) && (
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Artist
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
              <Menu.Items className="absolute left-0 z-50 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
                <SearchableFilterSection
                  title="Artist"
                  options={artists}
                  selectedValue={filters.artist}
                  onSelect={(value) => handleFilterChange("artist", value)}
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
              </Menu.Items>
            </Transition>
          </Menu>
        )}
        {/* Material Dropdown */}
        {Array.isArray(materials) && (
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Material
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
              <Menu.Items className="absolute left-0 z-50 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
                <SearchableFilterSection
                  title="Material"
                  options={materials}
                  selectedValue={filters.material}
                  onSelect={(value) => handleFilterChange("material", value)}
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
              </Menu.Items>
            </Transition>
          </Menu>
        )}
        {/* Style Dropdown */}
        {Array.isArray(styles) && (
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Style
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
              <Menu.Items className="absolute left-0 z-50 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
                <SearchableFilterSection
                  title="Style"
                  options={styles}
                  selectedValue={filters.style}
                  onSelect={(value) => handleFilterChange("style", value)}
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
              <div className="py-2">
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "price-high", label: "Price: High to Low" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "year-new", label: "Year: Newest to Oldest" },
                  { value: "year-old", label: "Year: Oldest to Newest" },
                  { value: "artist-az", label: "Artist: A to Z" },
                  { value: "artist-za", label: "Artist: Z to A" },
                ].map((option) => (
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
              <Dialog.Panel className="relative flex flex-col w-full max-w-2xl h-[90vh] bg-white rounded-3xl px-4 pb-4">
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
                      {[
                        { value: "newest", label: "Newest First" },
                        { value: "oldest", label: "Oldest First" },
                        { value: "price-high", label: "Price: High to Low" },
                        { value: "price-low", label: "Price: Low to High" },
                        { value: "year-new", label: "Year: Newest to Oldest" },
                        { value: "year-old", label: "Year: Oldest to Newest" },
                        { value: "artist-az", label: "Artist: A to Z" },
                        { value: "artist-za", label: "Artist: Z to A" },
                      ].map((option) => (
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
                      {[
                        { value: "all", label: "All Artworks" },
                        { value: "featured", label: "Featured Only" },
                        { value: "non-featured", label: "Non-Featured" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("featured", option.value)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                            filters.featured === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Status Filter */}
                  {(isSuperAdmin || isArtist) && (
                    <div className="mb-8">
                      <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                        Active Status
                      </h3>
                      <div className="space-y-3">
                        {[
                          { value: "all", label: "All Statuses" },
                          { value: "ACTIVE", label: "Active" },
                          { value: "INACTIVE", label: "Inactive" },
                          { value: "EXPIRED", label: "Expired" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleFilterChange("status", option.value)
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                              filters.status === option.value
                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artist Filter */}
                  <div className="mb-8">
                    <SearchableFilterSection
                      title="Artist"
                      options={artists}
                      selectedValue={filters.artist}
                      onSelect={(value) => handleFilterChange("artist", value)}
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
                      selectedValue={filters.material}
                      onSelect={(value) =>
                        handleFilterChange("material", value)
                      }
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
                      selectedValue={filters.style}
                      onSelect={(value) => handleFilterChange("style", value)}
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
                      {[
                        { value: "all", label: "All" },
                        { value: "available", label: "Available" },
                        { value: "sold", label: "Sold" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleFilterChange("availability", option.value)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                            filters.availability === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {(filters.material !== "all" ||
                    filters.artist !== "all" ||
                    filters.style !== "all" ||
                    filters.availability !== "all" ||
                    filters.featured !== "all" ||
                    filters.status !== "all") && (
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
      {(filters.material !== "all" ||
        filters.artist !== "all" ||
        filters.style !== "all" ||
        filters.availability !== "all" ||
        filters.featured !== "all" ||
        filters.status !== "all") && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {filters.featured !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Featured:</span>{" "}
              <span className="font-semibold">
                {filters.featured === "featured"
                  ? "Featured Only"
                  : "Non-Featured"}
              </span>
              <button
                onClick={() => handleFilterChange("featured", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.artist !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Artist:</span>{" "}
              <span className="font-semibold">
                {Array.isArray(artists) &&
                  (() => {
                    const found = artists.find((a) => a.id === filters.artist);
                    if (found && found.label) {
                      if (shouldShowFullEmail(found.id)) {
                        return found.label;
                      } else {
                        return maskEmailInLabel(found.label);
                      }
                    }
                    // If artist not found in results yet, show loading or fallback
                    return isArtistsLoading || isArtistFilterLoading
                      ? "Loading..."
                      : `Artist ${filters.artist}`;
                  })()}
              </span>
              <button
                onClick={() => handleFilterChange("artist", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.material !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Material:</span>{" "}
              <span className="font-semibold">{filters.material}</span>
              <button
                onClick={() => handleFilterChange("material", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.style !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Style:</span>{" "}
              <span className="font-semibold">{filters.style}</span>
              <button
                onClick={() => handleFilterChange("style", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.availability !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Status:</span>{" "}
              <span className="font-semibold">
                {filters.availability === "available" ? "Available" : "Sold"}
              </span>
              <button
                onClick={() => handleFilterChange("availability", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.status !== "all" && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
              <span className="mr-1">Status:</span>{" "}
              <span className="font-semibold">
                {filters.status === "ACTIVE"
                  ? "Active"
                  : filters.status === "INACTIVE"
                  ? "Inactive"
                  : filters.status === "EXPIRED"
                  ? "Expired"
                  : filters.status}
              </span>
              <button
                onClick={() => handleFilterChange("status", "all")}
                className="ml-2 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              handleResetAllFilters();
            }}
            className="text-sm font-sans font-medium tracking-wide text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
