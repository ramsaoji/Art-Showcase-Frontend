import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import ImageModal from "../components/ImageModal";
import ArtworkActions from "../components/ArtworkActions";
import { formatPrice } from "../utils/formatters";
import { getOptimizedImageUrl } from "../config/cloudinary";

export default function Featured() {
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [error, setError] = useState(null);

  const loadFeaturedArtworks = async () => {
    setLoading(true);
    try {
      console.log("Fetching featured artworks...");

      const artworksQuery = query(
        collection(db, "artworks"),
        where("featured", "==", true)
      );

      const querySnapshot = await getDocs(artworksQuery);
      console.log(`Found ${querySnapshot.size} featured artworks`);

      const artworks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      setFeaturedArtworks(artworks);
      setError(null);
    } catch (error) {
      console.error("Error loading featured artworks:", error);
      setError("Failed to load featured artworks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedArtworks();
  }, []);

  const handleImageClick = (artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleImageError = (artworkId) => {
    setImageErrors((prev) => ({ ...prev, [artworkId]: true }));
  };

  const handlePrevious = () => {
    const currentIndex = featuredArtworks.findIndex(
      (artwork) => artwork.id === selectedArtwork?.id
    );
    if (currentIndex > 0) {
      setSelectedArtwork(featuredArtworks[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = featuredArtworks.findIndex(
      (artwork) => artwork.id === selectedArtwork?.id
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Featured Artworks
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Discover our specially curated collection of exceptional pieces
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
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
                      if (artwork.public_id && e.target.src !== artwork.url) {
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
