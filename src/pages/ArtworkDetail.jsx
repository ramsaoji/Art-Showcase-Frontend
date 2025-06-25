import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { ShareIcon, PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { getOptimizedImageUrl, getPreviewUrl } from "../config/cloudinary";
import { formatPrice, formatLocalDateTime } from "../utils/formatters";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Loader from "../components/ui/Loader";
import { trackArtworkView, trackShare } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import PurchaseRequestModal from "../components/PurchaseRequestModal";

export default function ArtworkDetail() {
  const { id } = useParams();
  const [showShareToast, setShowShareToast] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isSuperAdmin, isArtist, user } = useAuth();
  // const [imageLoading, setImageLoading] = useState(true);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Use tRPC query to fetch artworks
  const {
    data: artwork,
    isLoading,
    error,
  } = trpc.artwork.getArtworkById.useQuery({ id }, { enabled: !!id });

  useEffect(() => {
    if (artwork) {
      trackArtworkView(artwork.id, artwork.title);
    }
  }, [artwork]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.share({
        title: artwork?.title,
        text: `Check out "${artwork?.title}" by ${artwork?.artist}`,
        url: shareUrl,
      });
      // Track successful share
      trackShare(artwork.id, "native_share");
    } catch (error) {
      // Fallback to clipboard copy if native share is not supported
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
        // Track clipboard share
        trackShare(artwork.id, "clipboard");
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
      }
    }
  };

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && artwork?.userId && user.id === artwork.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (artwork?.status && artwork.status !== "ACTIVE");

  if (isLoading) {
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="relative flex-1 flex items-center justify-center bg-gray-50/50 min-h-[50vh] lg:min-h-[70vh]">
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                  <PhotoIcon className="h-16 w-16 mb-4" />
                  <p className="text-lg font-sans">Image not available</p>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {/* Loader overlay while loading */}
                  {/* {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                      <Loader size="large" />
                    </div>
                  )} */}
                  {/* Blurred preview image */}
                  {artwork.cloudinary_public_id &&
                    !highQualityLoaded &&
                    !imageError && (
                      <img
                        src={getPreviewUrl(artwork.cloudinary_public_id)}
                        alt={artwork.title}
                        className={`max-w-full max-h-full object-contain blur-md transition-opacity duration-300 absolute inset-0 w-full h-full ${
                          highQualityLoaded ? "opacity-0" : "opacity-80"
                        }`}
                        style={{ zIndex: 1 }}
                      />
                    )}
                  {/* High quality image */}
                  <img
                    src={
                      artwork.cloudinary_public_id
                        ? getOptimizedImageUrl(artwork.cloudinary_public_id)
                        : artwork.url
                    }
                    alt={artwork.title}
                    className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
                      artwork.sold ? "opacity-90" : ""
                    } ${highQualityLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => {
                      setHighQualityLoaded(true);
                      // setImageLoading(false);
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                      if (
                        artwork.cloudinary_public_id &&
                        e.target.src !== artwork.url
                      ) {
                        e.target.src = artwork.url;
                      } else {
                        setImageError(true);
                        // setImageLoading(false);
                      }
                    }}
                    style={{
                      zIndex: 2,
                      display: imageError ? "none" : "block",
                    }}
                  />
                </div>
              )}

              {/* Badges overlay */}
              <div className="absolute top-6 right-6 z-30 flex gap-2 flex-row items-center">
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
                {/* Status badge: only for allowed users */}
                {artwork.status && canSeeStatusBadge && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-sans
                      ${
                        artwork.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                      ${
                        artwork.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-700"
                          : ""
                      }
                      ${
                        artwork.status === "EXPIRED"
                          ? "bg-red-100 text-red-700"
                          : ""
                      }
                    `}
                  >
                    {artwork.status === "EXPIRED"
                      ? artwork.expiredBy === "admin"
                        ? "Expired (admin)"
                        : artwork.expiredBy === "auto"
                        ? "Expired (auto)"
                        : "Expired"
                      : artwork.status.charAt(0) +
                        artwork.status.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-shrink-0 w-full lg:w-96 xl:w-[32rem] bg-white/95 p-6 sm:p-8 flex flex-col">
              {/* Header with title and share button */}
              <div className="flex items-start justify-between mb-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-artistic text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-wide pr-4"
                >
                  {/* Title and status */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {artwork.title}
                    </h1>
                  </div>
                </motion.h1>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Share artwork"
                >
                  <ShareIcon className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Artist */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="relative group inline-block">
                  <span className="font-artistic text-xl sm:text-2xl text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    {artwork.artistName}
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </div>
              </motion.div>

              {/* Price */}
              {artwork.price && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-6"
                >
                  <p className="font-artistic text-2xl sm:text-3xl font-bold text-indigo-600 tracking-wide">
                    {formatPrice(artwork.price)}
                  </p>
                </motion.div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-8"
                >
                  {/* Description */}
                  {artwork.description && (
                    <div>
                      <h3 className="text-sm font-sans font-medium text-gray-500 mb-2">
                        Description
                      </h3>
                      <p className="font-sans text-base sm:text-lg text-gray-700 leading-relaxed">
                        {artwork.description}
                      </p>
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {artwork.year && (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Year
                        </h3>
                        <p className="text-base sm:text-lg font-sans text-gray-900">
                          {artwork.year}
                        </p>
                      </div>
                    )}

                    {artwork.style && (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Style
                        </h3>
                        <p className="text-base sm:text-lg font-sans text-gray-900">
                          {artwork.style}
                        </p>
                      </div>
                    )}

                    {artwork.material && (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Material
                        </h3>
                        <p className="text-base sm:text-lg font-sans text-gray-900">
                          {artwork.material}
                        </p>
                      </div>
                    )}

                    {artwork.dimensions && (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Dimensions
                        </h3>
                        <p className="text-base sm:text-lg font-sans text-gray-900">
                          {artwork.dimensions}
                        </p>
                      </div>
                    )}

                    {artwork.createdAt && (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100 sm:col-span-2">
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Added
                        </h3>
                        <p className="text-base sm:text-lg font-sans text-gray-900">
                          {formatLocalDateTime(artwork.createdAt)}
                        </p>
                      </div>
                    )}
                    {/* Expiry date for super admin or owner */}
                    {artwork.expiresAt &&
                      (isSuperAdmin || (isArtist && isOwner)) && (
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-red-100 sm:col-span-2">
                          <h3 className="text-sm font-sans font-medium text-red-700 mb-1">
                            Expires
                          </h3>
                          <p className="text-base sm:text-lg font-sans text-red-700">
                            {formatLocalDateTime(artwork.expiresAt)}
                          </p>
                        </div>
                      )}
                  </div>
                </motion.div>
              </div>

              {/* Purchase Request Button - below details, above back link */}
              {!isOwner && !artwork.sold && (
                <div className="border-t border-gray-100 py-4 flex flex-col items-start">
                  <button
                    className="w-full sm:w-auto max-w-60 px-6 py-2 rounded-xl bg-indigo-600 text-white font-sans font-semibold shadow hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => setShowPurchaseModal(true)}
                  >
                    Request to Purchase
                  </button>
                </div>
              )}

              {/* Back to gallery link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-6 border-t border-gray-200"
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
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg z-50"
          animate={true}
        />
      )}

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={artwork.id}
        artworkTitle={artwork.title}
      />
    </div>
  );
}
