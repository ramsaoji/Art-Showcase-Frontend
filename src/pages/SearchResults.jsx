import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PhotoIcon } from "@heroicons/react/24/outline";
import ImageModal from "../components/ImageModal";

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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
        <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((artwork) => (
            <article
              key={artwork.id}
              className="group relative bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div
                className="relative aspect-h-3 aspect-w-4 cursor-pointer"
                onClick={() => handleArtworkClick(artwork)}
              >
                {imageErrors[artwork.id] ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                    <PhotoIcon className="h-16 w-16" />
                    <p className="mt-2 text-sm">Image not available</p>
                  </div>
                ) : (
                  <img
                    src={artwork.url}
                    alt={artwork.title}
                    className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300"
                    onError={() => handleImageError(artwork.id)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-full">
                    View Details
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {artwork.title}
                  </h2>
                  <p className="text-lg font-medium text-indigo-600">
                    {formatPrice(artwork.price)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">{artwork.artist}</p>
                  <p className="text-sm text-gray-500">
                    {artwork.material} • {artwork.dimensions}
                  </p>
                  <p className="text-sm text-gray-500">
                    {artwork.style} • {artwork.year}
                  </p>
                </div>
                <p className="mt-4 text-gray-600 line-clamp-2">
                  {artwork.description}
                </p>
              </div>
            </article>
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
