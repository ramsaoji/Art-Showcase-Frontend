import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import ImageModal from "../components/ImageModal";
import ArtworkActions from "../components/ArtworkActions";
import { formatPrice } from "../utils/formatters";
import { getOptimizedImageUrl } from "../config/cloudinary";

export default function Home() {
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedArtworks = async () => {
      setLoading(true);
      try {
        console.log("Fetching featured artworks...");

        // Get all artworks ordered by creation time
        const artworksQuery = query(
          collection(db, "artworks"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(artworksQuery);

        // Convert and filter the documents
        const allArtworks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));

        console.log("All artworks:", allArtworks);

        // Filter featured artworks and take only the first 3
        const featuredArtworks = allArtworks
          .filter((artwork) => artwork.featured === true)
          .slice(0, 3);

        console.log("Featured artworks:", featuredArtworks);
        setFeaturedArtworks(featuredArtworks);
      } catch (error) {
        console.error("Error loading featured artworks:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedArtworks();
  }, []);

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

  const handleDelete = (deletedId) => {
    setFeaturedArtworks((prev) => prev.filter((art) => art.id !== deletedId));
    if (selectedArtwork?.id === deletedId) {
      setSelectedArtwork(null);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
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
            Discover Unique Artworks
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-100">
            Explore our curated collection of exceptional pieces from talented
            artists around the world.
          </p>
          <div className="mt-10 flex gap-x-6">
            <Link
              to="/gallery"
              className="rounded-md bg-indigo-600 px-3.5 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Browse Gallery
            </Link>
            <Link
              to="/about"
              className="rounded-md bg-white/10 px-3.5 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-semibold text-white hover:bg-white/20"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Artworks Section */}
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

        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : featuredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No featured artworks
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for our featured collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredArtworks.map((artwork) => (
              <div
                key={artwork.id}
                className="group bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="relative aspect-w-4 aspect-h-3 bg-gray-100 overflow-hidden">
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
                        className={`w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500 ${
                          artwork.sold ? "opacity-90" : ""
                        }`}
                        onError={(e) => {
                          console.error("Image failed to load:", e);
                          if (
                            artwork.public_id &&
                            e.target.src !== artwork.url
                          ) {
                            e.target.src = artwork.url; // Try fallback to direct URL
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
                        <p className="text-sm font-medium">
                          {artwork.material}
                        </p>
                        <p className="text-sm opacity-90">
                          {artwork.dimensions}
                        </p>
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

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {artwork.style}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Featured
                      </span>
                      {artwork.sold && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Sold
                        </span>
                      )}
                    </div>
                    <ArtworkActions
                      artworkId={artwork.id}
                      onDelete={handleDelete}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

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

      <ImageModal
        isOpen={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        image={selectedArtwork}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={
          featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          ) > 0
        }
        hasNext={
          featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          ) <
          featuredArtworks.length - 1
        }
      />
    </div>
  );
}
