import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PhotoIcon } from "@heroicons/react/24/outline";
import ImageModal from "../components/ImageModal";
import { formatPrice } from "../utils/formatters";
import { Link } from "react-router-dom";
import ArtworkActions from "../components/ArtworkActions";

const generateSearchResults = (query) => {
  // This is a mock function - in a real app, this would be an API call
  const artworks = [
    {
      id: 1,
      title: "Abstract Harmony in Blue",
      artist: "Elena Rodriguez",
      url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3",
      price: 2400,
      description:
        "A stunning exploration of color and form, this piece captures the essence of modern expression through bold strokes and dynamic composition.",
      dimensions: "80x100 cm",
      material: "Oil on Canvas",
      year: 2024,
      style: "Abstract",
    },
    {
      id: 2,
      title: "Urban Dreams",
      artist: "Michael Chen",
      url: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?ixlib=rb-4.0.3",
      price: 1800,
      description:
        "An elegant composition that explores the relationship between light and shadow in contemporary urban spaces.",
      dimensions: "60x80 cm",
      material: "Acrylic",
      year: 2024,
      style: "Contemporary",
    },
    {
      id: 3,
      title: "Ethereal Light",
      artist: "Sarah Johnson",
      url: "https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3",
      price: 3200,
      description:
        "A mesmerizing piece that blends traditional methods with contemporary vision, creating an atmosphere of ethereal beauty.",
      dimensions: "90x120 cm",
      material: "Mixed Media",
      year: 2024,
      style: "Modern",
    },
  ];

  // Filter artworks based on search query
  return artworks.filter((artwork) =>
    Object.values(artwork).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(query.toLowerCase())
    )
  );
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const searchResults = generateSearchResults(query);
      setResults(searchResults);
      setLoading(false);
    }, 500);
  }, [query]);

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleImageError = (artworkId) => {
    setImageErrors((prev) => ({ ...prev, [artworkId]: true }));
  };

  const handlePrevious = () => {
    const currentIndex = results.findIndex(
      (art) => art.id === selectedArtwork?.id
    );
    if (currentIndex > 0) {
      setSelectedArtwork(results[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = results.findIndex(
      (art) => art.id === selectedArtwork?.id
    );
    if (currentIndex < results.length - 1) {
      setSelectedArtwork(results[currentIndex + 1]);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        Search Results
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {loading
          ? "Searching..."
          : results.length === 0
          ? "No results found"
          : `Found ${results.length} result${
              results.length === 1 ? "" : "s"
            } for "${query}"`}
      </p>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or browse our gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {results.map((artwork) => (
            <div
              key={artwork.id}
              className="group bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="relative h-[300px] bg-gray-100 overflow-hidden">
                {imageErrors[artwork.id] ? (
                  <div className="flex items-center justify-center h-full">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                ) : (
                  <>
                    <img
                      src={
                        artwork.public_id
                          ? getOptimizedImageUrl(artwork.public_id)
                          : artwork.url
                      }
                      alt={artwork.title}
                      className={`w-full h-full object-cover object-center ${
                        artwork.sold ? "opacity-90" : ""
                      }`}
                      onError={(e) => {
                        if (artwork.public_id && e.target.src !== artwork.url) {
                          e.target.src = artwork.url;
                        } else {
                          handleImageError(artwork.id);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:block hidden" />
                    {artwork.sold && (
                      <div className="absolute top-2 right-2 z-20">
                        <div className="inline-flex bg-white/90 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-medium shadow-sm ml-2">
                          Sold
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSelectedArtwork(artwork);
                        }}
                        className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/60 transition-colors duration-200 sm:opacity-0 sm:group-hover:opacity-100 z-30"
                      >
                        Quick View
                      </button>
                    </div>
                    <Link
                      to={`/artwork/${artwork.id}`}
                      className="absolute inset-0 z-10"
                    >
                      <span className="sr-only">
                        View details for {artwork.title}
                      </span>
                    </Link>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/70 to-transparent sm:bg-none">
                      <p className="text-sm font-medium">{artwork.material}</p>
                      <p className="text-sm opacity-90">{artwork.dimensions}</p>
                    </div>
                  </>
                )}
              </div>

              <Link to={`/artwork/${artwork.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors duration-300">
                      {artwork.title}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-sm font-medium text-gray-600">
                        By {artwork.artist}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {artwork.year}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-bold text-indigo-600">
                      {formatPrice(artwork.price)}
                    </p>
                  </div>
                </div>

                {artwork.description && (
                  <div className="mt-3 mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {artwork.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {artwork.style}
                    </span>
                    {artwork.featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Featured
                      </span>
                    )}
                    {artwork.sold && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Sold
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <ArtworkActions
                      artworkId={artwork.id}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <ImageModal
        isOpen={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        image={selectedArtwork || {}}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={
          selectedArtwork &&
          results.findIndex((art) => art.id === selectedArtwork.id) > 0
        }
        hasNext={
          selectedArtwork &&
          results.findIndex((art) => art.id === selectedArtwork.id) <
            results.length - 1
        }
      />
    </div>
  );
}
