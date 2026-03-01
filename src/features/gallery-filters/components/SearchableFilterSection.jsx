import { useState, useEffect, useRef } from "react";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import InfiniteScroll from "react-infinite-scroll-component";
import { Input } from "@/components/ui/input";
import Tooltip from "@/components/common/Tooltip";
import { maskEmailInLabel } from "../utils/filterUtils";

/**
 * SearchableFilterSection — reusable scrollable checkbox filter panel.
 *
 * @param {string} props.title - Section heading text.
 * @param {Array} props.options - Filter options; objects with `id`/`label` or plain strings.
 * @param {Array} props.selectedValues - Currently selected values.
 * @param {Function} props.onApply - Called with final selection on "Apply" click.
 * @param {string} [props.allLabel="All"] - Label for the "select all" entry.
 * @param {string} [props.searchPlaceholder] - Placeholder text for the search input.
 * @param {string} [props.searchQuery=""] - Controlled external search query value.
 * @param {Function} [props.onSearch] - Called with the debounced search string.
 * @param {boolean} [props.isLoading=false] - Shows loading message when true and no options yet.
 * @param {boolean} [props.hasMore=false] - Whether infinite scroll should load more.
 * @param {Function} [props.onLoadMore] - Triggered when scroll reaches the bottom.
 * @param {Function} [props.shouldShowFullEmail] - Returns true for option IDs that show unmasked email.
 * @param {Function} [props.renderFooterWrapper] - Optional wrapper for the footer node (e.g. to close a dropdown).
 * @param {boolean} [props.showAllOption=false] - Whether to render an "All" checkbox at the top.
 * @param {boolean} [props.showFooter=true] - Whether to render Apply/Reset footer buttons.
 * @param {Function} [props.onChange] - Fired immediately on each checkbox toggle (no Apply needed).
 * @param {string} [props.loadingMessage="Loading..."] - Text shown while loading.
 */
export default function SearchableFilterSection({
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
  renderFooterWrapper,
  showAllOption = false,
  showFooter = true,
  onChange,
  loadingMessage = "Loading...",
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
      const el = scrollableRef.current;
      if (el.scrollHeight - prevScrollTop.current - el.clientHeight < 40) {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = prevScrollTop.current;
      }
    }
    prevOptionsLength.current = options.length;
  }, [options.length]);

  const filteredOptions = options;
  const scrollableId = `${title.replace(/\s+/g, "-")}-scrollable-list`;

  const toggleSelection = (value) => {
    setTempSelectedValues((prev) => {
      let newValues;
      if (value === "all") newValues = [];
      else if (prev.includes(value)) {
        newValues = prev.filter((v) => v !== value);
      } else {
        newValues = [...prev, value];
      }
      if (onChange) onChange(newValues);
      return newValues;
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
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-8 py-2 text-sm rounded-xl"
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
            <div className="px-3 py-2 text-sm text-gray-500 font-sans text-center">
              Loading more...
            </div>
          }
          scrollableTarget={scrollableId}
        >
          {/* All Option */}
          {showAllOption && (
            <div className="mb-2 pb-2 border-b border-gray-100">
              <button
                onClick={() => {
                  setTempSelectedValues([]);
                  if (onChange) onChange([]);
                }}
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
          )}

          {isLoading && filteredOptions.length === 0 ? (
            <div className="px-3 py-10 text-sm text-gray-500 font-sans text-center">
              {loadingMessage}
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="space-y-1">
              {filteredOptions.map((option) => {
                const value =
                  typeof option === "object" ? option.id || option : option;
                let label =
                  typeof option === "object" ? option.label || option : option;

                if (typeof label === "string" && /\(.+@.+\)/.test(label)) {
                  if (typeof option === "object" && shouldShowFullEmail(option.id)) {
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
      {showFooter && (() => {
        const footer = (
          <div className="p-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setTempSelectedValues([]);
                if (onChange) onChange([]);
              }}
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
