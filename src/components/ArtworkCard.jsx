import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
// import { format } from "date-fns";
import { formatPrice, formatLocalDateTime } from "../utils/formatters";
// import { getThumbnailUrl } from "../config/cloudinary";
import useOptimizedImage from "../hooks/useOptimizedImage";
import ArtworkActions from "./ArtworkActions";
import Badge from "./Badge";
import { useAuth } from "../contexts/AuthContext";
import PurchaseRequestModal from "./PurchaseRequestModal";

export default function ArtworkCard({
  artwork,
  onDelete,
  onQuickView,
  priority = false,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const descriptionRef = useRef(null);
  const { isSuperAdmin, isArtist, user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Use our custom hook for optimized image loading
  const {
    previewUrl,
    fullSizeUrl,
    isLoading,
    isError,
    highQualityLoaded,
    getSrcSet,
  } = useOptimizedImage(artwork.cloudinary_public_id, {
    lazy: !priority,
    width: 600,
    quality: 80,
  });

  // Check if text is truncated
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  useEffect(() => {
    // Check if description is truncated
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [artwork.title, artwork.description]);

  // Intersection Observer for lazy loading - only if not priority
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.disconnect();
      }
    };
  }, [priority]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    if (artwork.url && e.target.src !== artwork.url) {
      e.target.src = artwork.url;
    } else {
      setImageError(true);
    }
  };

  useEffect(() => {
    if (isError) {
      setImageError(true);
    }
  }, [isError]);

  // Safe fallbacks for missing data
  const safeArtwork = {
    title: artwork.title || "Untitled",
    artist: artwork.artist || "Unknown Artist",
    year: artwork.year || "Year Unknown",
    price: artwork.price || 0,
    description: artwork.description || "",
    style: artwork.style || "Style Unknown",
    material: artwork.material || "Material Unknown",
    dimensions: artwork.dimensions || "Dimensions Unknown",
    ...artwork,
  };

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && artwork.userId && user.id === artwork.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (artwork.status && artwork.status !== "ACTIVE");

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(67,56,202,0.15)] transition-all duration-300 
        h-[680px] flex flex-col justify-between overflow-hidden`}
    >
      {/* Status Indicators */}
      <div className="absolute top-4 left-4 z-[5] flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
        {safeArtwork.featured && (
          <Badge type="featured" animate withPing>
            <span className="inline-flex items-center">
              <StarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Featured</span>
            </span>
          </Badge>
        )}
        {safeArtwork.sold && (
          <Badge type="sold" animate withPing>
            <span className="truncate">Sold</span>
          </Badge>
        )}
      </div>

      {/* Add status badge */}
      {artwork.status && canSeeStatusBadge && (
        <div className="absolute top-4 right-4 z-10">
          <Badge
            type={
              artwork.status === "ACTIVE"
                ? "active"
                : artwork.status === "INACTIVE"
                ? "inactive"
                : artwork.status === "EXPIRED"
                ? "expired"
                : "default"
            }
            animate
            withPing
          >
            {artwork.status === "EXPIRED"
              ? artwork.expiredBy === "admin"
                ? "Expired (admin)"
                : artwork.expiredBy === "auto"
                ? "Expired (auto)"
                : "Expired"
              : artwork.status.charAt(0) +
                artwork.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      )}

      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative h-[320px] rounded-t-2xl overflow-hidden bg-white flex-shrink-0"
      >
        {imageError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Image not available</p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}

            {/* Only load image when in viewport */}
            {isVisible && (
              <picture>
                {/* WebP format for browsers that support it */}
                <source
                  type="image/webp"
                  srcSet={getSrcSet([300, 600, 900])}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Low quality image placeholder while loading */}
                {!highQualityLoaded && previewUrl && (
                  <img
                    src={previewUrl}
                    alt={safeArtwork.title}
                    className="absolute inset-0 h-full w-full object-cover blur-sm transition-opacity duration-300"
                    style={{ opacity: highQualityLoaded ? 0 : 0.8 }}
                  />
                )}

                {/* Main image */}
                <img
                  ref={imageRef}
                  src={fullSizeUrl || safeArtwork.url}
                  alt={safeArtwork.title}
                  className={`w-full h-full object-cover transform transition-all duration-700 group-hover:scale-110 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  loading={priority ? "eager" : "lazy"}
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </>
        )}

        {/* Overlay Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex gap-2 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(safeArtwork);
              }}
              className="flex-1 min-w-[120px] max-w-[140px] px-4 py-2 text-sm font-sans font-medium text-white bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-lg"
            >
              Quick View
            </motion.button>
            <Link
              to={`/artwork/${safeArtwork.id}`}
              className="flex-1 min-w-[120px] max-w-[140px] px-4 py-2 text-sm font-sans font-medium text-white bg-indigo-500/80 backdrop-blur-sm rounded-lg hover:bg-indigo-600/80 transition-colors text-center shadow-lg"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`relative p-6 flex-grow bg-white overflow-auto ${
          !isSuperAdmin && "rounded-b-2xl"
        }`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white to-white pointer-events-none ${
            !isSuperAdmin && "rounded-b-2xl"
          }`}
        />
        <div className="relative h-full flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <Link
                to={`/artwork/${safeArtwork.id}`}
                className="block group/title"
              >
                <h3
                  className="font-artistic text-2xl font-bold text-gray-900 tracking-wide group-hover/title:text-indigo-600 transition-colors leading-tight truncate whitespace-nowrap overflow-hidden"
                  title={safeArtwork.title}
                >
                  {safeArtwork.title}
                </h3>
              </Link>
              <div className="mt-2 flex items-center text-base font-sans flex-wrap gap-1">
                <div className="relative group">
                  <span className="font-artistic text-lg text-indigo-600 group-hover:text-indigo-700 transition-colors break-words">
                    {safeArtwork.artistName ||
                      safeArtwork.artist ||
                      safeArtwork.artistEmail ||
                      "Unknown Artist"}
                    {safeArtwork.artistEmail && (
                      <span className="text-gray-500 text-sm font-sans ml-2">
                        ({safeArtwork.artistEmail})
                      </span>
                    )}
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </div>
                <span className="mx-2 text-gray-300 flex-shrink-0">•</span>
                <span className="text-gray-600 flex-shrink-0 font-sans">
                  {safeArtwork.year}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <p className="font-artistic text-2xl font-bold text-indigo-600 tracking-wide text-right">
                {formatPrice(safeArtwork.price)}
              </p>
            </div>
          </div>

          {safeArtwork.description && (
            <div className="mb-4">
              <p
                ref={descriptionRef}
                className={`font-sans text-base text-gray-600 leading-relaxed ${
                  showFullDescription ? "" : "line-clamp-3"
                }`}
              >
                {safeArtwork.description}
              </p>
              {isDescriptionTruncated && !showFullDescription && (
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 font-sans"
                >
                  Read more
                </button>
              )}
              {showFullDescription && isDescriptionTruncated && (
                <button
                  onClick={() => setShowFullDescription(false)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 font-sans"
                >
                  Read less
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pb-4 mt-auto">
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100"
              title={safeArtwork.style}
            >
              {safeArtwork.style}
            </span>
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100"
              title={safeArtwork.material}
            >
              {safeArtwork.material}
            </span>
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100"
              title={safeArtwork.dimensions}
            >
              {safeArtwork.dimensions}
            </span>
            {safeArtwork.createdAt && (
              <span className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100">
                Added: {formatLocalDateTime(safeArtwork.createdAt)}
              </span>
            )}
            {/* Expiry date for super admin or owner */}
            {safeArtwork.expiresAt &&
              (isSuperAdmin || (isArtist && isOwner)) && (
                <span className="px-3 py-1 text-sm font-sans font-medium bg-white text-red-700 rounded-full shadow-sm border border-red-100">
                  Expires: {formatLocalDateTime(safeArtwork.expiresAt)}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Purchase Request Button - only for public (not authenticated) users */}
      {!safeArtwork.sold && !user && (
        <div className="border-t border-gray-100 px-4 py-4 bg-white flex flex-col items-end">
          <button
            className="w-full sm:w-auto max-w-60 px-6 py-2 rounded-xl bg-indigo-600 text-white font-sans font-semibold shadow hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setShowPurchaseModal(true)}
          >
            Request to Purchase
          </button>
        </div>
      )}

      {/* Action Buttons - Fixed position at bottom */}
      {(isSuperAdmin || (isArtist && isOwner)) && (
        <div className="p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          <div className="flex justify-end">
            <ArtworkActions
              artworkId={safeArtwork.id}
              onDelete={onDelete}
              artwork={safeArtwork}
            />
          </div>
        </div>
      )}

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={artwork.id}
        artworkTitle={safeArtwork.title}
      />
    </motion.div>
  );
}
