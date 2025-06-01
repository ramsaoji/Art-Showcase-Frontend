import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import ImageModal from "../components/ImageModal";

const featuredArtworks = [
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

export default function Home() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const handleArtworkClick = (artwork, e) => {
    e.preventDefault(); // Prevent navigation
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
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1577720643272-265f09367456?ixlib=rb-4.0.3"
            alt="Modern art gallery"
          />
          <div className="absolute inset-0 bg-gray-500 mix-blend-multiply" />
        </div>
        <div className="relative mx-auto max-w-7xl py-24 px-6 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover Exceptional Art
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-100">
            Explore our curated collection of contemporary artworks from
            emerging and established artists around the world.
          </p>
          <div className="mt-10 flex gap-x-6">
            <Link
              to="/gallery"
              className="rounded-md bg-indigo-600 px-3.5 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Explore Gallery
            </Link>
            <Link
              to="/about"
              className="rounded-md bg-white px-3.5 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Featured section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Artworks
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Discover our handpicked selection of exceptional pieces.
            </p>
          </div>
          <Link
            to="/featured"
            className="hidden sm:flex items-center text-indigo-600 hover:text-indigo-500"
          >
            View all featured works
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {featuredArtworks.map((artwork) => (
            <div key={artwork.id} className="group relative">
              <div
                className="aspect-h-3 aspect-w-4 overflow-hidden rounded-lg cursor-pointer"
                onClick={(e) => handleArtworkClick(artwork, e)}
              >
                {imageErrors[artwork.id] ? (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={artwork.url}
                    alt={artwork.title}
                    className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300"
                    onError={() => handleImageError(artwork.id)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-xl font-semibold">{artwork.title}</h3>
                <p className="mt-1">{artwork.artist}</p>
                <p className="mt-1 font-medium">{formatPrice(artwork.price)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center sm:hidden">
          <Link
            to="/featured"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            View all featured works
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Artist spotlight */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Artist Spotlight
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Meet our featured artists and discover their unique
                perspectives, techniques, and inspirations.
              </p>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <img
                  className="rounded-lg object-cover h-64"
                  src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3"
                  alt="Artist at work"
                />
                <img
                  className="rounded-lg object-cover h-64"
                  src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-4.0.3"
                  alt="Artist studio"
                />
              </div>
            </div>
          </div>
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
