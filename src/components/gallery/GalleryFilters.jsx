import { Fragment } from "react";
import { Menu, Transition, Dialog } from "@headlessui/react";
import {
  FunnelIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function GalleryFilters({
  filters,
  sortBy,
  materials,
  handleFilterChange,
  handleSortChange,
  handleResetAllFilters,
  isMobileFiltersOpen,
  setIsMobileFiltersOpen,
}) {
  return (
    <div className="mb-12">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
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

                <div className="flex-1 py-6 overflow-y-auto">
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

                  {/* Material Filter */}
                  <div className="mb-8">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                      Material
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleFilterChange("material", "all")}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                          filters.material === "all"
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        All Materials
                      </button>
                      {materials.map((material) => (
                        <button
                          key={material}
                          onClick={() =>
                            handleFilterChange("material", material)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                            filters.material === material
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {material}
                        </button>
                      ))}
                    </div>
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
                    filters.availability !== "all" ||
                    filters.featured !== "all") && (
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
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Combined Filter Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <FunnelIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Filters</span>
            {(filters.material !== "all" ||
              filters.availability !== "all" ||
              filters.featured !== "all") && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                {Object.values(filters).filter((f) => f !== "all").length}
              </span>
            )}
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
            <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
              {/* Featured Filter Section */}
              <div className="p-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
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
                      <div className="flex items-center">
                        <span className="flex-grow">{option.label}</span>
                        {filters.featured === option.value && (
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
                  ))}
                </div>
              </div>

              {/* Material Filter Section */}
              <div className="p-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
                  Material
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange("material", "all")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                      filters.material === "all"
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">All Materials</span>
                      {filters.material === "all" && (
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
                  {materials.map((material) => (
                    <button
                      key={material}
                      onClick={() => handleFilterChange("material", material)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                        filters.material === material
                          ? "bg-indigo-50 text-indigo-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="flex-grow">{material}</span>
                        {filters.material === material && (
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
                  ))}
                </div>
              </div>

              {/* Availability Filter Section */}
              <div className="p-4">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
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
                      <div className="flex items-center">
                        <span className="flex-grow">{option.label}</span>
                        {filters.availability === option.value && (
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
                  ))}
                </div>
              </div>

              {/* Reset Filters */}
              {(filters.material !== "all" ||
                filters.availability !== "all" ||
                filters.featured !== "all") && (
                <div className="p-4">
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

        {/* Sort Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Sort by:&nbsp;</span>
            {sortBy
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
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
            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-2">
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "price-high", label: "Price: High to Low" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "year-new", label: "Year: Newest to Oldest" },
                  { value: "year-old", label: "Year: Oldest to Newest" },
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

      {/* Active Filters Display */}
      {(filters.material !== "all" ||
        filters.availability !== "all" ||
        filters.featured !== "all") && (
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
