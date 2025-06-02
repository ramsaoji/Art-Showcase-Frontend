import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { ShareIcon, PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { getOptimizedImageUrl } from "../config/cloudinary";
import { formatPrice } from "../utils/formatters";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Loader from "../components/ui/Loader";

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert type="error" message={error} className="max-w-md mx-auto" />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert
          type="warning"
          message="Artwork not found. The artwork might have been removed or is no longer available."
          className="max-w-md mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="md:flex">
            <div className="md:flex-1">
              {imageError ? (
                <div className="w-full h-[300px] md:h-[600px] bg-gray-50/50 flex flex-col items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                  <p className="mt-2 text-sm font-sans text-gray-500">
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
                    className={`w-full h-[300px] md:h-[600px] object-contain bg-gray-50/50 ${
                      artwork.sold ? "opacity-90" : ""
                    }`}
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                      if (artwork.public_id && e.target.src !== artwork.url) {
                        e.target.src = artwork.url;
                      } else {
                        setImageError(true);
                      }
                    }}
                  />
                  <div className="absolute top-4 right-4 z-30 flex gap-2">
                    {artwork.featured && (
                      <Badge type="featured" variant="overlay">
                        <span className="inline-flex items-center">
                          <StarIcon className="h-4 w-4 mr-1" />
                          Featured
                        </span>
                      </Badge>
                    )}
                    {artwork.sold && (
                      <Badge type="sold" variant="overlay">
                        Sold
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 md:p-8 md:flex-1">
              <div className="flex items-center justify-between mb-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide"
                >
                  {artwork.title}
                </motion.h1>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Share artwork"
                >
                  <ShareIcon className="h-6 w-6" />
                </motion.button>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="relative group inline-block">
                  <span className="font-artistic text-2xl text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    {artwork.artist}
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-8"
              >
                <p className="font-sans text-lg text-gray-700 leading-relaxed">
                  {artwork.description}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                    <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                      Year
                    </h3>
                    <p className="text-lg font-sans text-gray-900">
                      {artwork.year}
                    </p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                    <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                      Style
                    </h3>
                    <p className="text-lg font-sans text-gray-900">
                      {artwork.style}
                    </p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                    <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                      Dimensions
                    </h3>
                    <p className="text-lg font-sans text-gray-900">
                      {artwork.dimensions}
                    </p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                    <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                      Material
                    </h3>
                    <p className="text-lg font-sans text-gray-900">
                      {artwork.material}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  {artwork.price && (
                    <div>
                      <p className="font-artistic text-3xl font-bold text-indigo-600 tracking-wide">
                        {formatPrice(artwork.price)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <Link
                  to="/gallery"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-sans font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Gallery
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <Alert
          type="success"
          message="Link copied to clipboard!"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg"
          animate={true}
        />
      )}
    </div>
  );
}
