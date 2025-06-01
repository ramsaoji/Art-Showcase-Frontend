import { useState } from "react";
import { Link } from "react-router-dom";
import ImageModal from "../components/ImageModal";
import { PhotoIcon } from "@heroicons/react/24/outline";

const featuredArtworks = [
  {
    id: 1,
    title: "Abstract Harmony in Blue",
    artist: "Elena Rodriguez",
    url: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    url: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3",
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
    url: "https://images.unsplash.com/photo-1574182245530-967d9b3831af?ixlib=rb-4.0.3",
    price: 3200,
    description:
      "A mesmerizing piece that blends traditional methods with contemporary vision, creating an atmosphere of ethereal beauty.",
    dimensions: "90x120 cm",
    material: "Mixed Media",
    year: 2024,
    style: "Modern",
  },
  // Add more featured artworks here
];

export default function Featured() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleImageError = (artworkId) => {
    setImageErrors((prev) => ({ ...prev, [artworkId]: true }));
  };

  const handlePrevious = () => {
    const currentIndex = featuredArtworks.findIndex(
      (art) => art.id === selectedArtwork?.id
    );
    if (currentIndex > 0) {
      setSelectedArtwork(featuredArtworks[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = featuredArtworks.findIndex(
      (art) => art.id === selectedArtwork?.id
    );
    if (currentIndex < featuredArtworks.length - 1) {
      setSelectedArtwork(featuredArtworks[currentIndex + 1]);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Artworks
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Explore our handpicked selection of exceptional pieces.
            </p>
          </div>
          <Link
            to="/gallery"
            className="hidden sm:flex items-center text-indigo-600 hover:text-indigo-500"
          >
            View all artworks
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredArtworks.map((artwork) => (
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
      </div>

      <ImageModal
        isOpen={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        image={selectedArtwork || {}}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={
          selectedArtwork &&
          featuredArtworks.findIndex((art) => art.id === selectedArtwork.id) > 0
        }
        hasNext={
          selectedArtwork &&
          featuredArtworks.findIndex((art) => art.id === selectedArtwork.id) <
            featuredArtworks.length - 1
        }
      />
    </div>
  );
}
