import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { ShareIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { getOptimizedImageUrl } from "../config/cloudinary";
import { formatPrice } from "../utils/formatters";

export default function ArtworkDetail() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function fetchArtwork() {
      try {
        const docRef = doc(db, "artworks", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const artworkData = { id: docSnap.id, ...docSnap.data() };
          console.log("Fetched artwork data:", artworkData);
          setArtwork(artworkData);
        } else {
          setError("Artwork not found");
        }
      } catch (err) {
        console.error("Error fetching artwork:", err);
        setError("Failed to load artwork");
      } finally {
        setLoading(false);
      }
    }

    fetchArtwork();
  }, [id]);

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `Check out "${artwork.title}" by ${artwork.artist}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Link to="/gallery" className="text-indigo-600 hover:text-indigo-800">
          Return to Gallery
        </Link>
      </div>
    );
  }

  if (!artwork) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-1">
            {imageError ? (
              <div className="w-full h-[300px] md:h-[600px] bg-gray-50 flex flex-col items-center justify-center">
                <PhotoIcon className="h-16 w-16 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Image not available
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={
                    artwork.public_id
                      ? getOptimizedImageUrl(artwork.public_id)
                      : artwork.url
                  }
                  alt={artwork.title}
                  className={`w-full h-[300px] md:h-[600px] object-contain bg-gray-50 ${
                    artwork.sold ? "opacity-90" : ""
                  }`}
                  onError={(e) => {
                    console.error("Image failed to load:", e);
                    if (artwork.public_id && e.target.src !== artwork.url) {
                      e.target.src = artwork.url; // Try fallback to direct URL
                    } else {
                      setImageError(true); // If direct URL also fails, show error UI
                    }
                  }}
                />
                {artwork.sold && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 text-red-600 border border-red-200 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                      Sold
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-6 md:p-8 md:flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {artwork.title}
              </h1>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                title="Share artwork"
              >
                <ShareIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-xl text-gray-600 mb-4">by {artwork.artist}</p>
            <div className="space-y-4">
              <p className="text-gray-700">{artwork.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year</h3>
                  <p className="mt-1 text-gray-900">{artwork.year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Style</h3>
                  <p className="mt-1 text-gray-900">{artwork.style}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Dimensions
                  </h3>
                  <p className="mt-1 text-gray-900">{artwork.dimensions}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Material
                  </h3>
                  <p className="mt-1 text-gray-900">{artwork.material}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {artwork.price && (
                  <div className="mt-6">
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatPrice(artwork.price)}
                    </p>
                  </div>
                )}
                {artwork.sold && (
                  <div className="mt-6">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-red-100 text-red-800">
                      Sold
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8">
              <Link
                to="/gallery"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}
