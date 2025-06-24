import React, { useState, useEffect, useRef } from "react";
import { useArtistsSearch } from "../utils/trpc";
import InfiniteScroll from "react-infinite-scroll-component";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ArtistSelect({
  value,
  onChange,
  className = "",
  error = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [artistResults, setArtistResults] = useState([]);
  const dropdownRef = useRef(null);

  const {
    data: artistData,
    isLoading,
    isFetching,
  } = useArtistsSearch(
    { search: debouncedSearchTerm, limit: 20, page },
    { enabled: isOpen }
  );

  // Reset on search term change
  useEffect(() => {
    setPage(1);
    setArtistResults([]);
  }, [searchTerm]);

  // Append new artists
  useEffect(() => {
    if (artistData?.artists) {
      setArtistResults((prev) => {
        const newArtists = artistData.artists.filter(
          (newArtist) =>
            !prev.some((prevArtist) => prevArtist.id === newArtist.id)
        );
        return page === 1 ? artistData.artists : [...prev, ...newArtists];
      });
    }
  }, [artistData, page]);

  // Debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const hasMore = artistData?.hasMore || false;

  const handleSelect = (artist) => {
    onChange(artist.id);
    setIsOpen(false);
  };

  const selectedArtist = artistResults.find((a) => a.id === value);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full border rounded-xl shadow-sm py-3 px-4 pr-10 text-left bg-white focus:ring-2 focus:border-transparent focus:outline-none font-sans ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        <span className="block truncate">
          {selectedArtist
            ? `${selectedArtist.artistName} (${selectedArtist.email})`
            : "Select an artist"}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 9l4 4 4-4"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-sans rounded-lg bg-white border border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div
            id="artist-scrollable-list"
            className="flex-grow overflow-auto custom-scrollbar"
          >
            <InfiniteScroll
              dataLength={artistResults.length}
              next={() => setPage((p) => p + 1)}
              hasMore={hasMore && !isFetching}
              loader={
                <div className="px-4 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              }
              scrollableTarget="artist-scrollable-list"
            >
              <ul>
                {artistResults.map((artist) => (
                  <li
                    key={artist.id}
                    onClick={() => handleSelect(artist)}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                  >
                    {artist.artistName} ({artist.email})
                  </li>
                ))}
              </ul>
              {isLoading && artistResults.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              )}
              {!isLoading && artistResults.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No artists found.
                </div>
              )}
            </InfiniteScroll>
          </div>
        </div>
      )}
    </div>
  );
}
